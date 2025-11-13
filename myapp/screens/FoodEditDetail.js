import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { API, API_BASE } from "../api";

export default function FoodEditDetail({ route, navigation }) {
  const { item } = route.params || {};
  if (!item) return <Text>ไม่พบข้อมูล</Text>;

  const [localImage, setLocalImage] = useState(item.image_url || null);
  const [imageSize, setImageSize] = useState({ width: "100%", height: 200 });

  const fullImageUri = localImage
    ? localImage.startsWith("/")
      ? `${API_BASE}${localImage}`
      : localImage
    : null;

  const [name, setName] = useState(item.name || "");
  const [protein, setProtein] = useState(item.protein?.toString() || "");
  const [fat, setFat] = useState(item.fat?.toString() || "");
  const [carb, setCarb] = useState(item.carb?.toString() || "");
  const [calories, setCalories] = useState(
    (item.calories ?? 0).toString()
  ); 
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (fullImageUri) {
      Image.getSize(
        fullImageUri,
        (width, height) => {
          const screenWidth = Dimensions.get("window").width - 40;
          const scaleFactor = width / screenWidth;
          const imageHeight = height / scaleFactor;
          setImageSize({ width: screenWidth, height: imageHeight });
        },
        (err) => console.log("Error loading image size:", err)
      );
    }
  }, [fullImageUri]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert("ไม่ได้รับสิทธิ์", "โปรดอนุญาตเข้าถึงรูปภาพในเครื่อง");
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.length) {
      setLocalImage(result.assets[0].uri);
    }
  };

  const isNumber = (v) => v === "" || !Number.isNaN(Number(v));

  const uploadImage = async (localUri) => {
    const formData = new FormData();
    formData.append("file", {
      uri: localUri,
      name: "photo.jpg",
      type: "image/jpeg",
    });

    const res = await fetch(`${API_BASE}/files/upload`, {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
      body: formData,
    });

    const data = await res.json();
    return data.url;
  };

  const save = async () => {
    if (!name) return Alert.alert("กรอกไม่ครบ", "กรุณาใส่ชื่ออาหาร");
    if (
      !isNumber(protein) ||
      !isNumber(fat) ||
      !isNumber(carb) ||
      !isNumber(calories)
    ) {
      return Alert.alert("รูปแบบไม่ถูกต้อง", "โปรดกรอกตัวเลขในช่องโภชนาการ");
    }

    try {
      setSaving(true);
      let finalImageUrl = localImage;

      if (finalImageUrl?.startsWith("file://")) {
        finalImageUrl = await uploadImage(finalImageUrl);
      }

      const payload = {
        name,
        protein: protein === "" ? 0 : Number(protein),
        fat: fat === "" ? 0 : Number(fat),
        carb: carb === "" ? 0 : Number(carb),
        calories: calories === "" ? 0 : Number(calories), 
        meal_time: item.meal_time || "เช้า",
      };

      if (finalImageUrl) {
        payload.image_url = finalImageUrl;
      }

      console.log("🟢 PATCH /meals", item.id, payload);

      await API.patch(`/meals/${item.id}`, payload);

      Alert.alert("สำเร็จ", "แก้ไขข้อมูลเรียบร้อย", [
        {
          text: "ตกลง",
          onPress: () =>
            navigation.navigate("Main", {
              screen: "Home",
              params: { refresh: true },
            }),
        },
      ]);
    } catch (e) {
      console.log("❌ ERROR", e?.response?.data || e.message);
      Alert.alert("แก้ไขไม่สำเร็จ", e?.response?.data?.detail || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.imageWrap}>
            {fullImageUri ? (
              <Image
                source={{ uri: fullImageUri }}
                style={[styles.image, imageSize]}
              />
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                style={styles.imageUploadBox}
              >
                <Ionicons name="cloud-upload-outline" size={36} color="#888" />
                <Text style={{ color: "#888", marginTop: 4 }}>เลือกรูปภาพ</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.label}>ชื่ออาหาร</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น ข้าวผัด"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>โปรตีน (g)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={protein}
            onChangeText={setProtein}
          />

          <Text style={styles.label}>ไขมัน (g)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={fat}
            onChangeText={setFat}
          />

          <Text style={styles.label}>คาร์โบไฮเดรต (g)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={carb}
            onChangeText={setCarb}
          />

          <Text style={styles.label}>แคลอรี่ (kcal)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={calories}
            onChangeText={setCalories}
          />
        </ScrollView>

        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={[styles.btnGreen, saving && { opacity: 0.6 }]}
            onPress={save}
            disabled={saving}
          >
            <Text style={styles.btnText}>บันทึก</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnRed}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.btnText}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#B7FFC7" },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  imageWrap: { marginTop: 40, marginBottom: 12, alignItems: "center" },
  image: { width: "100%", borderRadius: 8, resizeMode: "cover" },
  imageUploadBox: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { marginTop: 8, marginBottom: 6, color: "#2b2b2b" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  btnGreen: {
    backgroundColor: "#0BA24F",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  btnRed: {
    backgroundColor: "#C62828",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
