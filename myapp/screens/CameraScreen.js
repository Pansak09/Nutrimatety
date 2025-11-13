//CameraScreen.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert, Linking } from 'react-native';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { API_BASE, detect } from '../api';

export default function CameraScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const meal = route.params?.meal || 'เช้า';

  const cameraRef = useRef(null);
  const [hasPerm, setHasPerm] = useState(null);
  const [facing, setFacing] = useState('back');
  const [shooting, setShooting] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [thumb, setThumb] = useState(null);

  useEffect(() => {
    (async () => {
      const { Camera } = await import('expo-camera');
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPerm(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          'ต้องการสิทธิ์กล้อง',
          'ไปที่ Settings > Expo Go > Camera เพื่อเปิดสิทธิ์',
          [{ text: 'เปิด Settings', onPress: () => Linking.openSettings() }, { text: 'ตกลง' }]
        );
      }
    })();
  }, []);

  const onSnap = async () => {
    if (!cameraRef.current) return;
    try {
      setShooting(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: true });
      setShooting(false);
      if (!photo?.uri) return;

      setThumb(photo.uri);
      await uploadAndGo(photo.uri);
    } catch (e) {
      setShooting(false);
      Alert.alert('ถ่ายภาพไม่สำเร็จ', e?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('ต้องอนุญาต', 'กรุณาอนุญาตเข้าถึงรูปภาพก่อน');
    }

    const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 0.9 });

    if (!res.canceled && res.assets?.length) {
      setThumb(res.assets[0].uri);
      await uploadAndGo(res.assets[0].uri);
    }
  };

  const uploadAndGo = async (uri) => {
    try {
      setUploading(true);
      setProgress(0);

      const data = await detect(uri, (evt) => {
        if (evt?.total) setProgress(evt.loaded / evt.total);
      });

      const foodNameEN = data?.name || '';
      const imageUrl = data?.image_url || uri;

      let preset = {
        name: foodNameEN, protein: '', fat: '', carb: '', kcal: ''
      };

      if (foodNameEN) {
        try {
          const menuRes = await axios.get(`${API_BASE}/menu`, {
            params: { search: foodNameEN }
          });

          if (menuRes.data.length > 0) {
            const match = menuRes.data[0]; 
            preset = {
              name: match.food_name || foodNameEN,
              protein: match.protein?.toString() || '',
              fat: match.fat?.toString() || '',
              carb: match.carbs?.toString() || '',
              kcal: match.calories?.toString() || '',
            };
          }
        } catch (err) {
          console.warn('ค้นหาเมนูล้มเหลว', err.message);
        }
      }

      setUploading(false);

      navigation.navigate('FoodForm', {
        meal,
        imageUrl,
        preset,
        detections: data?.detections || [],
      });
    } catch (e) {
      setUploading(false);
      Alert.alert('อัปโหลดไม่สำเร็จ', e?.response?.data?.detail || e.message);
    }
  };

  if (hasPerm === null) return <View style={styles.center}><Text>กำลังขอสิทธิ์กล้อง...</Text></View>;
  if (hasPerm === false) return <View style={styles.center}><Text>ไม่ได้รับอนุญาตให้ใช้กล้อง</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.smallBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.shutter, shooting && { opacity: 0.6 }]} disabled={shooting} onPress={onSnap} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity style={styles.smallBtn} onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}>
            <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallBtn} onPress={pickFromLibrary}>
            <Ionicons name="images-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {uploading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color:'#fff', marginTop:8 }}>{`กำลังอัปโหลด... ${Math.round(progress * 100)}%`}</Text>
          {thumb ? <Image source={{ uri: thumb }} style={{ width: 110, height: 110, borderRadius: 10, marginTop: 10 }} /> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute', bottom: 28, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  shutter: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#fff', borderWidth: 4, borderColor: '#ddd' },
  smallBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.45)', alignItems:'center', justifyContent:'center' },
  loading: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', alignItems:'center', justifyContent:'center' },
  center: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#000' },
});
