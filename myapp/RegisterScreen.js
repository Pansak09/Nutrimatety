// RegisterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegister = () => {
    if (!email || !password) {
      return Alert.alert('Error', 'กรอกอีเมลและรหัสผ่าน');
    }

    if (password !== confirm) {
      return Alert.alert('Error', 'รหัสผ่านกับยืนยันไม่ตรง');
    }

    // ❗ ยังไม่เรียก API
    // ❗ ยังไม่บันทึกลงฐานข้อมูล
    // 👉 ส่งข้อมูลไปหน้า CreateProfile แทน
    navigation.navigate('CreateProfile', {
      email,
      password,
    });
  };

  return (
    <View style={styles.container}>

      {/* Header Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('./assets/imageapp.png')}
          style={styles.logo}
        />
        <Text style={styles.heading}>สร้างบัญชีใหม่</Text>
        <Text style={styles.subheading}>
          เริ่มต้นเส้นทางสุขภาพของคุณวันนี้ 🌿
        </Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="อีเมล"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputFlex}
            placeholder="รหัสผ่าน"
            secureTextEntry={!showPass}
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Ionicons
              name={showPass ? 'eye' : 'eye-off'}
              size={22}
              color="#777"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputFlex}
            placeholder="ยืนยันรหัสผ่าน"
            secureTextEntry={!showConfirm}
            placeholderTextColor="#aaa"
            value={confirm}
            onChangeText={setConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons
              name={showConfirm ? 'eye' : 'eye-off'}
              size={22}
              color="#777"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (!email || !password || password !== confirm) &&
              styles.buttonDisabled
          ]}
          disabled={!email || !password || password !== confirm}
          onPress={handleRegister}
        >
          <Text style={styles.buttonText}>สมัครสมาชิก</Text>
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <Text style={{ color: '#555' }}>มีบัญชีอยู่แล้ว?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}> เข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// =============================================
// 💅 STYLES
// =============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B7FFC7',
    padding: 20,
    justifyContent: 'center'
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: { width: 110, height: 110, marginBottom: 10 },

  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B5E20',
  },
  subheading: {
    fontSize: 15,
    color: '#4A4A4A',
    marginTop: 4,
    textAlign: 'center'
  },

  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 18,
    marginTop: 25,
    elevation: 8,
  },

  input: {
    height: 50,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 14,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 14,
  },

  inputFlex: {
    flex: 1,
  },

  button: {
    backgroundColor: '#1B7F5A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9CCC9C',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
  },
  link: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
});
