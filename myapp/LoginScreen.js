// LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from './api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    try {
      const { data } = await API.post('/users/login', { email, password });

      if (data?.access_token) {
        await AsyncStorage.setItem('access_token', data.access_token);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main', params: { screen: 'Home' } }],
        });
      } else {
        setResponseMessage('ไม่พบ token จากเซิร์ฟเวอร์');
      }
    } catch (err) {
      setResponseMessage(
        'Error: ' + (err.response?.data?.detail || err.message)
      );
    }
  };

  return (
    <View style={styles.container}>

      {/* LOGO */}
      <View style={styles.logoContainer}>
        <Image
          source={require('./assets/imageapp.png')} // เปลี่ยนตามต้องการ
          style={styles.logo}
        />
        <Text style={styles.heading}>ยินดีต้อนรับกลับมา!</Text>
        <Text style={styles.subheading}>เข้าสู่ระบบเพื่อเริ่มต้นวันดี ๆ ของคุณ </Text>
      </View>

      {/* BOX */}
      <View style={styles.formContainer}>

        <TextInput
          style={styles.input}
          placeholder="อีเมล"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#aaa"
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputFlex}
            placeholder="รหัสผ่าน"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity onPress={() => setShowPass(prev => !prev)}>
            <Ionicons
              name={showPass ? 'eye' : 'eye-off'}
              size={22}
              color="#6E6E6E"
            />
          </TouchableOpacity>
        </View>

        {/* LOGIN BUTTON */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginText}>เข้าสู่ระบบ</Text>
        </TouchableOpacity>

        {/* SIGN UP */}
        <View style={styles.bottomRow}>
          <Text style={{ color: '#666' }}>ยังไม่มีบัญชี?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupLink}> สมัครสมาชิก</Text>
          </TouchableOpacity>
        </View>

      </View>

      {responseMessage ? (
        <Text style={styles.response}>{responseMessage}</Text>
      ) : null}
    </View>
  );
}

// ===============================
// 💅 BEAUTIFUL MODERN STYLES
// ===============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B7FFC7',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: 10,
  },

  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1B5E20',
  },
  subheading: {
    fontSize: 15,
    color: '#4A4A4A',
    marginTop: 4,
    textAlign: 'center',
  },

  formContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },

  input: {
    height: 52,
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },

  inputFlex: {
    flex: 1,
  },

  loginBtn: {
    backgroundColor: '#1B7F5A',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },

  bottomRow: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
  },

  signupLink: {
    fontWeight: 'bold',
    color: '#007BFF',
  },

  response: {
    marginTop: 20,
    textAlign: 'center',
    color: '#c62828',
    fontWeight: '600',
  },
});
