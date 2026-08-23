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

// ===================== PALETTE (health-focused) =====================
// Deep teal for structure/headers, sage/mint for freshness & growth,
// warm coral only for energy/highlight numbers, soft cream background.
const COLORS = {
  bg: "#F4FBF6",
  card: "#FFFFFF",
  primaryDark: "#0F4C3A",
  primary: "#1B8A5A",
  primarySoft: "#E3F6EA",
  mint: "#2FBF87",
  accentEnergy: "#FF7A59",
  accentProtein: "#3A7BFF",
  accentCarb: "#F5B942",
  accentFat: "#FF5FA2",
  textMain: "#0F2E27",
  textSub: "#5B7369",
  border: "#E3EEE7",
  warnBg: "#FFF6E5",
  warnBorder: "#F0B429",
  encourageBg: "#EAF9EF",
  encourageBorder: "#2FBF87",
  overlay: "rgba(11,38,30,0.55)",
};

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

  // เปอร์เซ็นต์ความคืบหน้าพลังงาน (สำหรับ progress bar เสริม)
  const kcalPct = kcalGoal ? Math.min(100, Math.round((totalKcal / kcalGoal) * 100)) : 0;

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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
      >
        {/* =====================================================
            Header: greeting strip
        ===================================================== */}
        <View style={styles.headerRow}>
          <View style={styles.headerIconWrap}>
            <Ionicons name={profile?.avatar || "person"} size={22} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerGreeting}>
              {profile?.username ? `สวัสดี, ${profile.username}` : "สวัสดี"}
            </Text>
            <Text style={styles.headerSub}>{todayText}</Text>
          </View>
        </View>

        {/* =====================================================
            Section: พลังงานรวมวันนี้
        ===================================================== */}
        <SectionHeader label="พลังงานรวมวันนี้" />

        <View style={styles.energyCard}>
          <RadialProgressChart
            key={todayISO}
            size={150}
            value={totalKcal}
            goal={kcalGoal}
            color={COLORS.accentEnergy}
            hideValue={true}
            hideLabel={true}
          />

          <View style={styles.energyInfo}>
            <View style={styles.kcalPill}>
              <Ionicons name="flame" size={14} color={COLORS.accentEnergy} />
              <Text style={styles.kcalPillText}>{kcalPct}% ของเป้าหมาย</Text>
            </View>

            <Text style={styles.kcalBig}>
              {Math.round(totalKcal)}
              <Text style={styles.kcalGoalText}> / {Math.round(kcalGoal || 0)}</Text>
            </Text>
            <Text style={styles.kcalUnit}>kcal วันนี้</Text>

            <TouchableOpacity
              style={styles.goalBtn}
              onPress={openGoalModal}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={16} color={COLORS.primaryDark} />
              <Text style={styles.goalBtnText}>ตั้งค่าเป้าหมาย</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/*Weekly Summary */}
        {weeklySummary && (
          <View style={styles.alertBox}>
            <View style={styles.alertIconWrap}>
              <Ionicons name="stats-chart" size={16} color={COLORS.warnBorder} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>สรุปพฤติกรรมการกิน</Text>
              <Text style={styles.alertText}>{weeklySummary}</Text>
            </View>
          </View>
        )}

        {/*Encouragement */}
        {encourageMessage && (
          <View style={styles.encourageBox}>
            <Ionicons name="heart" size={16} color={COLORS.encourageBorder} />
            <Text style={styles.encourageText}>{encourageMessage}</Text>
          </View>
        )}

        {/* =====================================================
            Section: สรุปโภชนาการวันนี้
        ===================================================== */}
        <SectionHeader icon="nutrition" label="สรุปโภชนาการวันนี้" />

        <View style={styles.macroRow}>
          <MacroBox
            label="โปรตีน"
            icon="barbell-outline"
            color={COLORS.accentProtein}
            value={totalProtein}
            goal={proteinTarget || 0}
          />
          <MacroBox
            label="คาร์บ"
            icon="restaurant-outline"
            color={COLORS.accentCarb}
            value={totalCarb}
            goal={carbTarget || 0}
          />
          <MacroBox
            label="ไขมัน"
            icon="water-outline"
            color={COLORS.accentFat}
            value={totalFat}
            goal={fatTarget || 0}
          />
        </View>


        {/* =====================================================
            Section: บันทึกรายการอาหาร
        ===================================================== */}
        <SectionHeader icon="add-circle" label="บันทึกรายการอาหาร" />

        <MealButton
          title="มื้อเช้า"
          emoji="🍳"
          subtitle={`${entriesByMeal["เช้า"].length} รายการ`}
          onPress={() => openMenuFor("เช้า")}
        />
        <MealButton
          title="มื้อกลางวัน"
          emoji="🍛"
          subtitle={`${entriesByMeal["กลางวัน"].length} รายการ`}
          onPress={() => openMenuFor("กลางวัน")}
        />
        <MealButton
          title="มื้อเย็น"
          emoji="🍲"
          subtitle={`${entriesByMeal["เย็น"].length} รายการ`}
          onPress={() => openMenuFor("เย็น")}
        />

        {/* =====================================================
            Section: ค่าทางโภชนาการ
        ===================================================== */}
        <View style={styles.infoCard}>
          <View style={styles.infoTitleRow}>
            <Ionicons name="body-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoTitle}>ค่าทางโภชนาการของคุณ</Text>
          </View>
          <InfoRow label="BMI" value={bmi} />
          <InfoRow label="BMR" value={displayBmr} />
          <InfoRow label="TDEE" value={displayTdee} last />
        </View>

        {/* =====================================================
            Section: โภชนาการที่ควรได้รับต่อวัน
        ===================================================== */}
        <View style={styles.infoCard}>
          <View style={styles.infoTitleRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoTitle}>โภชนาการที่ควรได้รับต่อวัน</Text>
          </View>
          <InfoRow
            label="พลังงานรวม"
            value={kcalGoal ? `${Math.round(kcalGoal)} kcal` : "-"}
          />
          <InfoRow label="โปรตีน" value={`${Math.round(proteinTarget || 0)} g`} />
          <InfoRow label="คาร์โบไฮเดรต" value={`${Math.round(carbTarget || 0)} g`} />
          <InfoRow label="ไขมัน" value={`${Math.round(fatTarget || 0)} g`} last />
        </View>

        {/* =====================================================
            POPUP: ตั้งค่าเป้าหมาย (สำรอง + override ได้)
        ===================================================== */}
        <Modal transparent visible={goalModal} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="flag-outline" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.modalTitle}>ตั้งค่าเป้าหมาย</Text>
              <Text style={styles.modalSubtitle}>
                ปรับเป้าหมายพลังงานและสารอาหารให้เหมาะกับคุณ
              </Text>

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
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.saveText}>บันทึกเป้าหมาย</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setGoalModal(false)}
                activeOpacity={0.85}
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
              <View style={styles.addHandle} />
              <Text style={styles.addTitle}>เพิ่มรายการ • {selectedMeal}</Text>

              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: COLORS.primarySoft }]}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("FoodForm1", { meal: selectedMeal });
                }}
                activeOpacity={0.85}
              >
                <View style={[styles.addBtnIcon, { backgroundColor: "#DCEEFF" }]}>
                  <Ionicons name="create-outline" color={COLORS.accentProtein} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addText}>กรอกด้วยตัวเอง</Text>
                  <Text style={styles.addSubText}>บันทึกข้อมูลอาหารเอง</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#99A9A3" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: COLORS.primarySoft }]}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("Camera", { meal: selectedMeal });
                }}
                activeOpacity={0.85}
              >
                <View style={[styles.addBtnIcon, { backgroundColor: "#DFFAEA" }]}>
                  <Ionicons name="camera-outline" color={COLORS.mint} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addText}>ถ่ายภาพ • วิเคราะห์อาหาร</Text>
                  <Text style={styles.addSubText}>ให้ AI ช่วยประเมินให้</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#99A9A3" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addClose}
                onPress={() => setMenuVisible(false)}
                activeOpacity={0.85}
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

