import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { API } from '../api';

// 🔹 ตัวเลือกเป้าหมายสุขภาพ
const OPTIONS = ['รักษาหุ่น', 'ลดน้ำหนัก', 'เพิ่มน้ำหนัก'];

// Helper
const normalizeGender = (g) => {
  const s = (g || '').toLowerCase();
  if (['male', 'ชาย', 'm'].includes(s)) return 'male';
  if (['female', 'หญิง', 'f'].includes(s)) return 'female';
  return null;
};

const toYMD = (d) => new Date(d).toISOString().slice(0, 10);

export default function CreateProfileScreen({ navigation }) {

  const [username, setUsername] = useState('');
  const [gender, setGender] = useState(null);
  const [dob, setDob] = useState(new Date(2000, 0, 1));
  const [showPicker, setShowPicker] = useState(false);
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [foodAllergies, setFoodAllergies] = useState('');
  const [goalChoice, setGoalChoice] = useState(null);
  const [avatarUri, setAvatarUri] = useState(null);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!res.canceled) {
      setAvatarUri(res.assets[0].uri);
    }
  };

  const onNext = async () => {
    if (!username.trim()) return Alert.alert("กรุณากรอก Username");
    if (!gender) return Alert.alert("กรุณาเลือกเพศ");
    if (!goalChoice) return Alert.alert("กรุณาเลือกเป้าหมายสุขภาพ");
    if (!height || !currentWeight) {
      return Alert.alert("กรุณากรอกส่วนสูงและน้ำหนักให้ครบ");
    }

    // 💥 ส่งไป SummaryScreen เพื่อคำนวณ Macro
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>

          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.title}>สร้างโปรไฟล์</Text>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: "#ddd" }]} />
            )}
            <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
              <Text>{avatarUri ? "เปลี่ยนรูป" : "เลือกรูป"}</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
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

            <Text style={styles.label}>ส่วนสูง (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />

            <Text style={styles.label}>น้ำหนักปัจจุบัน (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={currentWeight}
              onChangeText={setCurrentWeight}
            />

            <Text style={styles.label}>อาหารที่แพ้</Text>
            <TextInput
              style={styles.input}
              value={foodAllergies}
              onChangeText={setFoodAllergies}
            />

            <Text style={styles.label}>เป้าหมายสุขภาพ</Text>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.option, goalChoice === opt && styles.optionSelected]}
                onPress={() => setGoalChoice(opt)}
              >
                <View style={[styles.radio, goalChoice === opt && styles.radioSelected]} />
                <Text>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={onNext}>
            <Text style={styles.buttonText}>ถัดไป</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#B7FFC7" },
  scrollContent: { padding: 20, paddingBottom: 140 },
  back: { marginTop: 40, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  avatarWrap: { alignItems: "center", marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  changeBtn: { marginTop: 8, padding: 8, backgroundColor: "#eee", borderRadius: 8 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16 },
  label: { marginTop: 10, marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 8,
    paddingHorizontal: 12, height: 48,
  },
  genderRow: { flexDirection: "row", gap: 12 },
  genderBtn: { flex: 1, padding: 10, borderWidth: 1, borderRadius: 8, alignItems: "center" },
  genderActive: { backgroundColor: "#3366FF", borderColor: "#3366FF" },
  genderText: { color: "#333" },
  genderTextActive: { color: "#fff" },
  option: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#ccc",
    padding: 10, borderRadius: 8, marginBottom: 8,
  },
  optionSelected: { borderColor: "#007bff" },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, marginRight: 12 },
  radioSelected: { backgroundColor: "#007bff" },
  footer: { position: "absolute", left: 20, right: 20, bottom: 20 },
  button: {
    backgroundColor: "#3366FF", padding: 16,
    borderRadius: 12, alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
