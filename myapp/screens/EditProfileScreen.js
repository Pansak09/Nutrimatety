import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { API } from "../api";
import { uploadAvatar } from "../utils/uploadAvatar";
import { DatePicker } from '../components/date-picker';

// ===================== PALETTE (matches Home / Profile) =====================
const COLORS = {
  bg: "#F6FAF8",
  card: "#FFFFFF",
  primaryDark: "#0F4C3A",
  primary: "#1B8A5A",
  primarySoft: "#E7F6EC",
  mint: "#2FBF87",
  gradientStart: "#1FAF7A",
  gradientEnd: "#0F4C3A",
  accentPink: "#D81B60",
  accentPinkSoft: "#FDE8F0",
  accentGoal: "#FF9F43",
  accentGoalSoft: "#FFF1E0",
  textMain: "#0F2E27",
  textSub: "#6C8079",
  textFaint: "#9FB1AA",
  border: "#EAF2ED",
};

const GOAL_OPTIONS = ["รักษาหุ่น", "ลดน้ำหนัก", "เพิ่มน้ำหนัก"];
const LIFESTYLE_OPTIONS = [
  { key: "sedentary", label: "ไม่ค่อยออกกำลังกาย" },
  { key: "light", label: "ออกกำลังกายเล็กน้อย" },
  { key: "moderate", label: "ออกกำลังกายปานกลาง" },
  { key: "active", label: "ออกกำลังกายหนัก" },
  { key: "athlete", label: "นักกีฬา / ฝึกหนักมาก" },
];



const normalizeGender = (g) => {
  const s = (g || "").toLowerCase();
  if (["ชาย", "male", "m"].includes(s)) return "male";
  if (["หญิง", "female", "f"].includes(s)) return "female";
  return null;
};

const toYMD = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
};

const buildURL = (u) =>
  !u ? null : u.startsWith("/uploads") ? `${API.defaults.baseURL}${u}` : u;

