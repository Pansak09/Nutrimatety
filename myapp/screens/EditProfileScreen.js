import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform, Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { API } from "../api";
import { uploadAvatar } from "../utils/uploadAvatar";

const GOAL_OPTIONS = ["รักษาหุ่น", "ลดน้ำหนัก", "เพิ่มน้ำหนัก"];

const normalizeGender = (g) => {
  const s = (g || "").toString().trim().toLowerCase();
  if (["ชาย", "male", "m"].includes(s)) return "male";
  if (["หญิง", "female", "f"].includes(s)) return "female";
  return s || null;
};

const toYMD = (d) => {
  if (!d) return null;
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt)) return null;
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
  const [showPicker, setShowPicker] = useState(false);
  const [height, setHeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetCalories, setTargetCalories] = useState("");
  const [foodAllergies, setFoodAllergies] = useState("");
  const [avatarUri, setAvatarUri] = useState(null);
  const [goal, setGoal] = useState(null); // ✅ state สำหรับเป้าหมายสุขภาพ

  const fetchMe = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) throw new Error("ยังไม่ได้เข้าสู่ระบบ");

      const { data } = await API.get("/profiles/me");
      setUsername(data.username || "");
      setGender(data.gender || null);
      setDob(data.date_of_birth ? new Date(data.date_of_birth) : new Date(2000, 0, 1));
      setHeight(data.height?.toString() ?? "");
      setCurrentWeight(data.current_weight?.toString() ?? "");
      setTargetWeight(data.target_weight?.toString() ?? "");
      setTargetCalories(data.target_calories?.toString() ?? "");
      setFoodAllergies(data.food_allergies ?? "");
      setGoal(data.goal || null); // ✅ โหลด goal จาก backend
      setAvatarUri(data.avatar_url || null);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.detail || e.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("ต้องอนุญาตเข้าถึงรูปภาพก่อน");
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!res.canceled && res.assets?.length) {
      setAvatarUri(res.assets[0].uri);
    }
  };

  const onSave = async () => {
    if (!username.trim()) return Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอก Username");
    if (!gender) return Alert.alert("ข้อมูลไม่ครบ", "กรุณาเลือกเพศ");
    if (!height || !currentWeight)
      return Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกส่วนสูงและน้ำหนักปัจจุบัน");

    try {
      setSaving(true);

      let finalAvatarUrl = avatarUri;
      if (avatarUri && avatarUri.startsWith("file://")) {
        finalAvatarUrl = await uploadAvatar(avatarUri);
      }

      const payload = {
        username: username.trim(),
        gender: normalizeGender(gender),
        date_of_birth: toYMD(dob),
        height: Number(height) || null,
        current_weight: Number(currentWeight) || null,
        target_weight: targetWeight ? Number(targetWeight) : null,
        target_calories: targetCalories ? Number(targetCalories) : null,
        goal: goal || null, // ✅ ส่ง goal ไป backend
        food_allergies: foodAllergies || null,
        avatar_url: finalAvatarUrl || null,
      };

      await API.patch("/profiles/", payload);
      Alert.alert("สำเร็จ", "อัปเดตโปรไฟล์เรียบร้อย", [
        {
          text: "ตกลง",
          onPress: () =>
            navigation.navigate("Main", {
              screen: "Profile",
              params: { refreshProfile: true },
            }),
        },
      ]);
    } catch (e) {
      Alert.alert("บันทึกไม่สำเร็จ", e.response?.data?.detail || e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Text>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  const shownAvatar = buildURL(avatarUri);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>แก้ไขโปรไฟล์</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarWrap}>
            {shownAvatar ? (
              <Image source={{ uri: shownAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: "#ddd" }]} />
            )}
            <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
              <Text style={styles.changeBtnText}>เปลี่ยนรูป</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            {/* Username */}
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="เช่น johndoe123"
            />

            {/* Gender */}
            <Text style={styles.label}>เพศ</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === "male" && styles.genderActive]}
                onPress={() => setGender("male")}
              >
                <Text style={[styles.genderText, gender === "male" && styles.genderTextActive]}>
                  ชาย
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, gender === "female" && styles.genderActive]}
                onPress={() => setGender("female")}
              >
                <Text style={[styles.genderText, gender === "female" && styles.genderTextActive]}>
                  หญิง
                </Text>
              </TouchableOpacity>
            </View>

            {/* ✅ Goal (เป้าหมายสุขภาพ) */}
            <Text style={styles.label}>เป้าหมายสุขภาพ</Text>
            <View style={{ gap: 10 }}>
              {GOAL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.goalOption, goal === opt && styles.goalOptionActive]}
                  onPress={() => setGoal(opt)}
                >
                  <Text
                    style={[styles.goalText, goal === opt && styles.goalTextActive]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date */}
            <Text style={styles.label}>วันเกิด</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
              <Text>{toYMD(dob) || "กดเพื่อเลือกวันเกิด"}</Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={dob}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={(_, selected) => {
                  setShowPicker(false);
                  if (selected) setDob(selected);
                }}
              />
            )}

            {/* Other Inputs */}
            <Text style={styles.label}>ส่วนสูง (cm)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={height} onChangeText={setHeight} />

            <Text style={styles.label}>น้ำหนักปัจจุบัน (kg)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={currentWeight} onChangeText={setCurrentWeight} />

            <Text style={styles.label}>น้ำหนักเป้าหมาย (kg)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={targetWeight} onChangeText={setTargetWeight} />

            <Text style={styles.label}>เป้าหมายพลังงาน (kcal)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={targetCalories} onChangeText={setTargetCalories} placeholder="เช่น 2200" />

            <Text style={styles.label}>อาหารที่แพ้</Text>
            <TextInput style={styles.input} value={foodAllergies} onChangeText={setFoodAllergies} placeholder="ตัวอย่าง: กุ้ง, ถั่ว" />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, saving && { opacity: 0.6 }]}
            onPress={onSave}
            disabled={saving}
          >
            <Text style={styles.buttonText}>{saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#B7FFC7" },
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  scrollContent: { padding: 16, paddingBottom: 140 },
  avatarWrap: { alignItems: "center", marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  changeBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  changeBtnText: { color: "#333" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, elevation: 2 },
  label: { marginTop: 10, marginBottom: 6, fontWeight: "600" },
  genderRow: { flexDirection: "row", gap: 12 },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
  },
  genderActive: { backgroundColor: "#3366FF", borderColor: "#3366FF" },
  genderText: { color: "#333" },
  genderTextActive: { color: "#fff", fontWeight: "bold" },
  goalOption: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  goalOptionActive: { backgroundColor: "#1C7C54", borderColor: "#1C7C54" },
  goalText: { color: "#333", fontWeight: "500" },
  goalTextActive: { color: "#fff", fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#fff",
  },
  footer: { position: "absolute", left: 16, right: 16, bottom: 16 },
  button: {
    backgroundColor: "#3366FF",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
