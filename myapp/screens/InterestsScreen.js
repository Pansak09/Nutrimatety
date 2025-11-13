// screens/InterestsScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ProgressBar from '../components/ProgressBar';

const OPTIONS = ['รักษาหุ่น', 'ลดน้ำหนัก', 'เพิ่มน้ำหนัก'];

export default function InterestsScreen({ route, navigation }) {
  const { name } = route.params;
  const [choice, setChoice] = useState(null);

  return (
    <View style={styles.container}>
      <ProgressBar step={2} />
      <Text style={styles.title}>สวัสดีคุณ {name} พันธ์ดีที่เรามีเป้าหมายของคุณกันเถอะ</Text>
      {OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.option, choice === opt && styles.optionSelected]}
          onPress={() => setChoice(opt)}
        >
          <View style={[styles.radio, choice === opt && styles.radioSelected]} />
          <Text style={styles.optText}>{opt}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[styles.button, !choice && styles.buttonDisabled]}
        disabled={!choice}
        onPress={() => navigation.navigate('PhysicalInfo', { name, goal: choice })}
      >
        <Text style={styles.btnText}>ถัดไป</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20, justifyContent:'center' },
  title: { fontSize:18, marginBottom:20 },
  option: {
    flexDirection:'row', alignItems:'center',
    padding:12, borderWidth:1, borderColor:'#ccc',
    borderRadius:8, marginBottom:12
  },
  optionSelected: { borderColor:'#007bff' },
  radio: {
    width:20, height:20, borderRadius:10,
    borderWidth:1, borderColor:'#777', marginRight:12
  },
  radioSelected: { backgroundColor:'#007bff', borderColor:'#007bff' },
  optText: { fontSize:16 },
  button: { backgroundColor:'#007bff', padding:16, borderRadius:8, alignItems:'center', marginTop:30 },
  buttonDisabled: { backgroundColor:'#aaa' },
  btnText: { color:'#fff', fontSize:16 }
});
