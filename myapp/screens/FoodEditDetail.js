import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
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

export default function FoodEditDetail({ route, navigation }) {
  const { item } = route.params || {};

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="alert-circle-outline" size={28} color={COLORS.textFaint} />
          </View>
          <Text style={styles.emptyText}>ไม่พบข้อมูล</Text>
        </View>
      </SafeAreaView>
    );
  }

  const [localImage, setLocalImage] = useState(item.image_url || null);
  const [imageSize, setImageSize] = useState({ width: "100%", height: 200 });

  const fullImageUri = localImage
    ? localImage.startsWith("/")
      ? `${API_BASE}${localImage}`
      : localImage
    : null;

  const [name, setName] = useState(item.name || "");
  const [protein, setProtein] = useState(item.protein?.toString() || "");
  const [fat, setFat] = useState(item.fat?.toString() || "");
  const [carb, setCarb] = useState(item.carb?.toString() || "");
  const [calories, setCalories] = useState(
    (item.calories ?? 0).toString()
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (fullImageUri) {
      Image.getSize(
        fullImageUri,
        (width, height) => {
          const screenWidth = Dimensions.get("window").width - 40;
          const scaleFactor = width / screenWidth;
          const imageHeight = height / scaleFactor;
          setImageSize({ width: screenWidth, height: imageHeight });
        },
        (err) => console.log("Error loading image size:", err)
      );
    }
  }, [fullImageUri]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert("ไม่ได้รับสิทธิ์", "โปรดอนุญาตเข้าถึงรูปภาพในเครื่อง");
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.length) {
      setLocalImage(result.assets[0].uri);
    }
  };

  const isNumber = (v) => v === "" || !Number.isNaN(Number(v));

  const uploadImage = async (localUri) => {
    const formData = new FormData();
    formData.append("file", {
      uri: localUri,
      name: "photo.jpg",
      type: "image/jpeg",
    });

    const res = await fetch(`${API_BASE}/files/upload`, {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
      body: formData,
    });

    const data = await res.json();
    return data.url;
  };

  const save = async () => {
    if (!name) return Alert.alert("กรอกไม่ครบ", "กรุณาใส่ชื่ออาหาร");
    if (
      !isNumber(protein) ||
      !isNumber(fat) ||
      !isNumber(carb) ||
      !isNumber(calories)
    ) {
      return Alert.alert("รูปแบบไม่ถูกต้อง", "โปรดกรอกตัวเลขในช่องโภชนาการ");
    }

    try {
      setSaving(true);
      let finalImageUrl = localImage;

      if (finalImageUrl?.startsWith("file://")) {
        finalImageUrl = await uploadImage(finalImageUrl);
      }

      const payload = {
        name,
        protein: protein === "" ? 0 : Number(protein),
        fat: fat === "" ? 0 : Number(fat),
        carb: carb === "" ? 0 : Number(carb),
        calories: calories === "" ? 0 : Number(calories),
        meal_time: item.meal_time || "เช้า",
      };

      if (finalImageUrl) {
        payload.image_url = finalImageUrl;
      }

      console.log("🟢 PATCH /meals", item.id, payload);

      await API.patch(`/meals/${item.id}`, payload);

      Alert.alert("สำเร็จ", "แก้ไขข้อมูลเรียบร้อย", [
        {
          text: "ตกลง",
          onPress: () =>
            navigation.navigate("Main", {
              screen: "Home",
              params: { refresh: true },
            }),
        },
      ]);
    } catch (e) {
      console.log("❌ ERROR", e?.response?.data || e.message);
      Alert.alert("แก้ไขไม่สำเร็จ", e?.response?.data?.detail || e.message);
    } finally {
      setSaving(false);
    }
  };

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
            <Text style={styles.headerTitle}>แก้ไขรายการอาหาร</Text>
            <Text style={styles.headerSub}>มื้อ{item.meal_time || "เช้า"}</Text>
          </View>
          <View style={{ width: 38 }} />
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.imageCard}>
            {fullImageUri ? (
              <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
                <Image
                  source={{ uri: fullImageUri }}
                  style={[styles.image, imageSize]}
                />
                <View style={styles.retakeBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                  <Text style={styles.retakeBadgeText}>เปลี่ยนรูป</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                style={styles.uploadBox}
                activeOpacity={0.85}
              >
                <View style={styles.uploadIconWrap}>
                  <Ionicons name="cloud-upload-outline" size={30} color={COLORS.primary} />
                </View>
                <Text style={styles.uploadText}>เลือกรูปภาพ</Text>
                <Text style={styles.uploadSubtext}>แตะเพื่อเลือกจากคลังภาพ</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>ชื่ออาหาร</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น ข้าวผัด"
              placeholderTextColor={COLORS.textFaint}
              value={name}
              onChangeText={setName}
            />

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
                value={calories}
                setter={setCalories}
                icon="flame-outline"
                color={COLORS.accentEnergy}
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.btnCancel}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyText: { fontSize: 16, color: COLORS.textSub, fontWeight: "600" },

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

  content: { paddingHorizontal: 16, paddingTop: 16 },

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

  image: { borderRadius: 16, resizeMode: "cover" },

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
  uploadText: { color: COLORS.textMain, fontWeight: "700", fontSize: 15 },
  uploadSubtext: { color: COLORS.textSub, fontSize: 12.5, marginTop: 3 },

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

  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 14,
    marginBottom: 16,
    fontSize: 15,
    color: COLORS.textMain,
  },

  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  macroFieldWrap: { width: "48%" },

  bottomRow: {
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
}
);