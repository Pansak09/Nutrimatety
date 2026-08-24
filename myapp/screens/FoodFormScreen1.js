// FoodFormScreen1.js (FINAL FIXED VERSION)
import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, StyleSheet, Image, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { API, API_BASE } from "../api";
import * as ImageManipulator from "expo-image-manipulator";

// ===================== PALETTE (matches other screens) =====================
const COLORS = {
  bg: "#F6FAF8",
  card: "#FFFFFF",
  primaryDark: "#0F4C3A",
  primary: "#1B8A5A",
  primarySoft: "#E7F6EC",
  mint: "#2FBF87",
  gradientStart: "#1FAF7A",
  gradientEnd: "#0F4C3A",
  accentEnergy: "#FF7A59",
  accentProtein: "#3A7BFF",
  accentCarb: "#F5B942",
  accentFat: "#FF5FA2",
  textMain: "#0F2E27",
  textSub: "#6C8079",
  textFaint: "#9FB1AA",
  border: "#EAF2ED",
  danger: "#B00020",
  dangerSoft: "#FDECEC",
};

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
      return imageUrl;
    }

    console.log(">>> ORIGINAL IMAGE:", localImage);

    // ✅ แปลง HEIC / PNG → JPEG จริง
    const converted = await ImageManipulator.manipulateAsync(
      localImage,
      [],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    console.log(">>> CONVERTED IMAGE:", converted.uri);

    const formData = new FormData();
    formData.append("file", {
      uri: converted.uri,
      name: "photo.jpg",
      type: "image/jpeg",
    });

    const res = await fetch(`${API_BASE}/files/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      console.log("UPLOAD ERROR:", err);
      throw new Error("Upload failed");
    }

    const data = await res.json();
    console.log(">>> UPLOAD SUCCESS:", data);

    return data.url; // /uploads/xxx.jpg
  };

  // ---------------- Fetch nutrition ----------------
  const [searching, setSearching] = useState(false);
  const fetchNutrition = async (foodName) => {
    if (!foodName.trim()) return;

    try {
      setSearching(true);
      const res = await fetch(`${API_BASE}/menu?search=${encodeURIComponent(foodName)}`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        return Alert.alert("ไม่พบข้อมูล");
      }

      const f = data[0];
      setName(f.food_name || foodName);
      setProtein(f.protein?.toString() || "");
      setFat(f.fat?.toString() || "");
      setCarb(f.carb?.toString() || "");
      setKcal(f.calories?.toString() || "");
    } catch (err) {
      Alert.alert("ผิดพลาด", err.message);
    } finally {
      setSearching(false);
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
      <SafeAreaView style={styles.container} edges={["top"]}>

        {/* Header (gradient band) */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>เพิ่มรายการอาหาร</Text>
            <Text style={styles.headerSub}>มื้อ{meal || "เช้า"}</Text>
          </View>
          <View style={{ width: 38 }} />
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* IMAGE */}
          <View style={styles.imageCard}>
            {displayUri ? (
              <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
                <Image source={{ uri: displayUri }} style={[styles.image, imageSize]} />
                <View style={styles.retakeBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                  <Text style={styles.retakeBadgeText}>เปลี่ยนรูป</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.uploadBox} onPress={pickImage} activeOpacity={0.85}>
                <View style={styles.uploadIconWrap}>
                  <Ionicons name="cloud-upload-outline" size={30} color={COLORS.primary} />
                </View>
                <Text style={styles.uploadText}>เลือกรูปภาพ</Text>
                <Text style={styles.uploadSubtext}>แตะเพื่อเลือกจากคลังภาพ</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Form card */}
          <View style={styles.formCard}>
            <Text style={styles.label}>ชื่ออาหาร</Text>
            <View style={styles.searchRow}>
              <TextInput
                placeholder="เช่น ข้าวผัด"
                placeholderTextColor={COLORS.textFaint}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={name}
                onChangeText={setName}
                returnKeyType="search"
                onSubmitEditing={() => fetchNutrition(name)}
              />
              <TouchableOpacity
                style={[styles.searchBtn, searching && { opacity: 0.7 }]}
                onPress={() => fetchNutrition(name)}
                disabled={searching}
                activeOpacity={0.85}
              >
                <Ionicons name="search" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.macroGrid}>
              <MacroField
                label="โปรตีน (g)"
                value={protein}
                setter={setProtein}
                icon="barbell-outline"
                color={COLORS.accentProtein}
              />
              <MacroField
                label="ไขมัน (g)"
                value={fat}
                setter={setFat}
                icon="water-outline"
                color={COLORS.accentFat}
              />
              <MacroField
                label="คาร์โบไฮเดรต (g)"
                value={carb}
                setter={setCarb}
                icon="restaurant-outline"
                color={COLORS.accentCarb}
              />
              <MacroField
                label="แคลอรี่ (kcal)"
                value={kcal}
                setter={setKcal}
                icon="flame-outline"
                color={COLORS.accentEnergy}
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.btnCancel} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.btnCancelText}>ยกเลิก</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnSave, saving && { opacity: 0.6 }]}
            onPress={save}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnSaveGradient}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.btnText}>{saving ? "กำลังบันทึก..." : "บันทึก"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

/* ---------------------- Macro Field ---------------------- */
function MacroField({ label, value, setter, icon, color }) {
  return (
    <View style={styles.macroFieldWrap}>
      <View style={styles.fieldLabelRow}>
        <Ionicons name={icon} size={13} color={color} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={setter}
        keyboardType="numeric"
        style={[styles.input, { marginBottom: 0 }]}
        placeholder="0"
        placeholderTextColor={COLORS.textFaint}
      />
    </View>
  );
}

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 16, paddingTop: 16 },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 2,
  },

  imageCard: {
    width: "100%",
    backgroundColor: COLORS.card,
    marginBottom: 16,
    borderRadius: 22,
    padding: 8,
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: Platform.OS === "android" ? 3 : 0,
    alignItems: "center",
  },

  image: {
    borderRadius: 16,
    resizeMode: "cover",
  },

  retakeBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,44,35,0.65)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  retakeBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 5,
  },

  uploadBox: {
    width: "100%",
    height: 200,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  uploadText: {
    color: COLORS.textMain,
    fontWeight: "700",
    fontSize: 15,
  },
  uploadSubtext: {
    color: COLORS.textSub,
    fontSize: 12.5,
    marginTop: 3,
  },

  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 18,
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  label: { marginBottom: 6, fontWeight: "700", fontSize: 13.5, color: COLORS.textMain },

  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },

  searchBtn: {
    marginLeft: 8,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 14,
    marginBottom: 10,
    fontSize: 15,
    color: COLORS.textMain,
  },

  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  macroFieldWrap: {
    width: "48%",
  },

  bottomBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 18 : 16,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  btnCancel: {
    flex: 1,
    backgroundColor: COLORS.dangerSoft,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelText: { color: COLORS.danger, fontSize: 15.5, fontWeight: "800" },

  btnSave: {
    flex: 1.4,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  btnSaveGradient: {
    flexDirection: "row",
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontSize: 15.5, fontWeight: "800", marginLeft: 6 },
});