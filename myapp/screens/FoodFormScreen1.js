// FoodFormScreen1.js (FINAL FIXED VERSION)
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, StyleSheet, Image, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions,
  TouchableWithoutFeedback, Keyboard,
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

  // ---------------- Autocomplete predictions (ชื่ออาหารจาก database) ----------------
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const justPickedRef = useRef(false); // กันไม่ให้ fetch ซ้ำทันทีหลังผู้ใช้กดเลือกจาก dropdown

  const fetchPredictions = async (q) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      setLoadingSuggestions(true);
      const res = await fetch(`${API_BASE}/menu?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
    } catch (err) {
      console.log("PREDICTION ERROR:", err.message);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (justPickedRef.current) {
      justPickedRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!name.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(() => fetchPredictions(name), 350);
    return () => clearTimeout(debounceRef.current);
  }, [name]);

  const selectSuggestion = (f) => {
    justPickedRef.current = true;
    setName(f.food_name || "");
    setProtein(f.protein?.toString() || "");
    setFat(f.fat?.toString() || "");
    setCarb(f.carb?.toString() || "");
    setKcal(f.calories?.toString() || "");
    setSuggestions([]);
    setShowSuggestions(false);
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
      // หมายเหตุ: ไม่เขียนทับชื่อที่ผู้ใช้พิมพ์เอง — ดึงมาแค่ค่าโภชนาการเท่านั้น
      // (เดิม setName(f.food_name || foodName) ทำให้ "ต้มยำ" ถูกแทนที่ด้วยชื่อที่ตรงที่สุดในฐานข้อมูล เช่น "ก๋วยเตี๋ยวต้มยำ")
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
  const dismissAll = () => {
    Keyboard.dismiss();
    setShowSuggestions(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={dismissAll}>
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

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

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
            <View style={{ zIndex: 20 }}>
              <View style={styles.searchRow}>
                <TextInput
                  placeholder="เช่น ข้าวผัด"
                  placeholderTextColor={COLORS.textFaint}
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
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

              {/* Autocomplete dropdown */}
              {showSuggestions && (loadingSuggestions || suggestions.length > 0) && (
                <View style={styles.suggestBox}>
                  {loadingSuggestions ? (
                    <View style={styles.suggestLoadingRow}>
                      <Ionicons name="search" size={14} color={COLORS.textFaint} />
                      <Text style={styles.suggestLoadingText}>กำลังค้นหา...</Text>
                    </View>
                  ) : (
                    suggestions.map((f, idx) => (
                      <TouchableOpacity
                        key={`${f.food_name}-${idx}`}
                        style={[
                          styles.suggestRow,
                          idx === suggestions.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => selectSuggestion(f)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.suggestIconWrap}>
                          <Ionicons name="restaurant-outline" size={14} color={COLORS.primary} />
                        </View>
                        <Text style={styles.suggestName} numberOfLines={1}>
                          {f.food_name}
                        </Text>
                        {f.calories != null && (
                          <Text style={styles.suggestKcal}>{f.calories} kcal</Text>
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
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
      </TouchableWithoutFeedback>
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

  suggestBox: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 54, // เว้นพื้นที่ปุ่มค้นหาด้านขวา
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    overflow: "hidden",
    zIndex: 30,
  },
  suggestRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  suggestName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textMain,
  },
  suggestKcal: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textFaint,
    marginLeft: 8,
  },
  suggestLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  suggestLoadingText: {
    marginLeft: 6,
    fontSize: 13,
    color: COLORS.textFaint,
  },

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