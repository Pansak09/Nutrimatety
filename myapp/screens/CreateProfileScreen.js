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

// 🔹 Helper Functions
const normalizeGender = (g) => {
  const s = (g || '').toString().trim().toLowerCase();
  if (['ชาย', 'male', 'm'].includes(s)) return 'male';
  if (['หญิง', 'female', 'f'].includes(s)) return 'female';
  return s || null;
};
const toYMD = (d) => {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date)) return null;
  return date.toISOString().slice(0, 10);
};
const buildURL = (u) => (!u ? null : u.startsWith('/uploads') ? `${API.defaults.baseURL}${u}` : u);

export default function CreateProfileScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState(null);
  const [dob, setDob] = useState(new Date(2000, 0, 1));
  const [showPicker, setShowPicker] = useState(false);
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [foodAllergies, setFoodAllergies] = useState('');
  const [goalChoice, setGoalChoice] = useState(null); // ✅ เป้าหมายสุขภาพ
  const [avatarUri, setAvatarUri] = useState(null);
  const [saving, setSaving] = useState(false);

  // ✅ เลือกรูปโปรไฟล์
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('ต้องอนุญาต', 'กรุณาอนุญาตเข้าถึงรูปภาพก่อน');
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1,1],
      quality: 0.9,
    });
    if (!res.canceled && res.assets?.length) {
      setAvatarUri(res.assets[0].uri);
    }
  };

  // ✅ อัปโหลดรูปถ้ามี
  const uploadAvatarIfNeeded = async () => {
    if (avatarUri && avatarUri.startsWith('file://')) {
      const form = new FormData();
      form.append('file', { uri: avatarUri, name: 'avatar.jpg', type: 'image/jpeg' });
      const { data } = await API.post('/files/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.url;
    }
    return avatarUri || null;
  };

  // ✅ ฟังก์ชันบันทึกโปรไฟล์
  const onSave = async () => {
    if (!username.trim()) return Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอก Username');
    if (!gender) return Alert.alert('ข้อมูลไม่ครบ', 'กรุณาเลือกเพศ');
    if (!goalChoice) return Alert.alert('ข้อมูลไม่ครบ', 'กรุณาเลือกเป้าหมายสุขภาพ');
    if (!height || !currentWeight) {
      return Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกส่วนสูงและน้ำหนักปัจจุบัน');
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('ยังไม่ได้เข้าสู่ระบบ');

      const finalAvatarUrl = await uploadAvatarIfNeeded();

      const payload = {
        username: username.trim(),
        gender: normalizeGender(gender),
        date_of_birth: toYMD(dob),
        height: Number(height) || null,
        current_weight: Number(currentWeight) || null,
        target_weight: targetWeight ? Number(targetWeight) : null,
        food_allergies: foodAllergies || null,
        avatar_url: finalAvatarUrl,
        goal: goalChoice, // ✅ เพิ่มเป้าหมายใน payload
      };

      console.log("📌 Payload ส่งไป API:", payload);

      await API.post('/profiles/', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ หลังบันทึกสำเร็จ → ไปหน้า InterestsScreen
      Alert.alert('สำเร็จ', 'บันทึกโปรไฟล์เรียบร้อย', [
        {
          text: 'ไปต่อ',
          onPress: () => navigation.navigate('Interests', { name: username }),
        },
      ]);
    } catch (e) {
      Alert.alert('บันทึกไม่สำเร็จ', e.response?.data?.detail || e.message);
    } finally {
      setSaving(false);
    }
  };

  const shownAvatar = buildURL(avatarUri);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.title}>สร้างโปรไฟล์</Text>

          {/* รูปโปรไฟล์ */}
          <View style={styles.avatarWrap}>
            {shownAvatar
              ? <Image source={{ uri: shownAvatar }} style={styles.avatar} />
              : <View style={[styles.avatar, { backgroundColor:'#ddd' }]} />
            }
            <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
              <Text style={styles.changeBtnText}>{avatarUri ? 'เปลี่ยนรูป' : 'เลือกรูป'}</Text>
            </TouchableOpacity>
          </View>

          {/* ฟอร์มโปรไฟล์ */}
          <View style={styles.card}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="เช่น johndoe123"
            />

            <Text style={styles.label}>เพศ</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'male' && styles.genderActive]}
                onPress={() => setGender('male')}
              >
                <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>ชาย</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'female' && styles.genderActive]}
                onPress={() => setGender('female')}
              >
                <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>หญิง</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>วันเกิด</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
              <Text>{toYMD(dob) || 'กดเพื่อเลือกวันเกิด'}</Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={dob}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_, selected) => {
                  setShowPicker(false);
                  if (selected) setDob(selected);
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

            <Text style={styles.label}>น้ำหนักเป้าหมาย (kg) - ไม่บังคับ</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={targetWeight}
              onChangeText={setTargetWeight}
            />

            <Text style={styles.label}>อาหารที่แพ้ (ถ้ามี)</Text>
            <TextInput
              style={styles.input}
              value={foodAllergies}
              onChangeText={setFoodAllergies}
              placeholder="ตัวอย่าง: กุ้ง, ถั่ว"
            />

            {/* ✅ ส่วนใหม่: เป้าหมายสุขภาพ */}
            <Text style={styles.label}>เป้าหมายของคุณ</Text>
            {OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.option, goalChoice === opt && styles.optionSelected]}
                onPress={() => setGoalChoice(opt)}
              >
                <View style={[styles.radio, goalChoice === opt && styles.radioSelected]} />
                <Text style={styles.optText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ปุ่มบันทึก */}
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.button, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ==============================
// 💅 STYLES
// ==============================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#B7FFC7' },
  scrollContent: { padding: 20, paddingBottom: 140 },
  back: { marginTop: 40, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },

  avatarWrap:{ alignItems:'center', marginBottom:16 },
  avatar:{ width:100, height:100, borderRadius:50 },
  changeBtn:{ marginTop:8, paddingVertical:8, paddingHorizontal:16, borderRadius:8, backgroundColor:'#eee' },
  changeBtnText:{ color:'#333' },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2 },
  label: { marginTop: 10, marginBottom: 6, fontWeight: '600' },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center' },
  genderActive: { backgroundColor: '#3366FF', borderColor: '#3366FF' },
  genderText: { color: '#333' },
  genderTextActive: { color: '#fff', fontWeight: 'bold' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    paddingHorizontal: 12, height: 48, backgroundColor: '#fff'
  },
  option: {
    flexDirection:'row', alignItems:'center',
    padding:10, borderWidth:1, borderColor:'#ccc',
    borderRadius:8, marginBottom:8
  },
  optionSelected: { borderColor:'#007bff' },
  radio: { width:18, height:18, borderRadius:9, borderWidth:1, borderColor:'#777', marginRight:12 },
  radioSelected: { backgroundColor:'#007bff', borderColor:'#007bff' },
  optText: { fontSize:16 },
  footer: { position: 'absolute', left: 20, right: 20, bottom: 16 },
  button: { backgroundColor: '#3366FF', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
