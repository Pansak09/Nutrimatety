// RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from './api';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) return Alert.alert('Error', 'กรอกอีเมลและรหัสผ่าน');
    if (password !== confirm) return Alert.alert('Error', 'รหัสผ่านกับยืนยันไม่ตรง');

    setLoading(true);
    try {
      const { data } = await API.post('/users/register', { email, password });
      const token = data?.access_token;
      if (!token) throw new Error('ไม่พบ token จากเซิร์ฟเวอร์');

      await AsyncStorage.setItem('access_token', token);

      navigation.replace('CreateProfile');
    } catch (err) {
  const msg = err.response?.data?.detail || err.message;
  if (msg.includes('already registered')) {
    Alert.alert(
      'มีบัญชีอยู่แล้ว',
      'กรุณาเข้าสู่ระบบด้วยอีเมลนี้',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'เข้าสู่ระบบ', onPress: () => navigation.replace('Login') }
      ]
    );
  } else {
    Alert.alert('Error', msg);
  }
}
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>สมัครสมาชิก</Text>
      <View style={styles.row}>
        <Text>มีบัญชีอยู่แล้ว? </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>เข้าสู่ระบบ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="อีเมล"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputFlex}
            placeholder="รหัสผ่าน"
            secureTextEntry={!showPass}
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPass(v => !v)}>
            <Ionicons
              name={showPass ? 'eye' : 'eye-off'}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputFlex}
            placeholder="ยืนยันรหัสผ่าน"
            secureTextEntry={!showConfirm}
            placeholderTextColor="#888"
            value={confirm}
            onChangeText={setConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(v => !v)}>
            <Ionicons
              name={showConfirm ? 'eye' : 'eye-off'}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (!email || !password || password !== confirm || loading) && styles.buttonDisabled
        ]}
        disabled={!email || !password || password !== confirm || loading}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>
          {loading ? 'กำลังสมัคร...' : 'ตกลง'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B7FFC7',
    padding: 20,
  },
  back: {
    marginTop: 40,
    marginLeft: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginLeft: 20,
  },
  row: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: 20,
  },
  link: {
    color: '#0066cc',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  inputFlex: {
    flex: 1,
    height: '100%',
  },
  button: {
    backgroundColor: '#3366FF',
    borderRadius: 12,
    paddingVertical: 15,
    marginHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
