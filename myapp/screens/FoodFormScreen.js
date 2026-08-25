// FoodFormScreen.js
import * as ImageManipulator from "expo-image-manipulator";
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, StyleSheet, Image, TouchableOpacity,
  Alert, KeyboardAvoidingView, ScrollView, Platform,
  TouchableWithoutFeedback, Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { API, API_BASE } from "../api";

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

// ✨ เพิ่มรายการ Mapping ชื่ออาหาร → ชื่อไทย
const nameMap = {
  "Papaya Salad": "ส้มตำ",
  "Pad Thai": "ผัดไทย",
  "Fried Rice": "ข้าวผัด",
  "Chicken Green Curry": "แกงเขียวหวานไก่",
  "Shrimp Tom Yum": "ต้มยำกุ้ง",
  "Grilled Pork": "ลาบหมู",
  "Roast Chicken": "ข้าวมันไก่",
  "Omelet Rice": "ข้าวไข่เจียว",
};


export default function FoodFormScreen({ navigation, route }) {
  const { imageUrl, preset = {} } = route.params || {};

  // ---------------------- IMAGE ----------------------
  const [localImage, setLocalImage] = useState(imageUrl || null);
  const fullImageUri =
    localImage && typeof localImage === "string"
      ? localImage.startsWith("/")
        ? `${API_BASE}${localImage}`
        : localImage
      : null;

  // ---------------------- FORM DATA ----------------------
  const [name, setName] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carb, setCarb] = useState("");
  const [kcal, setKcal] = useState("");

  const mealTime = route.params?.meal || "เช้า";
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  // ---------------------- PRESET (จาก AI + DB) ----------------------
  useEffect(() => {
    // เติมชื่ออาหาร
    if (preset.name) {
      const cleaned = preset.name.trim();
      const mapped = nameMap[cleaned] || cleaned;
      setName(mapped);
    }
    // เติมโภชนาการ
    if (preset.protein) setProtein(String(preset.protein));
    if (preset.fat) setFat(String(preset.fat));
    if (preset.carb) setCarb(String(preset.carb));
    if (preset.kcal) setKcal(String(preset.kcal));
  }, [preset]);

  // ---------------------- AUTOCOMPLETE (ชื่ออาหารจาก database) ----------------------
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
      const res = await API.get(`/menu?search=${encodeURIComponent(q)}`);
      setSuggestions(Array.isArray(res.data) ? res.data.slice(0, 6) : []);
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

  const selectSuggestion = (item) => {
    justPickedRef.current = true;
    setName(item.food_name || item.name || "");
    setProtein(item.protein?.toString() || "");
    setFat(item.fat?.toString() || "");
    setCarb(item.carb?.toString() || "");
    setKcal(item.calories?.toString() || "");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // ---------------------- SEARCH NUTRITION ----------------------
  const searchNutrition = async () => {
    const q = name.trim();
    if (!q) return Alert.alert("กรุณากรอกชื่ออาหาร");

    try {
      setSearching(true);
      const res = await API.get(`/menu?search=${encodeURIComponent(q)}`);

      if (!res.data?.length) {
        return Alert.alert("ไม่พบข้อมูลโภชนาการของอาหารนี้");
      }

      const item = res.data[0];

      setProtein(item.protein?.toString() || "");
      setFat(item.fat?.toString() || "");
      setCarb(item.carb?.toString() || "");
      setKcal(item.calories?.toString() || "");
    } catch (err) {
      Alert.alert("เกิดข้อผิดพลาด", err.message);
    } finally {
      setSearching(false);
    }
  };

  // ---------------------- UPLOAD IMAGE ----------------------
  const uploadImage = async (localUri) => {
    if (!localUri || !localUri.startsWith("file://")) return null;

    // ✅ convert ทุกครั้ง
    const converted = await ImageManipulator.manipulateAsync(
      localUri,
      [],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

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
      throw new Error(err);
    }

    const data = await res.json();
    return data.url;
  };

  // ---------------------- SAVE ----------------------
  const save = async () => {
    if (!name.trim()) return Alert.alert("กรุณาระบุชื่ออาหาร");

    let uploadUrl = localImage;

    try {
      setSaving(true);

      // อัปโหลดเฉพาะ file://
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
        image_url: uploadUrl || null,
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
  const dismissAll = () => {
    Keyboard.dismiss();
    setShowSuggestions(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <TouchableWithoutFeedback onPress={dismissAll}>
      <SafeAreaView style={s.container} edges={["top"]}>

        {/* Header (gradient band) */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.header}
        >
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>เพิ่มรายการอาหาร</Text>
            <Text style={s.headerSub}>มื้อ{mealTime}</Text>
          </View>
          <View style={{ width: 38 }} />
        </LinearGradient>

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* IMAGE */}
          <View style={s.imageCard}>
            {fullImageUri ? (
              <Image source={{ uri: fullImageUri }} style={s.image} />
            ) : (
              <View style={[s.image, s.noImage]}>
                <Ionicons name="fast-food-outline" size={34} color={COLORS.textFaint} />
                <Text style={s.noImageText}>ไม่มีภาพอาหาร</Text>
              </View>
            )}
          </View>

          {/* Form card */}
          <View style={s.formCard}>
            {/* NAME */}
            <Text style={s.label}>ชื่ออาหาร</Text>
            <View style={{ zIndex: 20 }}>
              <View style={s.row}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="เช่น ข้าวผัด"
                  placeholderTextColor={COLORS.textFaint}
                />
                <TouchableOpacity
                  style={[s.searchBtn, searching && { opacity: 0.7 }]}
                  onPress={searchNutrition}
                  disabled={searching}
                  activeOpacity={0.85}
                >
                  <Ionicons name="search" size={16} color="#fff" />
                  <Text style={s.searchBtnText}>{searching ? "..." : "ค้นหา"}</Text>
                </TouchableOpacity>
              </View>

              {/* Autocomplete dropdown */}
              {showSuggestions && (loadingSuggestions || suggestions.length > 0) && (
                <View style={s.suggestBox}>
                  {loadingSuggestions ? (
                    <View style={s.suggestLoadingRow}>
                      <Ionicons name="search" size={14} color={COLORS.textFaint} />
                      <Text style={s.suggestLoadingText}>กำลังค้นหา...</Text>
                    </View>
                  ) : (
                    suggestions.map((item, idx) => (
                      <TouchableOpacity
                        key={`${item.food_name}-${idx}`}
                        style={[
                          s.suggestRow,
                          idx === suggestions.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => selectSuggestion(item)}
                        activeOpacity={0.7}
                      >
                        <View style={s.suggestIconWrap}>
                          <Ionicons name="restaurant-outline" size={14} color={COLORS.primary} />
                        </View>
                        <Text style={s.suggestName} numberOfLines={1}>
                          {item.food_name}
                        </Text>
                        {item.calories != null && (
                          <Text style={s.suggestKcal}>{item.calories} kcal</Text>
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* MACROS */}
            <View style={s.macroGrid}>
              <Field
                label="โปรตีน (g)"
                value={protein}
                setter={setProtein}
                numeric
                icon="barbell-outline"
                color={COLORS.accentProtein}
                half
              />
              <Field
                label="ไขมัน (g)"
                value={fat}
                setter={setFat}
                numeric
                icon="water-outline"
                color={COLORS.accentFat}
                half
              />
              <Field
                label="คาร์โบไฮเดรต (g)"
                value={carb}
                setter={setCarb}
                numeric
                icon="restaurant-outline"
                color={COLORS.accentCarb}
                half
              />
              <Field
                label="แคลอรี่ (kcal)"
                value={kcal}
                setter={setKcal}
                numeric
                icon="flame-outline"
                color={COLORS.accentEnergy}
                half
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* BUTTONS */}
        <View style={s.bottomBar}>
          <TouchableOpacity style={s.btnCancel} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={s.btnCancelText}>ยกเลิก</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btnSave, saving && { opacity: 0.6 }]}
            onPress={save}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.btnSaveGradient}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={s.btnSaveText}>{saving ? "กำลังบันทึก..." : "บันทึก"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ---------------------- FIELD COMPONENT ----------------------
function Field({ label, value, setter, numeric, icon, color, half }) {
  return (
    <View style={[{ marginBottom: 14 }, half && { width: "48%" }]}>
      <View style={s.fieldLabelRow}>
        {icon && <Ionicons name={icon} size={13} color={color || COLORS.primary} />}
        <Text style={[s.label, { marginLeft: icon ? 5 : 0, marginBottom: 0 }]}>{label}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={setter}
        keyboardType={numeric ? "numeric" : "default"}
        style={s.input}
        placeholder="0"
        placeholderTextColor={COLORS.textFaint}
      />
    </View>
  );
}

// ---------------------- STYLES ----------------------
const s = StyleSheet.create({
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
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: Platform.OS === "android" ? 3 : 0,
  },

  image: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
  },

  noImage: {
    backgroundColor: COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    marginTop: 8,
    color: COLORS.textFaint,
    fontWeight: "600",
    fontSize: 13,
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

  label: {
    fontSize: 13.5,
    fontWeight: "700",
    color: COLORS.textMain,
    marginBottom: 6,
  },

  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  suggestBox: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 78, // เว้นพื้นที่ปุ่มค้นหาด้านขวา
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
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  searchBtnText: {
    marginLeft: 5,
    color: "#fff",
    fontWeight: "700",
    fontSize: 13.5,
  },

  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
    color: COLORS.textMain,
  },

  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
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
  btnSaveText: { color: "#fff", fontSize: 15.5, fontWeight: "800", marginLeft: 6 },
});