// screens/CreateProfileScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

const OPTIONS = ['รักษาหุ่น', 'ลดน้ำหนัก', 'เพิ่มน้ำหนัก'];

const toYMD = (d) => new Date(d).toISOString().slice(0, 10);

export default function CreateProfileScreen({ navigation }) {

  const [username, setUsername] = useState('');
  const [gender, setGender] = useState(null);
  const [dob, setDob] = useState(new Date(2000, 0, 1));
  const [showPicker, setShowPicker] = useState(false);
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [foodAllergies, setFoodAllergies] = useState('');
  const [goalChoice, setGoalChoice] = useState(null);
  const [avatarUri, setAvatarUri] = useState(null);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.95,
      aspect: [1, 1],
    });
    if (!res.canceled) setAvatarUri(res.assets[0].uri);
  };

  const onNext = () => {
    if (!username.trim()) return Alert.alert("กรุณากรอก Username");
    if (!gender) return Alert.alert("กรุณาเลือกเพศ");
    if (!goalChoice) return Alert.alert("กรุณาเลือกเป้าหมายสุขภาพ");
    if (!height || !currentWeight) {
      return Alert.alert("กรุณากรอกข้อมูลให้ครบ");
    }

    navigation.navigate("Summary", {
      name: username.trim(),
      gender,
      height,
      weight: currentWeight,
      dob: toYMD(dob),
      goal: goalChoice,
      lifestyle: "light",
      food: foodAllergies,
      imageUri: avatarUri
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Back */}
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#1B5E20" />
          </TouchableOpacity>

          {/* Header */}
          <Text style={styles.title}>สร้างโปรไฟล์ของคุณ</Text>
          <Text style={styles.subtitle}>ข้อมูลนี้ช่วยให้ระบบแนะนำโภชนาการได้แม่นยำขึ้น 🌿</Text>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person-circle-outline" size={70} color="#aaa" />
              </View>
            )}

            <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
              <Text style={styles.changeBtnText}>
                {avatarUri ? "เปลี่ยนรูป" : "เลือกรูปโปรไฟล์"}
              </Text>
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
              {["male", "female"].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, gender === g && styles.genderActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                    {g === "male" ? "ชาย" : "หญิง"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Birthday */}
            <Text style={styles.label}>วันเกิด</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
              <Text>{toYMD(dob)}</Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={dob}
                mode="date"
                maximumDate={new Date()}
                onChange={(_, sel) => {
                  setShowPicker(false);
                  if (sel) setDob(sel);
                }}
              />
            )}

            {/* Height */}
            <Text style={styles.label}>ส่วนสูง (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="เช่น 175"
              placeholderTextColor="#aaa"
              value={height}
              onChangeText={setHeight}
            />

            {/* Weight */}
            <Text style={styles.label}>น้ำหนักปัจจุบัน (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="เช่น 70"
              placeholderTextColor="#aaa"
              value={currentWeight}
              onChangeText={setCurrentWeight}
            />

            {/* Allergies */}
            <Text style={styles.label}>อาหารที่แพ้ (ถ้ามี)</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น ถั่ว, กุ้ง"
              placeholderTextColor="#aaa"
              value={foodAllergies}
              onChangeText={setFoodAllergies}
            />

            {/* Goal */}
            <Text style={styles.label}>เป้าหมายสุขภาพ</Text>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.option, goalChoice === opt && styles.optionSelected]}
                onPress={() => setGoalChoice(opt)}
              >
                <View style={[styles.radio, goalChoice === opt && styles.radioSelected]} />
                <Text style={styles.optionLabel}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={onNext}>
            <Text style={styles.buttonText}>ถัดไป</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ======================
// 💅 BEAUTIFUL STYLES
// ======================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#B7FFC7" },

  scrollContent: { padding: 20, paddingBottom: 160 },

  back: { marginTop: 40 },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1B5E20",
    marginTop: 10,
  },

  subtitle: {
    fontSize: 15,
    color: "#444",
    marginBottom: 20,
  },

  avatarWrap: {
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 60,
  },

  avatarPlaceholder: {
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },

  changeBtn: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },

  changeBtnText: {
    color: "#333",
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  label: {
    marginTop: 10,
    marginBottom: 6,
    fontWeight: "700",
    color: "#1B5E20",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: "#FAFAFA",
  },

  genderRow: {
    flexDirection: "row",
    gap: 12,
  },

  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    alignItems: "center",
  },

  genderActive: {
    backgroundColor: "#1B7F5A",
    borderColor: "#1B7F5A",
  },

  genderText: { color: "#333", fontWeight: "600" },

  genderTextActive: { color: "#fff", fontWeight: "700" },

  option: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  optionSelected: {
    borderColor: "#1B7F5A",
    backgroundColor: "#E3F8EE",
  },

  optionLabel: { fontSize: 16, fontWeight: "500" },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#999",
    marginRight: 12,
  },

  radioSelected: {
    borderColor: "#1B7F5A",
    backgroundColor: "#1B7F5A",
  },

  footer: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
  },

  button: {
    backgroundColor: "#1B7F5A",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});
