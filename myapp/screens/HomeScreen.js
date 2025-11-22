// HomeScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Alert, TextInput, ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { API } from "../api";
import RadialProgressChart from "../components/RadialProgressChart";

/* ======================================================
   START
====================================================== */
export default function HomeScreen({ navigation }) {

  /* ---------------- STATES ---------------- */
  const [entriesByMeal, setEntriesByMeal] = useState({ เช้า: [], กลางวัน: [], เย็น: [] });

  const [profile, setProfile] = useState(null);

  const [goalKcal, setGoalKcal] = useState(2500);
  const [goalProtein, setGoalProtein] = useState(150);
  const [goalCarb, setGoalCarb] = useState(250);
  const [goalFat, setGoalFat] = useState(70);

  const [goalModal, setGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState({
    kcal: "2500",
    protein: "150",
    carb: "250",
    fat: "70",
  });

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("เช้า");

  const [todayText, setTodayText] = useState("");

  /* ---------------- วันที่วันนี้ ---------------- */
  const updateTodayText = () => {
    const now = new Date();
    const months = [
      "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
      "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"
    ];
    setTodayText(`วันนี้ · ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
  };

  useEffect(() => updateTodayText(), []);

  const isoToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  /* ---------------- โหลดโปรไฟล์ ---------------- */
  const loadProfile = async () => {
    try {
      const { data } = await API.get("/profiles/me");
      setProfile(data);
    } catch (err) {
      console.log("LOAD PROFILE ERROR:", err.message);
    }
  };

  /* ---------------- โหลดอาหารวันนี้ ---------------- */
  const loadTodayMeals = async () => {
    try {
      const { data } = await API.get("/meals", { params: { date: isoToday() } });

      const grouped = { เช้า: [], กลางวัน: [], เย็น: [] };

      (data || []).forEach((item) => {
        const meal = item.meal_time || "เช้า";
        grouped[meal].push({
          id: item.id,
          name: item.name,
          meal,
          kcal: Number(item.calories) || 0,
          protein: Number(item.protein) || 0,
          carb: Number(item.carb) || 0,
          fat: Number(item.fat) || 0,
        });
      });

      setEntriesByMeal(grouped);
    } catch (err) {
      Alert.alert("โหลดข้อมูลไม่สำเร็จ", err.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadTodayMeals();
    }, [])
  );

  /* ---------------- รวมโภชนาการ ---------------- */
  const allMeals = Object.values(entriesByMeal).flat();
  const totalProtein = allMeals.reduce((s, x) => s + x.protein, 0);
  const totalCarb = allMeals.reduce((s, x) => s + x.carb, 0);
  const totalFat = allMeals.reduce((s, x) => s + x.fat, 0);
  const totalKcal = allMeals.reduce((s, x) => s + x.kcal, 0);

  /* ---------------- คำนวณค่าทางโภชนาการ ---------------- */
  const calcAge = (dob) => {
    if (!dob) return "-";
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const calcBMI = (w, h) => (!w || !h ? "-" : (w / ((h / 100) ** 2)).toFixed(1));

  const calcBMR = (gender, w, h, age) => {
    if (!w || !h || !age) return "-";
    const base = 10 * w + 6.25 * h - 5 * age;
    if (gender === "male") return Math.round(base + 5);
    return Math.round(base - 161);
  };

  const calcTDEE = (bmr, lifestyle) => {
    if (!bmr) return "-";
    const factor = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      athlete: 1.9,
    }[lifestyle] || 1.2;
    return Math.round(bmr * factor);
  };

  const age = calcAge(profile?.date_of_birth);
  const bmi = calcBMI(profile?.current_weight, profile?.height);
  const bmr = calcBMR(profile?.gender, profile?.current_weight, profile?.height, age);
  const tdee = calcTDEE(bmr, profile?.lifestyle);

  /* Macro Targets */
  const proteinTarget = profile?.protein_target ?? Math.round(tdee * 0.30 / 4);
  const carbTarget    = profile?.carb_target ?? Math.round(tdee * 0.40 / 4);
  const fatTarget     = profile?.fat_target ?? Math.round(tdee * 0.30 / 9);

  /* ---------------- UI START ---------------- */
  const openMenuFor = (meal) => {
    setSelectedMeal(meal);
    setMenuVisible(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* =====================================================
          Section: พลังงานรวมวันนี้
      ===================================================== */}
      <Text style={styles.sectionHeader}>พลังงานรวมวันนี้</Text>

      <View style={styles.energyCard}>
        <RadialProgressChart
          size={160}
          value={totalKcal}
          goal={goalKcal}
          color="#FF6B6B"
          hideValue={true}
          hideLabel={true}
        />

        <View style={styles.energyInfo}>
          <Text style={styles.todayText}>{todayText}</Text>
          <Text style={styles.kcalBig}>{totalKcal} / {goalKcal}</Text>
          <Text style={styles.kcalUnit}>kcal</Text>

          <TouchableOpacity style={styles.goalBtn} onPress={() => setGoalModal(true)}>
            <Ionicons name="settings-outline" size={18} color="#333" />
            <Text style={styles.goalBtnText}>ตั้งค่าเป้าหมาย</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* =====================================================
          Section: สรุปโภชนาการวันนี้
      ===================================================== */}
      <Text style={styles.sectionHeader}>สรุปโภชนาการวันนี้</Text>

      <View style={styles.macroRow}>
        <MacroBox label="โปรตีน" color="#4A90E2" value={totalProtein} goal={goalProtein} />
        <MacroBox label="คาร์บ"   color="#F5C542" value={totalCarb}   goal={goalCarb} />
        <MacroBox label="ไขมัน"   color="#FF4FA7" value={totalFat}    goal={goalFat} />
      </View>

      {/* =====================================================
          Section: บันทึกรายการอาหาร
      ===================================================== */}
      <Text style={[styles.sectionHeader, { marginTop: 10 }]}>บันทึกรายการอาหาร</Text>

      <MealButton title="🍳 มื้อเช้า"    color="#FFE7C7" onPress={() => openMenuFor("เช้า")} />
      <MealButton title="🍛 มื้อกลางวัน" color="#FFF0D1" onPress={() => openMenuFor("กลางวัน")} />
      <MealButton title="🍲 มื้อเย็น"    color="#FFD7D7" onPress={() => openMenuFor("เย็น")} />

      {/* =====================================================
          Section: ค่าทางโภชนาการ
      ===================================================== */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ค่าทางโภชนาการของคุณ</Text>
        <InfoRow label="BMI" value={bmi} />
        <InfoRow label="BMR" value={`${bmr} kcal`} />
        <InfoRow label="TDEE" value={`${tdee} kcal`} />
      </View>

      {/* =====================================================
          Section: โภชนาการที่ควรได้รับต่อวัน
      ===================================================== */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>โภชนาการที่ควรได้รับต่อวัน</Text>
        <InfoRow label="พลังงานรวม" value={`${tdee} kcal`} />
        <InfoRow label="โปรตีน" value={`${proteinTarget} g`} />
        <InfoRow label="คาร์โบไฮเดรต" value={`${carbTarget} g`} />
        <InfoRow label="ไขมัน" value={`${fatTarget} g`} />
      </View>

      {/* =====================================================
          POPUP: ตั้งค่าเป้าหมาย
      ===================================================== */}
      <Modal transparent visible={goalModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            <Text style={styles.modalTitle}>ตั้งค่าเป้าหมาย</Text>

            <GoalInput label="พลังงาน (kcal)"
              value={goalInput.kcal}
              onChange={(v)=>setGoalInput({...goalInput, kcal:v})}
            />

            <GoalInput label="โปรตีน (g)"
              value={goalInput.protein}
              onChange={(v)=>setGoalInput({...goalInput, protein:v})}
            />

            <GoalInput label="คาร์โบไฮเดรต (g)"
              value={goalInput.carb}
              onChange={(v)=>setGoalInput({...goalInput, carb:v})}
            />

            <GoalInput label="ไขมัน (g)"
              value={goalInput.fat}
              onChange={(v)=>setGoalInput({...goalInput, fat:v})}
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={()=>{
                setGoalKcal(Number(goalInput.kcal));
                setGoalProtein(Number(goalInput.protein));
                setGoalCarb(Number(goalInput.carb));
                setGoalFat(Number(goalInput.fat));
                setGoalModal(false);
              }}
            >
              <Text style={styles.saveText}>✔ บันทึกเป้าหมาย</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={()=>setGoalModal(false)}>
              <Text style={styles.closeText}>ปิด</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* =====================================================
          POPUP: เพิ่มรายการอาหาร
      ===================================================== */}
      <Modal transparent visible={menuVisible} animationType="fade">
        <View style={styles.overlayAdd}>
          <View style={styles.addBox}>

            <Text style={styles.addTitle}>
              เพิ่มรายการ • {selectedMeal}
            </Text>

            {/* ปุ่มกรอกเอง */}
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: "#E8F1FF" }]}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("FoodForm1", { meal: selectedMeal });
              }}
            >
              <Ionicons name="create-outline" color="#3A7BFF" size={22} />
              <Text style={styles.addText}>กรอกด้วยตัวเอง</Text>
            </TouchableOpacity>

            {/* ปุ่มถ่ายภาพ */}
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: "#EFFFF1" }]}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("Camera", { meal: selectedMeal });
              }}
            >
              <Ionicons name="camera-outline" color="#34C759" size={22} />
              <Text style={styles.addText}>ถ่ายภาพ • วิเคราะห์อาหาร</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addClose}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.addCloseText}>ปิด</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

/* ---------------------- Goal Input Component ---------------------- */
function GoalInput({ label, value, onChange }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        style={styles.inputBox}
        value={value}
        keyboardType="numeric"
        onChangeText={onChange}
      />
    </View>
  );
}

/* ---------------------- Macro Box ---------------------- */
function MacroBox({ label, value, goal, color }) {
  return (
    <View style={styles.macroBox}>
      <RadialProgressChart value={value} goal={goal} color={color} />
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MealButton({ title, onPress, color }) {
  return (
    <TouchableOpacity style={[styles.mealButton, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.mealText}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#555" />
    </TouchableOpacity>
  );
}

/* ======================= STYLE ======================= */
const styles = StyleSheet.create({
  container: { backgroundColor: "#D5FFE3" },

  sectionHeader: {
    fontSize: 22,
    fontWeight: "800",
    paddingHorizontal: 18,
    marginTop: 14,
    marginBottom: 8,
    color: "#1D4D4F",
  },

  /* Energy Card */
  energyCard: {
    marginHorizontal: 14,
    padding: 18,
    backgroundColor: "#fff",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
  },

  energyInfo: { marginLeft: 20 },
  todayText: { fontSize: 15, color: "#444" },

  kcalBig: { fontSize: 34, fontWeight: "900", color: "#FF6B6B", marginTop: 4 },
  kcalUnit: { color: "#666", marginTop: -6, fontSize: 16 },

  goalBtn: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  goalBtnText: { marginLeft: 5, fontSize: 14, fontWeight: "600", color: "#333" },

  /* Macro Row */
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginTop: 8,
  },

  macroBox: {
    width: "32%",
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    elevation: 3,
  },

  macroLabel: { marginTop: 6, fontSize: 15, fontWeight: "700", color: "#444" },

  /* Info Card */
  infoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    elevation: 3,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    color: "#1D4D4F",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomColor: "#DDD",
    borderBottomWidth: 1,
  },

  infoLabel: { fontSize: 15, color: "#555" },
  infoValue: { fontWeight: "800", fontSize: 16, color: "#1D4D4F" },

  /* Meal Button */
  mealButton: {
    marginHorizontal: 14,
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 2,
  },

  mealText: { fontSize: 18, fontWeight: "700", color: "#444" },

  /* Modal ตั้งค่าเป้าหมาย */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },

  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 15, fontWeight: "600", marginBottom: 6 },
  inputBox: {
    backgroundColor: "#EEE",
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },

  saveBtn: {
    backgroundColor: "#1B8A5A",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  saveText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  closeBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#DDD",
    marginTop: 10,
  },
  closeText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  /* Modal เพิ่มอาหาร */
  overlayAdd: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  addBox: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 18,
    alignItems: "center",
  },

  addTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14,
    color: "#333",
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },

  addText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  addClose: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 12,
    backgroundColor: "#EEE",
  },

  addCloseText: {
    color: "#444",
    fontSize: 15,
    fontWeight: "700",
  },
});
