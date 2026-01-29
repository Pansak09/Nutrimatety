// CameraScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, Alert, Linking
} from 'react-native';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { API_BASE, detect } from '../api';

// "Omelet Rice 0.83" = "Omelet Rice"
function cleanFoodName(name) {
  if (!name) return "";
  if (/^[0-9.]+$/.test(name)) return ""; // ถ้าชื่อเป็นตัวเลขล้วน
  return name.replace(/([0-9]*\.[0-9]+)|([0-9]+)/g, "").trim();
}

export default function CameraScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const meal = route.params?.meal || 'เช้า';

  const cameraRef = useRef(null);
  const [hasPerm, setHasPerm] = useState(null);
  const [facing, setFacing] = useState("back");
  const [shooting, setShooting] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [thumb, setThumb] = useState(null);

  // ขอสิทธิ์กล้อง
  useEffect(() => {
    (async () => {
      const { Camera } = await import("expo-camera");
      const { status } = await Camera.requestCameraPermissionsAsync();

      setHasPerm(status === "granted");

      if (status !== "granted") {
        Alert.alert(
          "ต้องการสิทธิ์กล้อง",
          "ไปที่ Settings > Expo Go > Camera",
          [{ text: "เปิด Settings", onPress: () => Linking.openSettings() }]
        );
      }
    })();
  }, []);

  // ถ่ายภาพ
  const onSnap = async () => {
    if (!cameraRef.current) return;
    try {
      setShooting(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
      });
      setShooting(false);

      if (!photo?.uri) return;

      setThumb(photo.uri);
      await uploadAndGo(photo.uri);

    } catch (e) {
      setShooting(false);
      Alert.alert("ถ่ายภาพไม่สำเร็จ", e.message);
    }
  };

  // เลือกรูปจากคลัง
  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });

    if (!res.canceled && res.assets?.length) {
      setThumb(res.assets[0].uri);
      await uploadAndGo(res.assets[0].uri);
    }
  };

  // อัปโหลด + วิเคราะห์
  const uploadAndGo = async (uri) => {
    try {
      setUploading(true);
      setProgress(0);

      const data = await detect(uri, (evt) => {
        if (evt?.total) setProgress(evt.loaded / evt.total);
      });

      console.log("📡 YOLO Raw:", data);

      // ใช้ชื่อจาก FastAPI โดยตรง
      let rawName = data?.name || "";

      console.log("📡 Raw name:", rawName);

      const foodNameEN = cleanFoodName(rawName);
      console.log("🍽 Cleaned:", foodNameEN);

      const imageUrl = data?.image_url || uri;

      let preset = {
        name: foodNameEN,
        protein: "",
        fat: "",
        carb: "",
        kcal: "",
      };

      // ค้นหาโภชนาการในฐานข้อมูล
      if (foodNameEN) {
        try {
          const menu = await axios.get(`${API_BASE}/menu`, {
            params: { search: foodNameEN },
          });

          if (menu.data.length > 0) {
            const m = menu.data[0];
            preset = {
              name: m.food_name,
              protein: String(m.protein || ""),
              fat: String(m.fat || ""),
              carb: String(m.carb || ""),
              kcal: String(m.calories || ""),
            };
          }

        } catch (err) {
          console.log("❌ Load nutrition failed:", err.message);
        }
      }

      console.log("📌 Preset ส่งไปหน้า FoodForm:", preset);

      setUploading(false);

      navigation.navigate("FoodForm", {
        meal,
        imageUrl,
        preset,
        detections: data?.detections || [],
      });

    } catch (e) {
      setUploading(false);
      Alert.alert("พลาด", e.message);
    }
  };

  // UI
  if (hasPerm === null)
    return <View style={styles.center}><Text>กำลังขอสิทธิ์กล้อง...</Text></View>;

  if (hasPerm === false)
    return <View style={styles.center}><Text>ไม่ได้รับอนุญาตให้ใช้กล้อง</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} />

      {/* ปุ่มล่าง */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.smallBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shutter, shooting && { opacity: 0.6 }]}
          disabled={shooting}
          onPress={onSnap}
        />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity style={styles.smallBtn}
            onPress={() => setFacing((f) => f === "back" ? "front" : "back")}>
            <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallBtn} onPress={pickFromLibrary}>
            <Ionicons name="images-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading */}
      {uploading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#fff", marginTop: 8 }}>
            {Math.round(progress * 100)}%
          </Text>
          {thumb && (
            <Image source={{ uri: thumb }}
              style={{ width: 110, height: 110, borderRadius: 10, marginTop: 10 }} />
          )}
        </View>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  bottomBar: {
    position: "absolute",
    bottom: 28,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#ddd",
  },
  smallBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});
