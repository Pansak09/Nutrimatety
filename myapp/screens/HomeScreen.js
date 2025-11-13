// HomeScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Alert, AppState, FlatList, TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { API } from "../api";
import RadialProgressChart from "../components/RadialProgressChart";

export default function HomeScreen({ navigation }) {
  const route = useRoute();
  const [entriesByMeal, setEntriesByMeal] = useState({ เช้า: [], กลางวัน: [], เย็น: [] });

  const [goal, setGoal] = useState(2500);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalInput, setGoalInput] = useState("2500");
  const [todayText, setTodayText] = useState("");

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("เช้า");

  const updateTodayText = () => {
    const now = new Date();
    const day = now.getDate();
    const monthNames = [
      "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
      "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"
    ];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    setTodayText(`วันนี้ · ${day} ${month} ${year}`);
  };

  useEffect(() => {
    updateTodayText();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") updateTodayText();
    });
    return () => sub.remove();
  }, []);

  const isoToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

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
          image_url: it.image_url || null,   // ⭐ FIXED: ส่งรูปไปหน้า FoodDetail
        });
      });

      console.log("🔥 GROUPED =", grouped);
      setEntriesByMeal(grouped);

    } catch (e) {
      Alert.alert("โหลดข้อมูลไม่สำเร็จ", e.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const needRefresh = route?.params?.refresh;
      loadTodayMeals().finally(() => {
        if (needRefresh) navigation.setParams({ refresh: false });
      });
    }, [route?.params?.refresh])
  );

  const allMeals = Object.values(entriesByMeal).flat();
  const totalProtein = allMeals.reduce((s, x) => s + x.protein, 0);
  const totalCarb   = allMeals.reduce((s, x) => s + x.carb, 0);
  const totalFat    = allMeals.reduce((s, x) => s + x.fat, 0);
  const totalKcal   = allMeals.reduce((s, x) => s + x.kcal, 0);

  const openMenuFor = (meal) => {
    setSelectedMeal(meal);
    setMenuVisible(true);
  };

  const goManual = () => {
    setMenuVisible(false);
    navigation.navigate("FoodForm1", { meal: selectedMeal });
  };

  const goCamera = () => {
    setMenuVisible(false);
    navigation.navigate("Camera", { meal: selectedMeal });
  };

  return (
    <View style={styles.container}>

      {/* การ์ดวันที่ */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>{todayText}</Text>

          <TouchableOpacity
            onPress={() => {
              setGoalInput(String(goal));
              setShowGoalInput(true);
            }}
          >
            <Ionicons name="settings-outline" size={20} color="#007aff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.kcalText}>{totalKcal} / {goal} KCAL</Text>
      </View>

      {/* กราฟ macro */}
      <View style={styles.graphContainer}>

        {/* โปรตีน */}
        <View style={styles.bigCard}>
          <RadialProgressChart
            value={totalProtein}
            goal={150}
            color="#36A2EB"
            label="โปรตีน"
          />
        </View>

        {/* คาร์บ & ไขมัน */}
        <View style={styles.smallRow}>

          <View style={styles.smallCard}>
            <RadialProgressChart
              value={totalCarb}
              goal={250}
              color="#FFCE56"
              label="คาร์โบไฮเดรต"
            />
          </View>

          <View style={styles.smallCard}>
            <RadialProgressChart
              value={totalFat}
              goal={70}
              color="#FF6384"
              label="ไขมัน"
            />
          </View>

        </View>
      </View>

      {/* รายการอาหาร */}
      <FlatList
        data={["เช้า","กลางวัน","เย็น"]}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <MealSection
            title={item}
            data={entriesByMeal[item]}
            onPressPlus={() => openMenuFor(item)}
            onPressItem={(entry) =>
              navigation.navigate("FoodDetail", { item: entry })
            }
          />
        )}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Modal เลือกเพิ่มอาหาร */}
      <Modal transparent visible={menuVisible} animationType="fade">
        <TouchableOpacity
          style={styles.popupOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.popupBox}>
            <Text style={styles.popupTitle}>เพิ่มรายการ ({selectedMeal})</Text>

            <TouchableOpacity style={styles.prettyBtn} onPress={goManual}>
              <Ionicons name="create-outline" size={20} color="#007bff" />
              <Text style={styles.prettyBtnText}>กรอกเอง</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.prettyBtn} onPress={goCamera}>
              <Ionicons name="camera-outline" size={20} color="#34C759" />
              <Text style={styles.prettyBtnText}>ถ่ายภาพ</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal เป้าหมาย kcal */}
      <Modal visible={showGoalInput} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupBox}>
            <Text style={styles.popupTitle}>ปรับเป้าหมายพลังงาน (kcal)</Text>

            <TextInput
              keyboardType="numeric"
              value={goalInput}
              onChangeText={setGoalInput}
              style={styles.inputGoal}
            />

            <View style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity
                onPress={() => {
                  const v = parseInt(goalInput);
                  if (v > 0) {
                    setGoal(v);
                    setShowGoalInput(false);
                  } else Alert.alert("กรอกตัวเลขให้ถูกต้อง");
                }}
                style={styles.btnSave}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>บันทึก</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowGoalInput(false)}
                style={styles.btnCancel}
              >
                <Text style={{ fontWeight: "bold" }}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

// =============================
// Section แสดงรายการอาหาร
// =============================
function MealSection({ title, data, onPressPlus, onPressItem }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>

        <TouchableOpacity onPress={onPressPlus} style={styles.plusBtn}>
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listBox}>
        {data.length === 0 ? (
          <Text style={{ color: "#777" }}>ยังไม่มีรายการ</Text>
        ) : (
          data.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={row.row}
              onPress={() => onPressItem(item)}
            >
              <Text style={row.name}>{item.name}</Text>
              <Text style={row.kcal}>{item.kcal} kcal</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

// =============================
// Styles
// =============================
const row = StyleSheet.create({
  row: {
    backgroundColor: "#F5F7F9",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    marginBottom: 8,
  },
  name: { fontWeight: "600", fontSize: 15 },
  kcal: { color: "#666" },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#BDFACC",
    paddingTop: 40,
    paddingHorizontal: 14,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { fontSize: 15, fontWeight: "600" },
  kcalText: { fontSize: 18, fontWeight: "700", color: "#33aa55" },

  graphContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },

  bigCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 22,
    paddingHorizontal: 8,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
  },

  smallRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  smallCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: "center",
    elevation: 2,
  },

  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { fontSize: 20, fontWeight: "800" },

  plusBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#34C759",
    alignItems: "center",
    justifyContent: "center",
  },

  listBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
  },

  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "center",
    alignItems: "center",
  },

  popupBox: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  popupTitle: { fontSize: 18, fontWeight: "bold" },

  prettyBtn: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 6,
  },

  prettyBtnText: { marginLeft: 8, fontWeight: "600", fontSize: 16 },

  inputGoal: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 10,
    width: 120,
    textAlign: "center",
    marginVertical: 10,
    fontSize: 16,
  },

  btnSave: {
    backgroundColor: "#34C759",
    padding: 8,
    borderRadius: 10,
  },

  btnCancel: {
    backgroundColor: "#ccc",
    padding: 8,
    borderRadius: 10,
  },
});
