import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert
} from "react-native";
import { API, API_BASE } from "../api";

export default function FoodDetail({ route, navigation }) {
  const { item } = route.params || {};

  if (!item) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 18, color: "#666" }}>ไม่พบข้อมูลอาหาร</Text>
      </View>
    );
  }

  // ------------------ IMAGE FIX ------------------
  let imageUri = item.image_url || "";

  if (imageUri.startsWith("/")) {
    imageUri = `${API_BASE}${imageUri}`;
  }

  // ------------------ DELETE ------------------
  const confirmDelete = () => {
    Alert.alert("ลบรายการ", "คุณต้องการลบหรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ลบ", style: "destructive", onPress: deleteItem },
    ]);
  };

  console.log("🔥 ITEM =", item);
  console.log("🔥 image_url =", item.image_url);


  const deleteItem = async () => {
    try {
      await API.delete(`/meals/${item.id}`);

      Alert.alert("สำเร็จ", "ลบข้อมูลเรียบร้อยแล้ว");

      navigation.navigate("Main", {
        screen: "Home",
        params: { refresh: Date.now() },
      });
    } catch (err) {
      Alert.alert("ผิดพลาด", err.response?.data?.detail || err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      {/* IMAGE */}
      <View style={styles.imgCard}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.img} />
        ) : (
          <View style={styles.noImg}>
            <Text style={{ color: "#888" }}>ไม่มีภาพอาหาร</Text>
          </View>
        )}
      </View>

      <Text style={styles.name}>{item.name}</Text>

      <Text style={styles.mealTag}>{item.meal_time || "-"}</Text>

      <Text style={styles.kcalText}>
        {item.calories || item.kcal || 0} kcal
      </Text>

      {/* MACROS */}
      <View style={styles.macroRow}>
        <Macro label="โปรตีน" value={item.protein} color="#2F80ED" bg="#E8F1FF" />
        <Macro label="คาร์บ" value={item.carb} color="#E2B100" bg="#FFF4CC" />
        <Macro label="ไขมัน" value={item.fat} color="#FF6B6B" bg="#FFE3E3" />
      </View>

      {/* TIME */}
      {item.created_at && (
        <Text style={styles.timeText}>
          บันทึกเมื่อ: {new Date(item.created_at).toLocaleString()}
        </Text>
      )}

      {/* EDIT */}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() =>
          navigation.navigate("FoodEditDetail", {
            item: {
              ...item,
              calories: item.calories ?? item.kcal ?? 0,
            },
          })
        }
      >
        <Text style={styles.editText}>✏️ แก้ไขข้อมูล</Text>
      </TouchableOpacity>

      {/* DELETE */}
      <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
        <Text style={styles.deleteText}>🗑️ ลบรายการนี้</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ------------------ Macro Component ------------------
function Macro({ label, value, color, bg }) {
  return (
    <View style={[styles.macroBox, { backgroundColor: bg }]}>
      <Text style={[styles.macroLabel, { color }]}>{label}</Text>
      <Text style={[styles.macroValue, { color }]}>{value || 0} g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 22, paddingBottom: 60 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },

  imgCard: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 16,
    elevation: 3,
  },

  img: {
    width: "100%",
    height: 240,
    resizeMode: "cover",
  },

  noImg: {
    height: 240,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },

  name: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
    color: "#1F1F1F",
  },

  mealTag: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
  },

  kcalText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#2ECC71",
    marginBottom: 20,
  },

  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  macroBox: {
    width: "32%",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  macroLabel: { fontWeight: "700" },
  macroValue: { fontSize: 18, fontWeight: "800", marginTop: 4 },

  timeText: { color: "#777", marginBottom: 25 },

  editBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  editText: { color: "#fff", fontWeight: "700", fontSize: 17 },

  deleteBtn: {
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  deleteText: { color: "#fff", fontWeight: "700", fontSize: 17 },
});
