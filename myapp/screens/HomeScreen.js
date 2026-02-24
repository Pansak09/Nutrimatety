// HomeScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API } from "../api";
import RadialProgressChart from "../components/RadialProgressChart";

// key สำหรับเก็บค่าเป้าหมายในเครื่อง
const buildGoalKey = (userId) => `nutrition_goals_v1_user_${userId}`;

export default function HomeScreen({ navigation }) {
  /* ---------------- STATES ---------------- */
  const [entriesByMeal, setEntriesByMeal] = useState({
    เช้า: [],
    กลางวัน: [],
    เย็น: [],
  });

  // const [alertMessages, setAlertMessages] = useState([]);
  // const [encourageMessage, setEncourageMessage] = useState("");


  const [profile, setProfile] = useState(null);

  const goalKey = profile?.user_id
    ? buildGoalKey(profile.user_id)
    : null;

  // ค่าเป้าหมายแบบสำรอง (ใช้ตอนยังคำนวณ TDEE ไม่ได้ หรือไม่ตั้งค่าเอง)
  const [goalKcal, setGoalKcal] = useState(2500);
  const [goalProtein, setGoalProtein] = useState(150);
  const [goalCarb, setGoalCarb] = useState(250);
  const [goalFat, setGoalFat] = useState(70);

  // ใช้บอกว่าตอนนี้ "ใช้ค่าที่ผู้ใช้ตั้งเองอยู่หรือไม่"
  const [useCustomGoal, setUseCustomGoal] = useState(false);

  const [goalModal, setGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState({
    kcal: "2500",
    protein: "150",
    carb: "250",
    fat: "70",
  });

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("เช้า");
  const isoToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };
  
  const [todayISO, setTodayISO] = useState(isoToday());

  const [todayText, setTodayText] = useState("");
  
  const ANALYTICS_LAST_RUN_KEY = "nutrition_analytics_last_run";
  const [weeklySummary, setWeeklySummary] = useState("");
  const [encourageMessage, setEncourageMessage] = useState("");



  /* ---------------- ฟังก์ชันวันที่วันนี้ ---------------- */
  const updateTodayText = () => {
    const now = new Date();
    const months = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    setTodayText(
      `วันนี้ · ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
    );
  };

  /* ---------------- โหลด goal ที่เคยตั้งไว้จาก AsyncStorage ---------------- */
  const loadSavedGoals = async () => {
    try {
      if (!goalKey) return;

      const raw = await AsyncStorage.getItem(goalKey);
      if (!raw) return;

      const saved = JSON.parse(raw);

      if (saved && typeof saved.kcal === "number") {
        setUseCustomGoal(saved.useCustom ?? true);
        setGoalKcal(saved.kcal);
        setGoalProtein(saved.protein ?? 0);
        setGoalCarb(saved.carb ?? 0);
        setGoalFat(saved.fat ?? 0);

        setGoalInput({
          kcal: String(saved.kcal ?? 0),
          protein: String(saved.protein ?? 0),
          carb: String(saved.carb ?? 0),
          fat: String(saved.fat ?? 0),
        });
      }
    } catch (err) {
      console.log("LOAD GOALS ERROR:", err.message);
    }
  };


  useEffect(() => {
    if (profile?.user_id) {
      loadSavedGoals();
    }
  }, [profile?.user_id]);


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
      setEntriesByMeal({
        เช้า: [],
        กลางวัน: [],
        เย็น: [],
      });

      const { data } = await API.get("/meals", {
        params: { date: isoToday() },
      });

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

  const loadWeeklySummary = async () => {
    const { data } = await API.get("/analytics/weekly-summary");
    setWeeklySummary(data.message);
  };

  /* ================= ENCOURAGE ================= */
  const randomEncourage = () => {
    const messages = [
      "คุณกำลังสร้างนิสัยที่ดีให้ร่างกายอยู่ 💚",
      "ความสม่ำเสมอสำคัญกว่าความสมบูรณ์แบบ ✨",
      "วันนี้คุณดูแลตัวเองได้ดีมาก 😊",
      "ทุกมื้อที่ใส่ใจ คือการลงทุนเพื่อสุขภาพ 🌱",
    ];
    setEncourageMessage(
      messages[Math.floor(Math.random() * messages.length)]
    );
  };

  /* ================= EFFECT ================= */
  useEffect(() => {
    updateTodayText();
  }, [todayISO]);

  useFocusEffect(
    useCallback(() => {
      const now = isoToday();

      if (now !== todayISO) {
        setTodayISO(now);
        setEntriesByMeal({
          เช้า: [],
          กลางวัน: [],
          เย็น: [],
        });
      }

      loadProfile();
      loadTodayMeals();
      loadWeeklySummary();
      randomEncourage();
    }, [todayISO])
  );

  /* ---------------- รวมโภชนาการ ---------------- */
  const allMeals = React.useMemo(() => {
    return Object.values(entriesByMeal).flat();
  }, [entriesByMeal]);
  const totalProtein = allMeals.reduce((s, x) => s + x.protein, 0);
  const totalCarb = allMeals.reduce((s, x) => s + x.carb, 0);
  const totalFat = allMeals.reduce((s, x) => s + x.fat, 0);
  const totalKcal = allMeals.reduce((s, x) => s + x.kcal, 0);

  /* ---------------- คำนวณค่าทางโภชนาการ ---------------- */

  const calcAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const calcBMI = (w, h) =>
    !w || !h ? "-" : (w / (h / 100) ** 2).toFixed(1);

  const calcBMR = (gender, w, h, age) => {
    if (!w || !h || !age) return null;
    const base = 10 * w + 6.25 * h - 5 * age;
    if (gender === "male") return Math.round(base + 5);
    return Math.round(base - 161);
  };

  const calcTDEE = (bmr, lifestyle) => {
    if (!bmr || typeof bmr !== "number" || Number.isNaN(bmr)) return null;
    const factorMap = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      athlete: 1.9,
    };
    const factor = factorMap[lifestyle] || 1.2;
    return Math.round(bmr * factor);
  };

  const age = calcAge(profile?.date_of_birth);
  const bmi = calcBMI(profile?.current_weight, profile?.height);
  const bmr = calcBMR(
    profile?.gender,
    profile?.current_weight,
    profile?.height,
    age
  );
  const tdee = calcTDEE(bmr, profile?.lifestyle); // number หรือ null

  // helper สำหรับคำนวณ macro จาก kcal
  const calcProteinFromKcal = (kcal) => Math.round((kcal * 0.3) / 4);
  const calcCarbFromKcal = (kcal) => Math.round((kcal * 0.4) / 4);
  const calcFatFromKcal = (kcal) => Math.round((kcal * 0.3) / 9);

  // base kcal จากระบบ (ถ้ามี TDEE ให้ใช้ก่อน ถ้าไม่มีใช้ goalKcal เดิม)
  const baseKcal = tdee ?? goalKcal;

  // =========================
  // เป้าหมายจริงที่ใช้ในกราฟ
  // =========================
  const kcalGoal = useCustomGoal ? goalKcal : baseKcal;

  let proteinTarget;
  let carbTarget;
  let fatTarget;

  if (useCustomGoal) {
    // ใช้ค่าที่ผู้ใช้ตั้งเองทั้งหมด
    proteinTarget = goalProtein;
    carbTarget = goalCarb;
    fatTarget = goalFat;
  } else {
    // ใช้ค่าจากโปรไฟล์ / คำนวณอัตโนมัติจาก baseKcal
    proteinTarget =
      profile?.protein_target ?? calcProteinFromKcal(baseKcal);
    carbTarget =
      profile?.carb_target ?? calcCarbFromKcal(baseKcal);
    fatTarget =
      profile?.fat_target ?? calcFatFromKcal(baseKcal);
  }

  // สำหรับแสดงใน InfoRow (ไม่ให้เห็น NaN หรือ "null kcal")
  const displayBmr = bmr ? `${bmr} kcal` : "-";
  const displayTdee = tdee ? `${tdee} kcal` : "-";

  /* ---------------- UI START ---------------- */
  const openMenuFor = (meal) => {
    setSelectedMeal(meal);
    setMenuVisible(true);
  };

  // เปิด modal ตั้งค่าเป้าหมาย → ให้ค่าข้างในช่อง = ค่าเป้าหมายที่ใช้จริงในกราฟ (ค่าหลัง "/")
  const openGoalModal = () => {
    setGoalInput({
      kcal: String(Math.round(kcalGoal || 0)),
      protein: String(Math.round(proteinTarget || 0)),
      carb: String(Math.round(carbTarget || 0)),
      fat: String(Math.round(fatTarget || 0)),
    });
    setGoalModal(true);
  };

  // กดบันทึกค่าเป้าหมาย
  const onSaveGoal = async () => {
    const newKcal = Number(goalInput.kcal) || 0;
    const newProtein = Number(goalInput.protein) || 0;
    const newCarb = Number(goalInput.carb) || 0;
    const newFat = Number(goalInput.fat) || 0;

    setGoalKcal(newKcal);
    setGoalProtein(newProtein);
    setGoalCarb(newCarb);
    setGoalFat(newFat);
    setUseCustomGoal(true);

    try {
      if (!goalKey) return;
      await AsyncStorage.setItem(
      goalKey,
      JSON.stringify({
        useCustom: true,
        kcal: newKcal,
        protein: newProtein,
        carb: newCarb,
        fat: newFat,
      })
    );
    } catch (err) {
      console.log("SAVE GOALS ERROR:", err.message);
    }

    setGoalModal(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#D5FFE3" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
      >
        {/* =====================================================
            Section: พลังงานรวมวันนี้
        ===================================================== */}
        <Text style={styles.sectionHeader}>พลังงานรวมวันนี้</Text>

        <View style={styles.energyCard}>
          <RadialProgressChart
            key={todayISO} 
            size={160}
            value={totalKcal}
            goal={kcalGoal}
            color="#FF6B6B"
            hideValue={true}
            hideLabel={true}
          />

          <View style={styles.energyInfo}>
            <Text style={styles.todayText}>{todayText}</Text>
            <Text style={styles.kcalBig}>
              {Math.round(totalKcal)} / {Math.round(kcalGoal || 0)}
            </Text>
            <Text style={styles.kcalUnit}>kcal</Text>

            <TouchableOpacity
              style={styles.goalBtn}
              onPress={openGoalModal}
            >
              <Ionicons name="settings-outline" size={18} color="#333" />
              <Text style={styles.goalBtnText}>ตั้งค่าเป้าหมาย</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/*Weekly Summary */}
        {weeklySummary && (
          <View style={[styles.alertBox, { borderLeftColor: "#4CAF50" }]}>
            <Text style={styles.alertTitle}>สรุปพฤติกรรมการกิน</Text>
            <Text style={styles.alertText}>{weeklySummary}</Text>
          </View>
        )}

        {/*Encouragement */}
        {encourageMessage && (
          <View
            style={[
              styles.alertBox,
              { backgroundColor: "#E8F5E9", borderLeftColor: "#4CAF50" },
            ]}
          >
            {/*<Text style={[styles.alertTitle, { color: "#2E7D32" }]}>
              กำลังใจวันนี้
            </Text>*/}
            <Text style={[styles.alertText, { color: "#2E7D32" }]}>
              {encourageMessage}
            </Text>
          </View>
        )}

        {/* =====================================================
            Section: สรุปโภชนาการวันนี้
        ===================================================== */}
        <Text style={styles.sectionHeader}>สรุปโภชนาการวันนี้</Text>

        <View style={styles.macroRow}>
          <MacroBox
            label="โปรตีน"
            color="#4A90E2"
            value={totalProtein}
            goal={proteinTarget || 0}
          />
          <MacroBox
            label="คาร์บ"
            color="#F5C542"
            value={totalCarb}
            goal={carbTarget || 0}
          />
          <MacroBox
            label="ไขมัน"
            color="#FF4FA7"
            value={totalFat}
            goal={fatTarget || 0}
          />
        </View>


        {/* =====================================================
            Section: บันทึกรายการอาหาร
        ===================================================== */}
        <Text style={[styles.sectionHeader, { marginTop: 10 }]}>
          บันทึกรายการอาหาร
        </Text>

        <MealButton
          title="🍳 มื้อเช้า"
          color="#FFE7C7"
          onPress={() => openMenuFor("เช้า")}
        />
        <MealButton
          title="🍛 มื้อกลางวัน"
          color="#FFF0D1"
          onPress={() => openMenuFor("กลางวัน")}
        />
        <MealButton
          title="🍲 มื้อเย็น"
          color="#FFD7D7"
          onPress={() => openMenuFor("เย็น")}
        />

        {/* =====================================================
            Section: ค่าทางโภชนาการ
        ===================================================== */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ค่าทางโภชนาการของคุณ</Text>
          <InfoRow label="BMI" value={bmi} />
          <InfoRow label="BMR" value={displayBmr} />
          <InfoRow label="TDEE" value={displayTdee} />
        </View>

        {/* =====================================================
            Section: โภชนาการที่ควรได้รับต่อวัน
        ===================================================== */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>โภชนาการที่ควรได้รับต่อวัน</Text>
          <InfoRow
            label="พลังงานรวม"
            value={kcalGoal ? `${Math.round(kcalGoal)} kcal` : "-"}
          />
          <InfoRow label="โปรตีน" value={`${Math.round(proteinTarget || 0)} g`} />
          <InfoRow label="คาร์โบไฮเดรต" value={`${Math.round(carbTarget || 0)} g`} />
          <InfoRow label="ไขมัน" value={`${Math.round(fatTarget || 0)} g`} />
        </View>

        {/* =====================================================
            POPUP: ตั้งค่าเป้าหมาย (สำรอง + override ได้)
        ===================================================== */}
        <Modal transparent visible={goalModal} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>ตั้งค่าเป้าหมาย</Text>

              <GoalInput
                label="พลังงาน (kcal)"
                value={goalInput.kcal}
                onChange={(v) => setGoalInput({ ...goalInput, kcal: v })}
              />

              <GoalInput
                label="โปรตีน (g)"
                value={goalInput.protein}
                onChange={(v) => setGoalInput({ ...goalInput, protein: v })}
              />

              <GoalInput
                label="คาร์โบไฮเดรต (g)"
                value={goalInput.carb}
                onChange={(v) => setGoalInput({ ...goalInput, carb: v })}
              />

              <GoalInput
                label="ไขมัน (g)"
                value={goalInput.fat}
                onChange={(v) => setGoalInput({ ...goalInput, fat: v })}
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={onSaveGoal}
              >
                <Text style={styles.saveText}>✔ บันทึกเป้าหมาย</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setGoalModal(false)}
              >
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
              <Text style={styles.addTitle}>เพิ่มรายการ • {selectedMeal}</Text>

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
    </SafeAreaView>
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
    <TouchableOpacity
      style={[styles.mealButton, { backgroundColor: color }]}
      onPress={onPress}
    >
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
  goalBtnText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

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

  alertBox: {
  backgroundColor: "#FFF8E1",
  marginHorizontal: 14,
  marginTop: 14,
  padding: 14,
  borderRadius: 16,
  borderLeftWidth: 5,
  borderLeftColor: "#F5C542",
  elevation: 2,
  },

  alertTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
    color: "#7A5C00",
  },

  alertText: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },

});

