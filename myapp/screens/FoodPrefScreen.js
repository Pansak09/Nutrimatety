// screens/FoodPrefScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import ProgressBar from '../components/ProgressBar';

export default function FoodPrefScreen({ route, navigation }) {
  const { name, goal, height, weight, dob } = route.params;
  const [food, setFood] = useState('');

  const handleNext = () => {
    navigation.navigate('Picture', {
      name,
      goal,
      height,
      weight,
      dob, 
      food,
    });
  };

  return (
    <View style={styles.container}>
      <ProgressBar step={4} />
      <Text style={styles.title}>คุณ {name} แพ้อาหารอะไรบ้าง?</Text>
      <TextInput
        style={styles.input}
        placeholder="เช่น กุ้ง, แป้ง, เนื้อ"
        value={food}
        onChangeText={setFood}
      />
      <TouchableOpacity
        style={[styles.button, !food && styles.buttonDisabled]}
        disabled={!food}
        onPress={handleNext}
      >
        <Text style={styles.btnText}>ถัดไป</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20, justifyContent:'center' },
  title: { fontSize:18, marginBottom:20 },
  input: { borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:12, marginBottom:20 },
  button: { backgroundColor:'#007bff', padding:16, borderRadius:8, alignItems:'center' },
  buttonDisabled: { backgroundColor:'#aaa' },
  btnText: { color:'#fff', fontSize:16 }
});