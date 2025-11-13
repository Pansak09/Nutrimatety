// screens/SummaryScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import ProgressBar from '../components/ProgressBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '../api'; // axios instance ของคุณ

export default function SummaryScreen({ navigation, route }) {
  const {
    name,
    email = '',
    goal,           // 'รักษาหุ่น','ลดน้ำหนัก','เพิ่มน้ำหนัก'
    height,         // string/number (cm)
    weight,         // string/number (kg)
    dob,            // ISO string เช่น "2025-08-10T..."
    food,           // string
    imageUri,       // URI จาก ImagePicker อาจเป็น null
    gender = 'ชาย', // 'ชาย','หญิง','male','female'
  } = route.params || {};

  const [saving, setSaving] = useState(false);

  // Utils 
  const bmrMifflin = (g, Hcm, Wkg, Ayears) => {
    const s = (g || '').toString().trim().toLowerCase();
    const base =
      10 * (Number(Wkg) || 0) +
      6.25 * (Number(Hcm) || 0) -
      5 * (Number(Ayears) || 0);
    if (['ชาย', 'male', 'm'].includes(s)) return Math.round(base + 5);
    if (['หญิง', 'female', 'f'].includes(s)) return Math.round(base - 161);
    return Math.round(base);
  };

  const birth = dob ? new Date(dob) : null;
  const now = new Date();
  let age = 0;
  if (birth && !isNaN(birth)) {
    age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  }
  const calorie = bmrMifflin(gender, height, weight, age);

  const normalizeGender = (g) => {
    const s = (g || '').toString().trim().toLowerCase();
    if (['ชาย', 'male', 'm'].includes(s)) return 'male';
    if (['หญิง', 'female', 'f'].includes(s)) return 'female';
    return s || null;
  };
  const toYMD = (iso) => (iso ? String(iso).slice(0, 10) : null);

  // Save to DB
  const saveAndGo = async () => {
    try {
      setSaving(true);

      // ดึง token เพื่อแนบ Authorization
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('บันทึกไม่สำเร็จ', 'ไม่พบโทเค็น กรุณาเข้าสู่ระบบใหม่');
        setSaving(false);
        return;
      }

      // คำนวณ target_weight เบื้องต้น
      const currentW = Number(weight);
      let targetW = null;
      if (goal === 'ลดน้ำหนัก') targetW = currentW - 5;
      else if (goal === 'เพิ่มน้ำหนัก') targetW = currentW + 5;
      else if (goal === 'รักษาหุ่น') targetW = currentW;

      // เตรียม payload ให้ตรง schema backend
      const payload = {
        gender: normalizeGender(gender),
        date_of_birth: toYMD(dob),
        height: Number(height) || null,
        current_weight: Number(weight) || null,
        target_weight: Number(targetW) || null,
        food_allergies: food || null,
        target_calories: calorie || null,
        avatar_url: imageUri || null,
      };

      // สร้างโปรไฟล์ ถ้ามีแล้วให้ PUT อัปเดต
      try {
        await API.post('/profiles/', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        if (
          e.response?.status === 400 &&
          e.response?.data?.detail === 'Profile already exists'
        ) {
          await API.put('/profiles/', payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else if (e.response?.status === 401) {
          throw new Error('Invalid authentication credentials');
        } else {
          throw e;
        }
      }

      // เสร็จแล้วเข้า Main = Home (รีเซ็ตสแตกกันย้อนกลับ)
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main', params: { screen: 'Home' } }],
        })
      );
    } catch (e) {
      Alert.alert('บันทึกไม่สำเร็จ', e.response?.data?.detail || e.message);
    } finally {
      setSaving(false);
    }
  };

  // UI
  return (
    <View style={styles.container}>
      <ProgressBar step={6} />

      <Text style={styles.title}>ยินดีต้อนรับ คุณ {name || '-'}</Text>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.avatar} /> : null}
      <Text style={styles.calorie}>{calorie} Kcal</Text>
      <Text>ค่า BMR ต่อวัน</Text>

      <TouchableOpacity style={styles.button} onPress={saveAndGo} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>เสร็จสิ้น</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', alignItems: 'center' },
  title: { fontSize: 22, marginVertical: 20, fontWeight: 'bold' },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 20 },
  calorie: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  button: {
    width: '90%',
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
