// screens/PictureScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ProgressBar from '../components/ProgressBar';

export default function PictureScreen({ navigation, route }) {
  const { name, goal, height, weight, dob, food } = route.params;
  const [imageUri, setImageUri] = useState(null);

  const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Error', 'ขออนุญาตเข้าถึงรูปภาพไม่ได้');
    return;
  }
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets?.length) {
      setImageUri(result.assets[0].uri);
    }
  } catch (e) {
    console.error(e);
    Alert.alert('Error', 'เกิดข้อผิดพลาดในการเลือกภาพ');
  }
};


  const handleNext = () => {
    navigation.navigate('Summary', { name, goal, height, weight, dob, food, imageUri });
  };
  const handleSkip = () => {
    navigation.navigate('Summary', { name, goal, height, weight, dob, food, imageUri: null });
  };

  return (
    <View style={styles.container}>
      <ProgressBar step={5} />
      <Text style={styles.prompt}>เลือกภาพ หรือกดข้าม</Text>
      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} activeOpacity={0.7}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholder} />
        )}
        <Text style={styles.changeText}>Change Picture</Text>
      </TouchableOpacity>
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.button, !imageUri && styles.buttonDisabled]}
          disabled={!imageUri}
          onPress={handleNext}
        >
          <Text style={styles.btnText}>ถัดไป</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>ข้าม</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20, justifyContent:'center', alignItems:'center' },
  prompt: { fontSize:18, marginBottom:20 },
  avatarContainer: { alignItems:'center', marginBottom:30 },
  placeholder: { width:120, height:120, borderRadius:60, backgroundColor:'#ccc' },
  avatar: { width:120, height:120, borderRadius:60 },
  changeText: { marginTop:10, color:'#555' },
  buttonsRow: { flexDirection:'row', width:'90%', justifyContent:'space-between' },
  button: { flex:1, backgroundColor:'#007bff', padding:16, borderRadius:8, alignItems:'center', marginRight:10 },
  buttonDisabled: { backgroundColor:'#aaa' },
  skipButton: { flex:1, padding:16, borderRadius:8, alignItems:'center', borderWidth:1, borderColor:'#007bff' },
  btnText: { color:'#fff', fontSize:16 },
  skipText: { color:'#007bff', fontSize:16 }
});
