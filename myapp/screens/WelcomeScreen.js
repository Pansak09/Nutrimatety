// screens/WelcomeScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import ProgressBar from '../components/ProgressBar';

export default function WelcomeScreen({ navigation }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState(null); // 'male' | 'female'

  const goNext = () => {
    navigation.navigate('Interests', { name, gender });
  };

  return (
    <View style={styles.container}>
      <ProgressBar step={1} />
      <Text style={styles.title}>ยินดีต้อนรับ</Text>
      <Text style={styles.subtitle}>อันแรกเลย, จะให้เรารู้จักคุณว่าอะไร เราขอเรียกคุณ</Text>

      <TextInput
        style={styles.input}
        placeholder="ชื่อของคุณ"
        value={name}
        onChangeText={setName}
      />

      {/* ปุ่มเลือกเพศ */}
      <View style={styles.genderRow}>
        <TouchableOpacity
          style={[styles.genderButton, gender === 'male' && styles.genderSelected]}
          onPress={() => setGender('male')}
        >
          <Text style={[styles.genderText, gender === 'male' && styles.genderTextSelected]}>
            ชาย
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.genderButton, gender === 'female' && styles.genderSelected]}
          onPress={() => setGender('female')}
        >
          <Text style={[styles.genderText, gender === 'female' && styles.genderTextSelected]}>
            หญิง
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, !(name && gender) && { opacity: 0.5 }]}
        onPress={goNext}
        disabled={!(name && gender)}
      >
        <Text style={styles.btnText}>ถัดไป</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20, justifyContent:'center' },
  title: { fontSize:26, fontWeight:'bold', marginBottom:8 },
  subtitle: { fontSize:16, color:'#555', marginBottom:20 },
  input: { borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:12, marginBottom:16 },

  genderRow: { flexDirection:'row', gap:12, marginBottom:24 },
  genderButton: {
    flex:1,
    borderWidth:1,
    borderColor:'#ccc',
    borderRadius:8,
    paddingVertical:12,
    alignItems:'center',
    justifyContent:'center',
  },
  genderSelected: { borderColor:'#007bff', backgroundColor:'#e8f1ff' },
  genderText: { fontSize:16, color:'#333' },
  genderTextSelected: { color:'#007bff', fontWeight:'600' },

  button: { backgroundColor:'#007bff', padding:16, borderRadius:8, alignItems:'center' },
  btnText: { color:'#fff', fontSize:16 }, // แก้ fontSizae -> fontSize
});
