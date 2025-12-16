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
  Modal
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
  const [showIOSPicker, setShowIOSPicker] = useState(false);

  const [height, setHeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetCalories, setTargetCalories] = useState("");

  const [foodAllergies, setFoodAllergies] = useState("");
  const [goal, setGoal] = useState(null);

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
      <View style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color="#1B7F5A" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูลโปรไฟล์...</Text>
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
            <Ionicons name="arrow-back" size={26} color="#1B5E20" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.headerTitle}>แก้ไขโปรไฟล์</Text>
            <Text style={styles.headerSubtitle}>อัปเดตข้อมูลให้ตรงกับคุณในวันนี้ 🌿</Text>
          </View>
          <View style={{ width: 26 }} />
        </View>

        {/* Scroll */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {shownAvatar ? (
              <Image source={{ uri: shownAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person-circle-outline" size={72} color="#aaa" />
              </View>
            )}

            <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={18} color="#1B5E20" />
              <Text style={styles.changeBtnText}>เปลี่ยนรูปโปรไฟล์</Text>
            </TouchableOpacity>
          </View>

          {/* Card */}
          <View style={styles.card}>
            
            {/* Username */}
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="เช่น pansak09"
              placeholderTextColor="#aaa"
            />

            {/* Gender */}
            <Text style={styles.label}>เพศ</Text>
            <View style={styles.genderRow}>
              
              <TouchableOpacity
                style={[styles.genderBtn, gender === "male" && styles.genderActive]}
                onPress={() => setGender("male")}
              >
                <Ionicons
                  name="male"
                  size={18}
                  color={gender === "male" ? "#fff" : "#1B5E20"}
                />
                <Text style={[styles.genderText, gender === "male" && styles.genderTextActive]}>
                  ชาย
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.genderBtn, gender === "female" && styles.genderActive]}
                onPress={() => setGender("female")}
              >
                <Ionicons
                  name="female"
                  size={18}
                  color={gender === "female" ? "#fff" : "#D81B60"}
                />
                <Text style={[styles.genderText, gender === "female" && styles.genderTextActive]}>
                  หญิง
                </Text>
              </TouchableOpacity>

            </View>

            {/* Goal */}
            <Text style={styles.label}>เป้าหมายสุขภาพ</Text>
            <View style={styles.goalRow}>
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
            </View>

            {/* Birthday */}
            <Text style={styles.label}>วันเกิด</Text>
            <TouchableOpacity
              style={[styles.input, styles.dateInput]}
              onPress={() => setShowIOSPicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color="#555" />
              <Text style={styles.dateText}>{toYMD(dob)}</Text>
            </TouchableOpacity>

            <Modal
              transparent
              animationType="fade"
              visible={showIOSPicker}
              onRequestClose={() => setShowIOSPicker(false)}
            >
              <View style={styles.iosPickerOverlay}>
                <View style={styles.iosPickerBox}>
                  
                  <DateTimePicker
                    value={dob}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      if (event.type !== "dismissed") {
                        setDob(selectedDate);
                      }
                    }}
                  />

                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => setShowIOSPicker(false)}
                  >
                    <Text style={styles.doneBtnText}>เสร็จสิ้น</Text>
                  </TouchableOpacity>

                </View>
              </View>
            </Modal>

            {/* Height */}
            <Text style={styles.label}>ส่วนสูง (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
              placeholder="เช่น 170"
              placeholderTextColor="#aaa"
            />

            {/* Current Weight */}
            <Text style={styles.label}>น้ำหนักปัจจุบัน (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={currentWeight}
              onChangeText={setCurrentWeight}
              placeholder="เช่น 70"
              placeholderTextColor="#aaa"
            />

            {/* Target Weight */}
            <Text style={styles.label}>น้ำหนักเป้าหมาย (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={targetWeight}
              onChangeText={setTargetWeight}
              placeholder="เช่น 65"
              placeholderTextColor="#aaa"
            />

            {/* Target Calories */}
            <Text style={styles.label}>เป้าหมายพลังงานต่อวัน (kcal)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={targetCalories}
              onChangeText={setTargetCalories}
              placeholder="เช่น 2000"
              placeholderTextColor="#aaa"
            />

            {/* Allergies */}
            <Text style={styles.label}>อาหารที่แพ้</Text>
            <TextInput
              style={styles.input}
              value={foodAllergies}
              onChangeText={setFoodAllergies}
              placeholder="เช่น กุ้ง, ถั่ว, นมวัว"
              placeholderTextColor="#aaa"
            />

          </View>
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, saving && { opacity: 0.7 }]}
            onPress={onSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>บันทึกการเปลี่ยนแปลง</Text>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#B7FFC7" },

  centerBox: {
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#1B5E20",
    fontWeight: "600",
  },

  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1B5E20",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#4F6F52",
    marginTop: 2,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 180,
  },

  avatarWrap: {
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  changeBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    elevation: 2,
  },

  changeBtnText: {
    marginLeft: 6,
    color: "#1B5E20",
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    elevation: 5,
  },

  label: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: "700",
    color: "#1B5E20",
  },

  input: {
    borderWidth: 1,
    backgroundColor: "#F9FFF9",
    borderColor: "#D0E6D8",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 4,
    height: 48,
  },

  genderRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    backgroundColor: "#F1FFF4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  genderActive: {
    backgroundColor: "#1B7F5A",
    borderColor: "#1B7F5A",
  },

  genderText: {
    color: "#1B5E20",
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    backgroundColor: "#F8FFF9",
  },

  goalOptionActive: {
    backgroundColor: "#FFB74D",
    borderColor: "#FFB74D",
  },

  goalText: {
    fontSize: 13,
    color: "#455A64",
  },

  goalTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  dateText: {
    color: "#333",
  },

  iosPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 9999,
    elevation: 9999,
  },

  iosPickerBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: "center",
  },

  doneBtn: {
    marginTop: 10,
    backgroundColor: "#1B7F5A",
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 10,
  },

  doneBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  footer: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
  },

  button: {
    backgroundColor: "#1B7F5A",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
