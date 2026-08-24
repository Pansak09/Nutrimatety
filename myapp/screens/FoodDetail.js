import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { API, API_BASE } from "../api";
import { SafeAreaView } from "react-native-safe-area-context";

// ===================== PALETTE (matches other screens) =====================
const COLORS = {
  bg: "#F6FAF8",
  card: "#FFFFFF",
  primaryDark: "#0F4C3A",
  primary: "#1B8A5A",
  primarySoft: "#E7F6EC",
  mint: "#2FBF87",
  gradientStart: "#1FAF7A",
  gradientEnd: "#0F4C3A",
  accentEnergy: "#FF7A59",
  accentProtein: "#3A7BFF",
  accentProteinSoft: "#E4EFFF",
  accentCarb: "#F5B942",
  accentCarbSoft: "#FFF6E0",
  accentFat: "#FF5FA2",
  accentFatSoft: "#FFE9F2",
  danger: "#B00020",
  dangerSoft: "#FDECEC",
  textMain: "#0F2E27",
  textSub: "#6C8079",
  textFaint: "#9FB1AA",
  border: "#EAF2ED",
};

export default function FoodDetail({ route, navigation }) {
  const { item } = route.params || {};

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="alert-circle-outline" size={28} color={COLORS.textFaint} />
          </View>
          <Text style={styles.emptyText}>ไม่พบข้อมูลอาหาร</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* IMAGE FIX */
  let imageUri = item.image_url || "";
  if (imageUri.startsWith("/")) {
    imageUri = `${API_BASE}${imageUri}`;
  }

  /* DELETE */
  const confirmDelete = () => {
    Alert.alert("ลบรายการ", "คุณต้องการลบหรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ลบ", style: "destructive", onPress: deleteItem },
    ]);
  };

  const deleteItem = async () => {
    try {
      await API.delete(`/meals/${item.id}`);

      Alert.alert(
        "สำเร็จ",
        "ลบข้อมูลเรียบร้อยแล้ว",
        [
          {
            text: "ตกลง",
            onPress: () => {
              navigation.goBack();
            },
          },
        ],
        { cancelable: false }
      );

    } catch (err) {
      Alert.alert(
        "ผิดพลาด",
        err.response?.data?.detail || err.message
      );
    }
  };

  const kcal = item.calories || item.kcal || 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>

        {/* IMAGE */}
        <View style={styles.imgCard}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.img} />
          ) : (
            <View style={styles.noImg}>
              <Ionicons name="image-outline" size={36} color={COLORS.textFaint} />
              <Text style={styles.noImgText}>ไม่มีภาพอาหาร</Text>
            </View>
          )}

          {/* Floating back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* kcal badge overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            style={styles.imgOverlay}
          >
            <View style={styles.kcalBadge}>
              <Ionicons name="flame" size={14} color={COLORS.accentEnergy} />
              <Text style={styles.kcalBadgeText}>{kcal} kcal</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Title card */}
        <View style={styles.titleCard}>
          <Text style={styles.name}>{item.name}</Text>

          <View style={styles.mealTag}>
            <Ionicons name="restaurant-outline" size={13} color={COLORS.primary} />
            <Text style={styles.mealTagText}>{item.meal_time || "-"}</Text>
          </View>

          {/* MACRO */}
          <View style={styles.macroRow}>
            <Macro
              icon="barbell-outline"
              label="โปรตีน"
              value={item.protein}
              color={COLORS.accentProtein}
              bg={COLORS.accentProteinSoft}
            />
            <Macro
              icon="restaurant-outline"
              label="คาร์บ"
              value={item.carb}
              color={COLORS.accentCarb}
              bg={COLORS.accentCarbSoft}
            />
            <Macro
              icon="water-outline"
              label="ไขมัน"
              value={item.fat}
              color={COLORS.accentFat}
              bg={COLORS.accentFatSoft}
            />
          </View>

          {/* TIME */}
          {item.created_at && (
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.textFaint} />
              <Text style={styles.timeText}>
                บันทึกเมื่อ {new Date(item.created_at).toLocaleString("th-TH")}
              </Text>
            </View>
          )}
        </View>

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
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.editBtnGradient}
          >
            <Ionicons name="create-outline" size={19} color="#fff" />
            <Text style={styles.editText}>แก้ไขข้อมูล</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* DELETE */}
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          <Text style={styles.deleteText}>ลบรายการนี้</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function Macro({ label, value, color, bg, icon }) {
  return (
    <View style={[styles.macroBox, { backgroundColor: bg }]}>
      <View style={[styles.macroIconWrap, { backgroundColor: "#fff" }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={[styles.macroValue, { color }]}>{value || 0}g</Text>
      <Text style={[styles.macroLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  wrap: { padding: 16, paddingBottom: 60 },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyText: { fontSize: 16, color: COLORS.textSub, fontWeight: "600" },

  /* Image */
  imgCard: {
    width: "100%",
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    marginBottom: 16,
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: Platform.OS === "android" ? 4 : 0,
  },

  img: {
    width: "100%",
    height: 280,
    resizeMode: "cover",
  },

  noImg: {
    height: 280,
    backgroundColor: COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  noImgText: {
    color: COLORS.textFaint,
    marginTop: 8,
    fontWeight: "600",
  },

  backBtn: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(15,44,35,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  imgOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 40,
  },
  kcalBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  kcalBadgeText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textMain,
  },

  /* Title card */
  titleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  name: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
    color: COLORS.textMain,
    letterSpacing: -0.3,
  },

  mealTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 18,
  },
  mealTagText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroBox: {
    width: "32%",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  macroIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  macroLabel: { fontWeight: "700", fontSize: 12, marginTop: 2 },
  macroValue: { fontSize: 16, fontWeight: "800" },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  timeText: {
    color: COLORS.textFaint,
    fontSize: 12.5,
    marginLeft: 5,
  },

  editBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  editBtnGradient: {
    flexDirection: "row",
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  editText: { color: "#fff", fontWeight: "800", fontSize: 16, marginLeft: 8 },

  deleteBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.dangerSoft,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { color: COLORS.danger, fontWeight: "800", fontSize: 15.5, marginLeft: 8 },
});