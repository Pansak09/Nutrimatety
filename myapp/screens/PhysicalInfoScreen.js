// screens/PhysicalInfoScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import ProgressBar from '../components/ProgressBar';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function PhysicalInfoScreen({ route, navigation }) {
  const { name, goal } = route.params;
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [dob, setDob] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const handleNext = () => {
    // Serialize dob to ISO string for navigation params
    navigation.navigate('FoodPref', {
      name,
      goal,
      height,
      weight,
      dob: dob.toISOString(),
    });
  };

  return (
    <View style={styles.container}>
      <ProgressBar step={3} />
      <Text style={styles.title}>กรอกส่วนสูง น้ำหนัก และวันเกิด</Text>
      <TextInput
        style={styles.input}
        placeholder="ส่วนสูง (cm)"
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
      />
      <TextInput
        style={styles.input}
        placeholder="น้ำหนัก (kg)"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />
      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.input}>
        <Text>{dob.toLocaleDateString()}</Text>
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
      <TouchableOpacity
        style={[styles.button, !(height && weight && dob) && styles.buttonDisabled]}
        disabled={!(height && weight)}
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
  input: { borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:12, marginBottom:15 },
  button: { backgroundColor:'#007bff', padding:16, borderRadius:8, alignItems:'center' },
  buttonDisabled: { backgroundColor:'#aaa' },
  btnText: { color:'#fff', fontSize:16 }
});