export default function EditProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState("");
  const [gender, setGender] = useState(null);

  const [dob, setDob] = useState(new Date(2000, 0, 1));
  const [showIOSPicker, setShowIOSPicker] = useState(false);

  const [height, setHeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetCalories, setTargetCalories] = useState("");

  const [foodAllergies, setFoodAllergies] = useState("");
  const [goal, setGoal] = useState(null);
  const [lifestyle, setLifestyle] = useState("light");


  const [avatarUri, setAvatarUri] = useState(null);

  /* โหลดข้อมูลผู้ใช้ */
  const fetchMe = useCallback(async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("access_token");
      if (!token) throw new Error("ยังไม่ได้เข้าสู่ระบบ");

      const { data } = await API.get("/profiles/me");

      setUsername(data.username || "");
      setGender(data.gender || null);
      setDob(
        data.date_of_birth ? new Date(data.date_of_birth) : new Date(2000, 0, 1)
      );
      setHeight(data.height?.toString() ?? "");
      setCurrentWeight(data.current_weight?.toString() ?? "");
      setTargetWeight(data.target_weight?.toString() ?? "");
      setTargetCalories(data.target_calories?.toString() ?? "");
      setFoodAllergies(data.food_allergies || "");
      setGoal(data.goal || null);
      setLifestyle(data.lifestyle || "light");
      setAvatarUri(data.avatar_url || null);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.detail || err.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  /* เลือกรูปภาพ */
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("ต้องอนุญาตสิทธิ์รูปภาพก่อน", "กรุณาเปิดสิทธิ์ในตั้งค่า");

    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!res.canceled && res.assets?.length) {
      setAvatarUri(res.assets[0].uri);
    }
  };




  /*  บันทึกโปรไฟล์ */
  const onSave = async () => {
    if (!username.trim()) return Alert.alert("กรุณากรอก Username");
    if (!gender) return Alert.alert("กรุณาเลือกเพศ");
    if (!height || !currentWeight)
      return Alert.alert("กรุณากรอกส่วนสูงและน้ำหนัก");

    try {
      setSaving(true);

      let finalAvatar = avatarUri;
      if (avatarUri && avatarUri.startsWith("file://")) {
        finalAvatar = await uploadAvatar(avatarUri);
      }

      const payload = {
        username: username.trim(),
        gender: normalizeGender(gender),
        date_of_birth: toYMD(dob),
        height: Number(height),
        current_weight: Number(currentWeight),
        target_weight: targetWeight ? Number(targetWeight) : null,
        target_calories: targetCalories ? Number(targetCalories) : null,
        goal: goal || null,
        lifestyle: lifestyle,
        food_allergies: foodAllergies || null,
        avatar_url: finalAvatar || null,
      };

      await API.patch("/profiles/", payload);
      Alert.alert("สำเร็จ", "บันทึกข้อมูลเรียบร้อย");

      navigation.navigate("Main", {
        screen: "Profile",
        params: { refreshProfile: true },
      });
    } catch (e) {
      Alert.alert("บันทึกไม่สำเร็จ", e.response?.data?.detail || e.message);
    } finally {
      setSaving(false);
    }
  };

  /* Loading */
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูลโปรไฟล์...</Text>
      </SafeAreaView>
    );
  }

  const shownAvatar = buildURL(avatarUri);

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
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>แก้ไขโปรไฟล์</Text>
          <View style={{ width: 38 }} />
        </LinearGradient>

        {/* Scroll */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarShadowWrap}>
              {shownAvatar ? (
                <Image source={{ uri: shownAvatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={54} color={COLORS.textFaint} />
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.changeBtn} onPress={pickImage} activeOpacity={0.85}>
              <Ionicons name="camera-outline" size={16} color={COLORS.primaryDark} />
              <Text style={styles.changeBtnText}>เปลี่ยนรูปโปรไฟล์</Text>
            </TouchableOpacity>
          </View>

          {/* Card: บัญชี */}
          <View style={styles.card}>
            <SectionLabel icon="person-outline" text="ข้อมูลบัญชี" />

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="เช่น pansak09"
              placeholderTextColor={COLORS.textFaint}
            />

            <Text style={styles.label}>เพศ</Text>
            <View style={styles.genderRow}>

              <TouchableOpacity
                style={[styles.genderBtn, gender === "male" && styles.genderActiveMale]}
                onPress={() => setGender("male")}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="male"
                  size={17}
                  color={gender === "male" ? "#fff" : COLORS.primary}
                />
                <Text style={[styles.genderText, gender === "male" && styles.genderTextActive]}>
                  ชาย
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.genderBtn, gender === "female" && styles.genderActiveFemale]}
                onPress={() => setGender("female")}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="female"
                  size={17}
                  color={gender === "female" ? "#fff" : COLORS.accentPink}
                />
                <Text style={[styles.genderText, gender === "female" && styles.genderTextActive]}>
                  หญิง
                </Text>
              </TouchableOpacity>

            </View>

            <DatePicker
              label="วันเกิด"
              value={dob}
              onChange={setDob}
            />
          </View>

          {/* Card: เป้าหมายสุขภาพ */}
          <View style={styles.card}>
            <SectionLabel icon="flag-outline" text="เป้าหมาย & ไลฟ์สไตล์" />

            <Text style={styles.label}>เป้าหมายสุขภาพ</Text>
            <View style={styles.goalRow}>
              {GOAL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.goalOption, goal === opt && styles.goalOptionActive]}
                  onPress={() => setGoal(opt)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.goalText, goal === opt && styles.goalTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>ระดับกิจกรรม (Lifestyle)</Text>
            <View style={styles.goalRow}>
              {LIFESTYLE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.goalOption,
                    lifestyle === opt.key && styles.goalOptionActive,
                  ]}
                  onPress={() => setLifestyle(opt.key)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.goalText,
                      lifestyle === opt.key && styles.goalTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Card: ร่างกาย & โภชนาการ */}
          <View style={styles.card}>
            <SectionLabel icon="body-outline" text="ร่างกาย & โภชนาการ" />

            <Text style={styles.label}>ส่วนสูง (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
              placeholder="เช่น 170"
              placeholderTextColor={COLORS.textFaint}
            />

            <Text style={styles.label}>น้ำหนักปัจจุบัน (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={currentWeight}
              onChangeText={setCurrentWeight}
              placeholder="เช่น 70"
              placeholderTextColor={COLORS.textFaint}
            />

            <Text style={styles.label}>เป้าหมายพลังงานต่อวัน (kcal)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={targetCalories}
              onChangeText={setTargetCalories}
              placeholder="เช่น 2000"
              placeholderTextColor={COLORS.textFaint}
            />

            <Text style={styles.label}>อาหารที่แพ้</Text>
            <TextInput
              style={styles.input}
              value={foodAllergies}
              onChangeText={setFoodAllergies}
              placeholder="เช่น กุ้ง, ถั่ว, นมวัว"
              placeholderTextColor={COLORS.textFaint}
            />
          </View>

          {/* spacer so content clears the floating footer button */}
          <View style={{ height: 90 }} />

        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={onSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.buttonGradient, saving && { opacity: 0.75 }]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={19} color="#fff" />
                  <Text style={styles.buttonText}>บันทึกการเปลี่ยนแปลง</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

/* ---------------------- Section Label ---------------------- */
function SectionLabel({ icon, text }) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={styles.sectionLabelIconWrap}>
        <Ionicons name={icon} size={15} color={COLORS.primary} />
      </View>
      <Text style={styles.sectionLabelText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  centerBox: {
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.textSub,
    fontWeight: "600",
  },

  /* Header */
  header: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  avatarWrap: {
    alignItems: "center",
    marginBottom: 18,
  },
  avatarShadowWrap: {
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    borderRadius: 60,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 4,
    borderColor: COLORS.card,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },

  changeBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 999,
  },

  changeBtnText: {
    marginLeft: 6,
    color: COLORS.primaryDark,
    fontWeight: "700",
    fontSize: 13,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionLabelIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  sectionLabelText: {
    fontSize: 14.5,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },

  label: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: "700",
    fontSize: 13.5,
    color: COLORS.textMain,
  },

  input: {
    borderWidth: 1,
    backgroundColor: COLORS.bg,
    borderColor: COLORS.border,
    borderRadius: 13,
    paddingHorizontal: 14,
    marginTop: 4,
    height: 48,
    color: COLORS.textMain,
    fontSize: 15,
  },

  genderRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  genderBtn: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  genderActiveMale: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderActiveFemale: {
    backgroundColor: COLORS.accentPink,
    borderColor: COLORS.accentPink,
  },

  genderText: {
    color: COLORS.textMain,
    fontWeight: "600",
  },

  genderTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  goalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },

  goalOption: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  goalOptionActive: {
    backgroundColor: COLORS.accentGoal,
    borderColor: COLORS.accentGoal,
  },

  goalText: {
    fontSize: 13,
    color: COLORS.textSub,
    fontWeight: "600",
  },

  goalTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  footer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
  },

  button: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 8,
  },
});