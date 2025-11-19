// screens/SummaryScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../api";
import ProgressBar from "../components/ProgressBar";

// ⭐ ฟังก์ชันคำนวณ Macro
function calculateMacros(goal, weight, tdee) {
  weight = Number(weight);
  tdee = Number(tdee);

  let targetCal = tdee;
  let proteinPerKg = 1.6;
  let fatRatio = 0.3;

  if (goal === "ลดน้ำหนัก") {
    targetCal = Math.round(tdee * 0.8);
    proteinPerKg = 2.0;
    fatRatio = 0.25;
  } else if (goal === "เพิ่มน้ำหนัก") {
    targetCal = Math.round(tdee * 1.15);
    proteinPerKg = 2.2;
    fatRatio = 0.3;
  }

  const proteinGram = Math.round(weight * proteinPerKg);
  const proteinCal = proteinGram * 4;

  const fatCal = Math.round(targetCal * fatRatio);
  const fatGram = Math.round(fatCal / 9);

  const carbCal = targetCal - (proteinCal + fatCal);
  const carbGram = Math.round(carbCal / 4);

  return { targetCal, proteinGram, fatGram, carbGram };
}

export default function SummaryScreen({ navigation, route }) {
  const { name, gender, height, weight, dob, goal, lifestyle, food, imageUri } =
    route.params || {};

  const [saving, setSaving] = useState(false);

  // ---------------------- อายุ ----------------------
  const birth = dob ? new Date(dob) : null;
  let age = 0;
  if (birth) {
    const now = new Date();
    age = now.getFullYear() - birth.getFullYear();
    if (
      now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
    ) {
      age--;
    }
  }

  // ---------------------- BMR ----------------------
  const bmrCalc = (g, H, W, A) => {
    const base = 10 * W + 6.25 * H - 5 * A;
    return Math.round(g === "female" || g === "หญิง" ? base - 161 : base + 5);
  };

  const bmr = bmrCalc(gender, Number(height), Number(weight), age);

  // ---------------------- TDEE ----------------------
  const factor = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
  };

  const tdee = Math.round(bmr * (factor[lifestyle] || 1.2));

  // ---------------------- Macro ----------------------
  const macro = calculateMacros(goal, weight, tdee);

  // ---------------------- Save Profile ----------------------
  const saveAndGo = async () => {
    try {
      setSaving(true);

      const token = await AsyncStorage.getItem("access_token");
      if (!token) throw new Error("Token ไม่พบ ต้อง Login ใหม่");

      const payload = {
        username: name,
        gender,
        date_of_birth: dob,
        height: Number(height),
        current_weight: Number(weight),
        target_weight:
          goal === "ลดน้ำหนัก"
            ? Number(weight) - 5
            : goal === "เพิ่มน้ำหนัก"
            ? Number(weight) + 5
            : Number(weight),

        lifestyle,
        food_allergies: food || null,
        avatar_url: imageUri || null,
        goal,

        target_calories: macro.targetCal,
        protein_target: macro.proteinGram,
        fat_target: macro.fatGram,
        carb_target: macro.carbGram,

        bmi: Number((weight / ((height / 100) ** 2)).toFixed(1)),
        bmr,
        tdee,
      };

      // POST หรือ PUT
      try {
        await API.post("/profiles/", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        if (e.response?.status === 400) {
          await API.put("/profiles/", payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          throw e;
        }
      }

      // ไปหน้า Home
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Main", params: { screen: "Home" } }],
        })
      );
    } catch (err) {
      Alert.alert("ผิดพลาด", err.response?.data?.detail || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ProgressBar step={6} />

      <Text style={styles.title}>ยินดีต้อนรับ คุณ {name ?? "-"}</Text>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.avatar} />}

      {/* การ์ดแคลอรี่ */}
      <View style={styles.card}>
        <Text style={styles.calorie}>{macro.targetCal} kcal</Text>
        <Text style={styles.desc}>แคลอรี่ที่ควรได้รับต่อวัน</Text>

        <View style={styles.hr} />

        {/* Macro 3 ช่อง */}
        <View style={styles.macroRow}>
          <View style={styles.macroBox}>
            <Text style={styles.macroLabel}>โปรตีน</Text>
            <Text style={styles.macroValue}>{macro.proteinGram} g</Text>
          </View>

          <View style={styles.macroBox}>
            <Text style={styles.macroLabel}>ไขมัน</Text>
            <Text style={styles.macroValue}>{macro.fatGram} g</Text>
          </View>

          <View style={styles.macroBox}>
            <Text style={styles.macroLabel}>คาร์บ</Text>
            <Text style={styles.macroValue}>{macro.carbGram} g</Text>
          </View>
        </View>
      </View>

      {/* ปุ่ม */}
      <TouchableOpacity style={styles.button} onPress={saveAndGo} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>เสร็จสิ้น</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ---------------------- STYLE ----------------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 22, backgroundColor: "#F8FFFC", alignItems: "center" },

  title: { fontSize: 24, fontWeight: "bold", marginTop: 20, color: "#145A32" },

  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginTop: 15,
    marginBottom: 20,
    borderColor: "#fff",
    borderWidth: 3,
    elevation: 6,
  },

  card: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  calorie: { fontSize: 40, textAlign: "center", fontWeight: "900", color: "#2E8B57" },
  desc: { textAlign: "center", marginTop: 6, color: "#555" },

  hr: {
    height: 1,
    backgroundColor: "#e5e5e5",
    marginVertical: 16,
  },

  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  macroBox: {
    flex: 1,
    marginHorizontal: 4,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#E9FFF4",
    alignItems: "center",
  },

  macroLabel: { fontSize: 14, color: "#555" },
  macroValue: { marginTop: 4, fontSize: 20, fontWeight: "bold", color: "#146C43" },

  button: {
    width: "100%",
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    alignItems: "center",
  },

  btnText: { color: "#fff", fontSize: 18, fontWeight: "900" },
});
