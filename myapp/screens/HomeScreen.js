// HomeScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Alert, AppState
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { API } from "../api";
import RadialProgressChart from "../components/RadialProgressChart";

export default function HomeScreen({ navigation }) {
  const route = useRoute();
  const [entriesByMeal, setEntriesByMeal] = useState({ เช้า: [], กลางวัน: [], เย็น: [] });

  const [goal, setGoal] = useState(2500);
  const [todayText, setTodayText] = useState("");

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("เช้า");

  /* ------------------------- วันที่ ------------------------- */
  const updateTodayText = () => {
    const now = new Date();
    const months = [
      "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
      "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"
    ];
    setTodayText(`วันนี้ · ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
  };

  useEffect(() => {
    updateTodayText();
  }, []);

  const isoToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  /* ---------------------- โหลดข้อมูลอาหาร ---------------------- */
  const loadTodayMeals = async () => {
    try {
      const { data } = await API.get("/meals", { params: { date: isoToday() } });

      const grouped = { เช้า: [], กลางวัน: [], เย็น: [] };
      (data || []).forEach((it) => {
        const meal = it.meal_time || "เช้า";
        grouped[meal].push({
          id: String(it.id),
          meal,
          name: it.name,
          kcal: Number(it.calories) || 0,
          protein: Number(it.protein) || 0,
          carb: Number(it.carb) || 0,
          fat: Number(it.fat) || 0,
          image_url: it.image_url || null,
        });
      });

      setEntriesByMeal(grouped);

    } catch (e) {
      Alert.alert("โหลดข้อมูลไม่สำเร็จ", e.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTodayMeals();
    }, [])
  );

  /* ---------------------- รวมโภชนาการ ---------------------- */
  const allMeals = Object.values(entriesByMeal).flat();
  const totalProtein = allMeals.reduce((s, x) => s + x.protein, 0);
  const totalCarb   = allMeals.reduce((s, x) => s + x.carb, 0);
  const totalFat    = allMeals.reduce((s, x) => s + x.fat, 0);
  const totalKcal   = allMeals.reduce((s, x) => s + x.kcal, 0);

  const openMenuFor = (meal) => {
    setSelectedMeal(meal);
    setMenuVisible(true);
  };

  return (
    <View style={styles.container}>

      {/* ========= การ์ดพลังงานรวมวันนี้ ========= */}
      <View style={styles.energyCard}>

        {/* กราฟซ้าย */}
        <View style={styles.energyGraphBox}>
          <RadialProgressChart
            size={155}
            value={totalKcal}
            goal={goal}
            color="#FF6B6B"
            hideValue={true}
            hideLabel={true}
          />
        </View>

        {/* ข้อความขวา */}
        <View style={styles.energyTextBox}>
          <Text style={styles.todayText}>{todayText}</Text>
          <Text style={styles.kcalBig}>{totalKcal} / {goal}</Text>
          <Text style={styles.kcalUnit}>kcal</Text>

          <Text style={styles.tagHighlight}>พลังงานรวมวันนี้</Text>
        </View>

      </View>

      {/* ========= กราฟโปรตีน / คาร์บ / ไขมัน ========= */}
      <View style={styles.graphContainer}>

        <View style={styles.smallCard}>
          <RadialProgressChart
            value={totalProtein}
            goal={150}
            color="#4A90E2"
            label="โปรตีน"
          />
        </View>

        <View style={styles.smallCard}>
          <RadialProgressChart
            value={totalCarb}
            goal={250}
            color="#F5C542"
            label="คาร์โบไฮเดรต"
          />
        </View>

        <View style={styles.smallCard}>
          <RadialProgressChart
            value={totalFat}
            goal={70}
            color="#FF4FA7"
            label="ไขมัน"
          />
        </View>

      </View>

      {/* ========= ปุ่มเลือกมื้ออาหาร ========= */}
      <View style={{ marginTop: 24 }}>
        <MealButton title="🍳 มื้อเช้า" color="#FFE8CD" onPress={() => openMenuFor("เช้า")} />
        <MealButton title="🍛 มื้อกลางวัน" color="#FFECD6" onPress={() => openMenuFor("กลางวัน")} />
        <MealButton title="🍲 มื้อเย็น" color="#FDE2E2" onPress={() => openMenuFor("เย็น")} />
      </View>

      {/* ========= Popup เพิ่มอาหาร ========= */}
      <Modal transparent visible={menuVisible} animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupBox}>

            <Text style={styles.popupTitle}>เพิ่มรายการ • {selectedMeal}</Text>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#E8F1FF" }]}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("FoodForm1", { meal: selectedMeal });
              }}
            >
              <Ionicons name="create-outline" size={22} color="#3A7BFF" />
              <Text style={styles.actionText}>กรอกด้วยตัวเอง</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#EFFFF1" }]}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("Camera", { meal: selectedMeal });
              }}
            >
              <Ionicons name="camera-outline" size={22} color="#34C759" />
              <Text style={styles.actionText}>ถ่ายภาพ • วิเคราะห์อาหาร</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.closeBtnText}>ปิด</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}

/********* ปุ่มมื้ออาหารแบบสวยงาม *********/
function MealButton({ title, onPress, color }) {
  return (
    <TouchableOpacity style={[styles.mealButton, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.mealButtonText}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );
}

/****************** STYLES ******************/
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#D5FFE3",
    paddingTop: 38,
    paddingHorizontal: 14,
  },

  /* ======= การ์ดพลังงานรวมวันนี้ ======= */
  energyCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },

  energyGraphBox: {
    backgroundColor: "#FFF5F5",
    padding: 6,
    borderRadius: 100,
  },

  energyTextBox: {
    flex: 1,
    paddingLeft: 18,
  },

  todayText: { fontSize: 17, fontWeight: "700", color: "#333" },

  kcalBig: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FF6B6B",
    marginTop: 6,
  },

  kcalUnit: {
    marginTop: -6,
    fontSize: 16,
    fontWeight: "600",
    color: "#777",
  },

  tagHighlight: {
    marginTop: 6,
    backgroundColor: "#FFE2E2",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    color: "#FF6B6B",
    fontWeight: "700",
    fontSize: 14,
    alignSelf: "flex-start",
  },

  /* ======= กราฟ macro ======= */
  graphContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  smallCard: {
    width: "32%",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },

  /* ======= ปุ่มมื้ออาหาร ======= */
  mealButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
  },

  mealButtonText: { fontSize: 18, fontWeight: "700", color: "#444" },

  /* ======= popup ======= */
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  popupBox: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 18,
    alignItems: "center",
  },

  popupTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14,
    color: "#333",
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },

  actionText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  closeBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 12,
    backgroundColor: "#EEE",
  },

  closeBtnText: {
    color: "#444",
    fontSize: 15,
    fontWeight: "700",
  },
});

