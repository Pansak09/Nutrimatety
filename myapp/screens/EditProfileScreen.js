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
  const [showPicker, setShowPicker] = useState(false);

  const [height, setHeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetCalories, setTargetCalories] = useState("");

  const [foodAllergies, setFoodAllergies] = useState("");
  const [goal, setGoal] = useState(null);

  const [avatarUri, setAvatarUri] = useState(null);

  /* ------------------ โหลดข้อมูลจาก Backend ------------------ */
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
      setFoodAllergies(data.food_allergies || "");
      setGoal(data.goal || null);
      setAvatarUri(data.avatar_url || null);

    } catch (err) {
      Alert.alert("Error", err.response?.data?.detail || err.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  /* ------------------ เลือกรูปภาพ ------------------ */
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("ต้องอนุญาตสิทธิ์รูปภาพก่อน");

    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!res.canceled && res.assets?.length) {
      setAvatarUri(res.assets[0].uri);
    }
  };

  /* ------------------ บันทึกโปรไฟล์ ------------------ */
  const onSave = async () => {
    if (!username.trim()) return Alert.alert("กรุณากรอก Username");
    if (!gender) return Alert.alert("กรุณาเลือกเพศ");
    if (!height || !currentWeight) return Alert.alert("กรุณากรอกส่วนสูงและน้ำหนัก");

    try {
      setSaving(true);

      let finalAvatar = avatarUri;

      // Upload ใหม่ถ้าเป็น file://
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

  /* ------------------ UI ------------------ */
  if (loading) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Text>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  const shownAvatar = buildURL(avatarUri);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>แก้ไขโปรไฟล์</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Scroll Content */}
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Avatar */}
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

          {/* Card */}
          <View style={styles.card}>

            <Text style={styles.label}>Username</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} />

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

            <Text style={styles.label}>เป้าหมายสุขภาพ</Text>
            {GOAL_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.goalOption, goal === opt && styles.goalOptionActive]}
                onPress={() => setGoal(opt)}
              >
                <Text style={[styles.goalText, goal === opt && styles.goalTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.label}>วันเกิด</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
              <Text>{toYMD(dob) || "เลือกวันเกิด"}</Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={dob}
                mode="date"
                maximumDate={new Date()}
                onChange={(_, val) => {
                  setShowPicker(false);
                  if (val) setDob(val);
                }}
              />
            )}

            <Text style={styles.label}>ส่วนสูง (CM)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={height} onChangeText={setHeight} />

            <Text style={styles.label}>น้ำหนักปัจจุบัน (KG)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={currentWeight} onChangeText={setCurrentWeight} />

            <Text style={styles.label}>น้ำหนักเป้าหมาย (KG)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={targetWeight} onChangeText={setTargetWeight} />

            <Text style={styles.label}>เป้าหมายพลังงาน (kcal)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={targetCalories} onChangeText={setTargetCalories} />

            <Text style={styles.label}>อาหารที่แพ้</Text>
            <TextInput style={styles.input} value={foodAllergies} onChangeText={setFoodAllergies} />

          </View>

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={onSave} disabled={saving}>
            <Text style={styles.buttonText}>
              {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
            </Text>
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  scrollContent: { padding: 20, paddingBottom: 160 },
  avatarWrap: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  changeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#eee",
    borderRadius: 8,
    marginTop: 8,
  },
  changeBtnText: { color: "#333" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16 },
  label: { marginTop: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 14,
    marginTop: 8,
    height: 48,
  },
  genderRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
  },
  genderActive: { backgroundColor: "#3366FF", borderColor: "#3366FF" },
  genderTextActive: { color: "#fff", fontWeight: "bold" },
  goalOption: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  goalOptionActive: {
    backgroundColor: "#1C7C54",
    borderColor: "#1C7C54",
  },
  goalText: { color: "#333", textAlign: "center" },
  goalTextActive: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  footer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  button: {
    backgroundColor: "#3366FF",
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
