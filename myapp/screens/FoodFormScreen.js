// FoodFormScreen.js  
import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, StyleSheet, Image, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { API, API_BASE } from "../api";

const nameMap = {
  "Papaya Salad": "ส้มตำ",
  "Pad Thai": "ผัดไทย",
  "Fried Rice": "ข้าวผัด",
  "Chicken Green Curry": "แกงเขียวหวานไก่",
  "Shrimp Tom Yum": "ต้มยำกุ้ง",
  "Grilled Pork": "ลาบหมู",
  "Roast Chicken": "ข้าวมันไก่",
};

export default function FoodFormScreen({ navigation, route }) {
  const { imageUrl, preset = {} } = route.params || {};

  // ถ้าไม่มีค่ามา ให้เป็น null เพื่อไม่โยน error
  const [localImage, setLocalImage] = useState(imageUrl || null);

  // ป้องกัน Unsupported URI: ""
  const fullImageUri =
    localImage && typeof localImage === "string"
      ? localImage.startsWith("/")
        ? `${API_BASE}${localImage}`
        : localImage
      : null;

  const [name, setName] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carb, setCarb] = useState("");
  const [kcal, setKcal] = useState("");

  const mealTime = route.params?.meal || "เช้า";
  const [saving, setSaving] = useState(false);

  // ---------------------- PRESET ----------------------
  useEffect(() => {
    if (preset.name) {
      const cleaned = preset.name.trim();
      const mapped = nameMap[cleaned] || cleaned;
      setName(mapped);
    }
    if (preset.protein) setProtein(String(preset.protein));
    if (preset.fat) setFat(String(preset.fat));
    if (preset.carb) setCarb(String(preset.carb));
    if (preset.kcal) setKcal(String(preset.kcal));
  }, [preset]);

  // ---------------------- SEARCH MENU ----------------------
  const searchNutrition = async () => {
    const q = name.trim();
    if (!q) return Alert.alert("กรุณากรอกชื่ออาหาร");

    try {
      const res = await API.get(`/menu?search=${encodeURIComponent(q)}`);

      if (!res.data?.length) {
        return Alert.alert("ไม่พบข้อมูลโภชนาการของอาหารนี้");
      }

      const item = res.data[0];

      setProtein(item.protein?.toString() || "");
      setFat(item.fat?.toString() || "");
      setCarb(item.carbs?.toString() || ""); // FIX carb
      setKcal(item.calories?.toString() || "");
    } catch (err) {
      Alert.alert("เกิดข้อผิดพลาด", err.message);
    }
  };

  // ---------------------- UPLOAD IMAGE ----------------------
  const uploadImage = async (localUri) => {
    if (!localUri || !localUri.startsWith("file")) return null;

    const formData = new FormData();
    formData.append("file", {
      uri: localUri,
      name: "photo.jpg",
      type: "image/jpeg",
    });

    const res = await fetch(`${API_BASE}/files/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    const data = await res.json();

    if (!data.url) {
      throw new Error("Upload image failed");
    }

    return data.url; // เช่น /uploads/xxxx.jpg
  };

  // ---------------------- SAVE ----------------------
  const save = async () => {
    if (!name.trim()) return Alert.alert("กรุณาระบุชื่ออาหาร");

    let uploadUrl = localImage;

    try {
      setSaving(true);

      // อัปโหลดเฉพาะภาพจาก file://
      if (localImage && localImage.startsWith("file://")) {
        uploadUrl = await uploadImage(localImage);
      }

      const payload = {
        name: name.trim(),
        protein: Number(protein) || 0,
        fat: Number(fat) || 0,
        carb: Number(carb) || 0,
        calories: Number(kcal) || 0,
        meal_time: mealTime,
        image_url: uploadUrl || null, // ป้องกัน undefined
      };

      await API.post("/meals", payload);

      Alert.alert("สำเร็จ", "บันทึกอาหารเรียบร้อย", [
        {
          text: "ตกลง",
          onPress: () =>
            navigation.navigate("Main", {
              screen: "Home",
              params: { refresh: Date.now() },
            }),
        },
      ]);
    } catch (err) {
      Alert.alert("ผิดพลาด", err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------- UI ----------------------
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <View style={s.container}>
        <ScrollView contentContainerStyle={s.content}>
          
          {/* IMAGE PREVIEW */}
          <View style={s.imageCard}>
            {fullImageUri ? (
              <Image source={{ uri: fullImageUri }} style={s.image} />
            ) : (
              <View style={[s.image, { backgroundColor: "#ccc" }]} />
            )}
          </View>

          {/* NAME INPUT */}
          <Text style={s.label}>ชื่ออาหาร</Text>
          <View style={s.row}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={name}
              onChangeText={setName}
              placeholder="เช่น ข้าวผัด"
            />
            <TouchableOpacity onPress={searchNutrition}>
              <Text style={s.searchBtn}>ค้นหา</Text>
            </TouchableOpacity>
          </View>

          {/* MACROS */}
          <Field label="โปรตีน (g)" value={protein} setter={setProtein} numeric />
          <Field label="ไขมัน (g)" value={fat} setter={setFat} numeric />
          <Field label="คาร์โบไฮเดรต (g)" value={carb} setter={setCarb} numeric />
          <Field label="แคลอรี่ (kcal)" value={kcal} setter={setKcal} numeric />

        </ScrollView>

        {/* BUTTONS */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.btnGreen, saving && { opacity: 0.5 }]}
            onPress={save}
            disabled={saving}
          >
            <Text style={s.btnText}>บันทึก</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btnRed} onPress={() => navigation.goBack()}>
            <Text style={s.btnText}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------- Field Component ----------------------
function Field({ label, value, setter, numeric }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={setter}
        keyboardType={numeric ? "numeric" : "default"}
        style={s.input}
      />
    </View>
  );
}

// ---------------------- Styles ----------------------
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#C9FFE0" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  imageCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 30,
    marginBottom: 20,
    elevation: 3,
  },

  image: {
    width: "100%",
    height: 240,
    resizeMode: "cover",
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  searchBtn: {
    marginLeft: 10,
    backgroundColor: "#2ECC71",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    color: "#fff",
    fontWeight: "700",
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
    elevation: 1,
  },

  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 30,
  },

  btnGreen: { backgroundColor: "#2ECC71", padding: 12, borderRadius: 14 },
  btnRed: { backgroundColor: "#E74C3C", padding: 12, borderRadius: 14 },

  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
