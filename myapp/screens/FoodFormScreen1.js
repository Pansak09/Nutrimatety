// FoodFormScreen1.js (FINAL FIXED VERSION)
import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, StyleSheet, Image, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { API, API_BASE } from "../api";

export default function FoodFormScreen1({ navigation, route }) {
  const { imageUrl, meal } = route.params || {};
  const [localImage, setLocalImage] = useState(null);
  const [imageSize, setImageSize] = useState({ width: "100%", height: 220 });

  const displayUri = localImage
    ? localImage
    : imageUrl?.startsWith("/uploads")
    ? `${API_BASE}${imageUrl}`
    : imageUrl;

  const [name, setName] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carb, setCarb] = useState("");
  const [kcal, setKcal] = useState("");
  const [saving, setSaving] = useState(false);

  // ---------------- Load image size ----------------
  useEffect(() => {
    if (displayUri) {
      Image.getSize(
        displayUri,
        (width, height) => {
          const screenWidth = Dimensions.get("window").width - 40;
          const scaleFactor = width / screenWidth;
          const imgHeight = height / scaleFactor;
          setImageSize({ width: screenWidth, height: imgHeight });
        },
        (err) => console.log("Error loading size:", err)
      );
    }
  }, [displayUri]);

  // ---------------- Choose Image ----------------
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      return Alert.alert("ไม่ได้รับสิทธิ์", "โปรดอนุญาตเข้าถึงรูปภาพในเครื่อง");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (!result.canceled) {
      console.log("LOCAL IMAGE =", result.assets[0].uri);
      setLocalImage(result.assets[0].uri);
    }
  };

  // ---------------- Upload image to backend ----------------
  const uploadImage = async () => {
    if (!localImage || !localImage.startsWith("file://")) {
      return imageUrl; // ถ้าไม่ได้เลือกรูปใหม่ → return รูปเดิม
    }

    console.log(">>> UPLOADING:", localImage);

    const formData = new FormData();
    formData.append("file", {
      uri: localImage,
      name: "photo.jpg",
      type: "image/jpeg",
    });

    const res = await fetch(`${API_BASE}/files/upload`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      console.log("UPLOAD ERROR:", err);
      throw new Error("Upload failed");
    }

    const data = await res.json();
    console.log(">>> UPLOAD SUCCESS:", data);

    return data.url; // เช่น /uploads/xxx.jpg
  };

  // ---------------- Fetch nutrition ----------------
  const fetchNutrition = async (foodName) => {
    if (!foodName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/menu?search=${encodeURIComponent(foodName)}`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        return Alert.alert("ไม่พบข้อมูล");
      }

      const f = data[0];
      setName(f.food_name || foodName);
      setProtein(f.protein?.toString() || "");
      setFat(f.fat?.toString() || "");
      setCarb(f.carbs?.toString() || "");
      setKcal(f.calories?.toString() || "");
    } catch (err) {
      Alert.alert("ผิดพลาด", err.message);
    }
  };

  // ---------------- Save meal ----------------
  const save = async () => {
    if (!name.trim()) return Alert.alert("กรุณากรอกชื่ออาหาร");

    try {
      setSaving(true);

      // ⭐ อัปโหลดรูปก่อนเซฟมื้ออาหาร ⭐
      let finalImageUrl = imageUrl;
      if (localImage && localImage.startsWith("file://")) {
        finalImageUrl = await uploadImage(); // ← กลายเป็น /uploads/*.jpg
      }

      const payload = {
        name,
        protein: parseFloat(protein) || 0,
        fat: parseFloat(fat) || 0,
        carb: parseFloat(carb) || 0,
        calories: parseFloat(kcal) || 0,
        meal_time: meal || "เช้า",
        image_url: finalImageUrl || null,
      };

      await API.post("/meals", payload);

      Alert.alert("สำเร็จ", "บันทึกข้อมูลเรียบร้อย", [
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
      Alert.alert("ผิดพลาด", err?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.imageCard}>
            {displayUri ? (
              <Image source={{ uri: displayUri }} style={[styles.image, imageSize]} />
            ) : (
              <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                <Ionicons name="cloud-upload-outline" size={40} color="#888" />
                <Text style={{ color: "#888", marginTop: 6 }}>เลือกรูปภาพ</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.label}>ชื่ออาหาร</Text>
          <View style={styles.searchRow}>
            <TextInput
              placeholder="เช่น ข้าวผัด"
              style={[styles.input, { flex: 1 }]}
              value={name}
              onChangeText={setName}
              returnKeyType="search"
              onSubmitEditing={() => fetchNutrition(name)}
            />
            <TouchableOpacity onPress={() => fetchNutrition(name)}>
              <Ionicons name="search" size={22} color="#333" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>โปรตีน (g)</Text>
          <TextInput
            value={protein}
            onChangeText={setProtein}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>ไขมัน (g)</Text>
          <TextInput
            value={fat}
            onChangeText={setFat}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>คาร์โบไฮเดรต (g)</Text>
          <TextInput
            value={carb}
            onChangeText={setCarb}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>แคลอรี่ (kcal)</Text>
          <TextInput
            value={kcal}
            onChangeText={setKcal}
            keyboardType="numeric"
            style={styles.input}
          />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.btnGreen, saving && { opacity: 0.6 }]}
            onPress={save}
            disabled={saving}
          >
            <Text style={styles.btnText}>บันทึก</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnGray} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#C9FFE0" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  imageCard: {
    width: "100%",
    backgroundColor: "#fff",
    marginTop: 30,
    borderRadius: 16,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
    marginBottom: 20,
  },

  image: {
    borderRadius: 12,
    resizeMode: "cover",
  },

  uploadBox: {
    width: "100%",
    height: 200,
    backgroundColor: "#f3f3f3",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },

  label: { marginTop: 10, marginBottom: 4, fontWeight: "600", color: "#333" },

  searchRow: { flexDirection: "row", alignItems: "center" },

  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
    marginBottom: 10,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },

  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },

  btnGreen: {
    backgroundColor: "#2ECC71",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  btnGray: {
    backgroundColor: "#777",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