/* ---------------------- Section Header ---------------------- */
function SectionHeader({ icon, label }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.sectionHeader}>{label}</Text>
    </View>
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
function MacroBox({ label, value, goal, color, icon }) {
  return (
    <View style={styles.macroBox}>
      <RadialProgressChart value={value} goal={goal} color={color} />
      <View style={styles.macroLabelRow}>
        <Ionicons name={icon} size={13} color={color} />
        <Text style={styles.macroLabel}>{label}</Text>
      </View>
      <Text style={styles.macroValue}>
        {Math.round(value)}<Text style={styles.macroGoal}>/{Math.round(goal)}g</Text>
      </Text>
    </View>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MealButton({ title, emoji, subtitle, onPress }) {
  return (
    <TouchableOpacity
      style={styles.mealButton}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.mealEmojiWrap}>
        <Text style={styles.mealEmoji}>{emoji}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.mealText}>{title}</Text>
        <Text style={styles.mealSubtext}>{subtitle}</Text>
      </View>
      <View style={styles.mealAddCircle}>
        <Ionicons name="add" size={18} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );
}

/* ======================= STYLE ======================= */
const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.bg },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginTop: 6,
    marginBottom: 4,
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerGreeting: { fontSize: 18, fontWeight: "800", color: COLORS.primaryDark },
  headerSub: { fontSize: 13, color: COLORS.textSub, marginTop: 2 },

  /* Section header */
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 8,
    color: COLORS.primaryDark,
  },

  /* Energy Card */
  energyCard: {
    marginHorizontal: 14,
    padding: 18,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  energyInfo: { marginLeft: 18, flex: 1 },

  kcalPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFF1EC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },
  kcalPillText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accentEnergy,
  },

  kcalBig: { fontSize: 32, fontWeight: "900", color: COLORS.textMain },
  kcalGoalText: { fontSize: 18, fontWeight: "700", color: COLORS.textSub },
  kcalUnit: { color: COLORS.textSub, marginTop: -2, fontSize: 13 },

  goalBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  goalBtnText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },

  /* Macro Row */
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },

  macroBox: {
    width: "32%",
    backgroundColor: COLORS.card,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  macroLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  macroLabel: { marginLeft: 4, fontSize: 13, fontWeight: "700", color: COLORS.textMain },
  macroValue: { marginTop: 3, fontSize: 12, fontWeight: "700", color: COLORS.textSub },
  macroGoal: { fontWeight: "500", color: "#A2B3AC" },

  /* Info Card */
  infoCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 14,
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  infoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 8,
    color: COLORS.primaryDark,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },

  infoLabel: { fontSize: 14, color: COLORS.textSub },
  infoValue: { fontWeight: "800", fontSize: 15, color: COLORS.textMain },

  /* Meal Button */
  mealButton: {
    marginHorizontal: 14,
    marginTop: 10,
    padding: 14,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  mealEmojiWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  mealEmoji: { fontSize: 22 },
  mealText: { fontSize: 16, fontWeight: "800", color: COLORS.textMain },
  mealSubtext: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  mealAddCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Modal ตั้งค่าเป้าหมาย */
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  modalBox: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 22,
  },

  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 10,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
    textAlign: "center",
    color: COLORS.primaryDark,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSub,
    textAlign: "center",
    marginBottom: 16,
  },

  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 14, fontWeight: "700", marginBottom: 6, color: COLORS.textMain },
  inputBox: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
    color: COLORS.textMain,
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 8,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginLeft: 6,
  },

  closeBtn: {
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    marginTop: 10,
  },
  closeText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    color: COLORS.textSub,
  },

  /* Modal เพิ่มอาหาร */
  overlayAdd: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  addBox: {
    width: "100%",
    backgroundColor: COLORS.card,
    padding: 22,
    borderRadius: 24,
    alignItems: "center",
  },

  addHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 14,
  },

  addTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
    color: COLORS.primaryDark,
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  addBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  addText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textMain,
  },
  addSubText: {
    fontSize: 12,
    color: COLORS.textSub,
    marginTop: 1,
  },

  addClose: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
  },

  addCloseText: {
    color: COLORS.textSub,
    fontSize: 14,
    fontWeight: "700",
  },

  /* Weekly summary alert */
  alertBox: {
    flexDirection: "row",
    backgroundColor: COLORS.warnBg,
    marginHorizontal: 14,
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warnBorder,
  },
  alertIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
    color: "#7A5C00",
  },
  alertText: {
    fontSize: 13,
    color: "#5B5237",
    lineHeight: 18,
  },

  /* Encouragement */
  encourageBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.encourageBg,
    marginHorizontal: 14,
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.encourageBorder,
  },
  encourageText: {
    marginLeft: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#1D5B41",
    flex: 1,
  },
});