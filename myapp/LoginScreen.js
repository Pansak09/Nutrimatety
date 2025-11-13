// LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from './api';  // ใช้ config กลางจาก api.js

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
  try {
    const { data } = await API.post('/users/login', { email, password });
    if (data?.access_token) {
      await AsyncStorage.setItem('access_token', data.access_token); // ต้อง await
      navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Home' } }] });
    } else {
      setResponseMessage('ไม่พบ token จากเซิร์ฟเวอร์');
    }
  } catch (err) {
    setResponseMessage('Error: ' + (err.response?.data?.detail || err.message));
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>ลงชื่อเข้าใช้บัญชีของคุณ</Text>
      <Text style={styles.subheading}>กรอกอีเมลและรหัสผ่านของคุณเพื่อเข้าสู่ระบบ</Text>

      <TextInput
        style={styles.input}
        placeholder="อีเมล"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#888"
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.inputFlex}
          placeholder="รหัสผ่าน"z
          secureTextEntry={!showPass}
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#888"
        />
        <TouchableOpacity onPress={() => setShowPass(v => !v)}>
          <Ionicons
            name={showPass ? 'eye' : 'eye-off'}
            size={24}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
      </TouchableOpacity>

      <View style={styles.bottomRow}>
        <Text>ยังไม่มีบัญชี? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.signupLink}>สมัครสมาชิก</Text>
        </TouchableOpacity>
      </View>

      {responseMessage ? (
        <Text style={styles.response}>{responseMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#B7FFC7', alignItems:'center', justifyContent:'center', padding:20 },
  heading: { fontSize:24, fontWeight:'bold', marginBottom:10 },
  subheading: { fontSize:16, color:'#555', marginBottom:30 },
  input: {
    width:'100%', height:50, backgroundColor:'white',
    borderRadius:10, borderColor:'#ccc', borderWidth:1,
    paddingHorizontal:10, marginBottom:15
  },
  inputRow: {
    flexDirection:'row', alignItems:'center',
    width:'100%', height:50, backgroundColor:'white',
    borderRadius:10, borderColor:'#ccc', borderWidth:1,
    paddingHorizontal:10, marginBottom:15
  },
  inputFlex: { flex:1, height:'100%' },
  button: {
    width:'100%', padding:15,
    backgroundColor:'#4CAF50', borderRadius:10,
    alignItems:'center', marginBottom:15
  },
  buttonText: { color:'#fff', fontSize:16, fontWeight:'bold' },
  bottomRow: { flexDirection:'row', marginTop:10 },
  signupLink: { color:'#0066cc', fontWeight:'bold' },
  response: { marginTop:20, color:'#333' }
});
