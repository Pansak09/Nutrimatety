// HistoryDetail.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { API, API_BASE } from "../api";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

// ===================== PALETTE (matches Home / Profile / History) =====================
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
  accentCarb: "#F5B942",
  accentFat: "#FF5FA2",
  textMain: "#0F2E27",
  textSub: "#6C8079",
  textFaint: "#9FB1AA",
  border: "#EAF2ED",
};

const formatDateLabel = (iso) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export default function HistoryDetail({ route, navigation }) {
  const date = route.params?.date;
  const [meals, setMeals] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, [date])
  );

  const loadMeals = async () => {
    try {
      const res = await API.get("/meals", { params: { date } });

      const list = res.data.map((i) => ({
        id: i.id,
        name: i.name,
        meal_time: i.meal_time,
        kcal: Number(i.calories),
        protein: Number(i.protein),
        carb: Number(i.carb),
        fat: Number(i.fat),
        image_url: i.image_url
          ? i.image_url.startsWith("/")
            ? `${API_BASE}${i.image_url}`
            : i.image_url
          : null,
      }));

      setMeals(list);
    } catch (err) {
      console.log("ERR =>", err.message);
    }
  };

  /* === Summary Nutrition === */
  const totalKcal = meals.reduce((s, m) => s + (m.kcal || 0), 0);
  const totalProtein = meals.reduce((s, m) => s + (m.protein || 0), 0);
  const totalCarb = meals.reduce((s, m) => s + (m.carb || 0), 0);
  const totalFat = meals.reduce((s, m) => s + (m.fat || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header (gradient band) */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBand}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerEyebrow}>สรุปย้อนหลัง</Text>
          <View style={{ width: 38 }} />
        </View>
        <Text style={styles.headerDate}>{formatDateLabel(date)}</Text>

        {/* Summary card floats on the gradient */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.summaryKcal}>{Math.round(totalKcal)}</Text>
              <Text style={styles.summaryKcalUnit}>kcal รวมทั้งวัน</Text>
            </View>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="flame" size={20} color={COLORS.accentEnergy} />
            </View>
          </View>

          <View style={styles.macroRow}>
            <MacroPill
              icon="barbell-outline"
              color={COLORS.accentProtein}
              label="โปรตีน"
              value={totalProtein}
            />
            <MacroPill
              icon="restaurant-outline"
              color={COLORS.accentCarb}
              label="คาร์บ"
              value={totalCarb}
            />
            <MacroPill
              icon="water-outline"
              color={COLORS.accentFat}
              label="ไขมัน"
              value={totalFat}
            />
          </View>
        </View>
      </LinearGradient>

      {/* FOOD LIST */}
      <View style={styles.listHeaderRow}>
        <Ionicons name="fast-food-outline" size={16} color={COLORS.primary} />
        <Text style={styles.listHeader}>
          รายการอาหารทั้งหมด{meals.length > 0 ? ` (${meals.length})` : ""}
        </Text>
      </View>

      <FlatList
        data={meals}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="restaurant-outline" size={26} color={COLORS.textFaint} />
            </View>
            <Text style={styles.emptyText}>ไม่มีรายการอาหารในวันนี้</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("FoodDetail", { item })}
            activeOpacity={0.85}
          >
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.img} />
            ) : (
              <View style={[styles.img, styles.imgPlaceholder]}>
                <Ionicons name="image-outline" size={22} color={COLORS.textFaint} />
              </View>
            )}

            <View style={{ paddingLeft: 12, flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>

              <View style={styles.mealChip}>
                <Text style={styles.mealChipText}>{item.meal_time}</Text>
              </View>

              <View style={styles.kcalRow}>
                <Ionicons name="flame" size={13} color={COLORS.accentEnergy} />
                <Text style={styles.kcal}>{item.kcal} kcal</Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color={COLORS.textFaint} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

/* ---------------------- Macro Pill ---------------------- */
function MacroPill({ icon, color, label, value }) {
  return (
    <View style={styles.macroPill}>
      <View style={[styles.macroPillIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={styles.macroPillValue}>{Math.round(value)}g</Text>
      <Text style={styles.macroPillLabel}>{label}</Text>
    </View>
  );
}

/* ======================= STYLE ======================= */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  /* Header */
  headerBand: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 22,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerEyebrow: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.3,
  },
  headerDate: {
    fontSize: 19,
    fontWeight: "800",
    color: "#fff",
    marginTop: 8,
    marginBottom: 16,
  },

  /* Summary card floating on gradient */
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.12 : 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  summaryKcal: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  summaryKcalUnit: {
    fontSize: 12.5,
    color: COLORS.textSub,
    fontWeight: "600",
    marginTop: -2,
  },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF1EC",
    alignItems: "center",
    justifyContent: "center",
  },

  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroPill: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    paddingVertical: 10,
    marginHorizontal: 3,
  },
  macroPillIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  macroPillValue: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textMain,
  },
  macroPillLabel: {
    fontSize: 11,
    color: COLORS.textSub,
    fontWeight: "600",
    marginTop: 1,
  },

  /* List header */
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  listHeader: {
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 8,
    color: COLORS.primaryDark,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  emptyBox: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13.5,
    color: COLORS.textSub,
    fontWeight: "600",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: Platform.OS === "android" ? 2 : 0,
  },

  img: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  imgPlaceholder: {
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  name: {
    fontSize: 15.5,
    fontWeight: "800",
    color: COLORS.textMain,
  },

  mealChip: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 5,
  },
  mealChipText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: COLORS.primary,
  },

  kcalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  kcal: {
    fontSize: 13.5,
    fontWeight: "800",
    color: COLORS.textMain,
    marginLeft: 4,
  },
});