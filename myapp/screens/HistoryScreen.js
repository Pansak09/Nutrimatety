// HistoryScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { API } from "../api";

const API_BASE = "http://172.20.10.5:8000";

// ===================== PALETTE (matches Home / Profile / EditProfile) =====================
const COLORS = {
  bg: "#F6FAF8",
  card: "#FFFFFF",
  primaryDark: "#0F4C3A",
  primary: "#1B8A5A",
  primarySoft: "#E7F6EC",
  mint: "#2FBF87",
  gradientStart: "#1FAF7A",
  gradientEnd: "#0F4C3A",
  textMain: "#0F2E27",
  textSub: "#6C8079",
  textFaint: "#9FB1AA",
  border: "#EAF2ED",
};

export default function HistoryScreen({ navigation }) {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMealDates();
  }, []);

  // ===============================
  // ดึงวันที่ที่มี meal จริงจาก backend
  // ===============================
  const fetchMealDates = async () => {
    try {
      setLoading(true); // เริ่มโหลด
      const { data } = await API.get("/meals/dates");
      generateFromBackendDates(data);
    } catch (err) {
      console.log(
        "โหลดวันที่ไม่สำเร็จ:",
        err?.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // แปลงวันที่จาก backend → ใช้แสดงผล
  // ===============================
  const generateFromBackendDates = (dateList) => {
    const list = dateList.map((iso, index) => {
      const d = new Date(iso);

      return {
        id: index + 1,
        dateISO: iso,
        dateLabel: d.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        weekdayLabel: d.toLocaleDateString("th-TH", { weekday: "long" }),
      };
    });

    setDays(list);
  };

  // ===============================
  // UI
  // ===============================
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header (gradient band) */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBand}
      >
        <View style={styles.headerIconWrap}>
          <Ionicons name="time-outline" size={20} color="#fff" />
        </View>
        <View>
          <Text style={styles.headerTitle}>ประวัติย้อนหลัง</Text>
          <Text style={styles.headerSub}>
            {days.length > 0 ? `${days.length} วันที่มีการบันทึก` : "บันทึกการกินของคุณ"}
          </Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      ) : days.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="calendar-outline" size={30} color={COLORS.textFaint} />
          </View>
          <Text style={styles.emptyTitle}>ยังไม่มีข้อมูลอาหาร</Text>
          <Text style={styles.emptyText}>
            เริ่มบันทึกมื้ออาหารเพื่อดูประวัติย้อนหลังที่นี่
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {days.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() =>
                navigation.navigate("HistoryDetail", {
                  date: item.dateISO,
                })
              }
              activeOpacity={0.85}
            >
              <View style={styles.dateIconWrap}>
                <Ionicons name="restaurant-outline" size={20} color={COLORS.primary} />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.date}>{item.dateLabel}</Text>
                <Text style={styles.weekday}>{item.weekdayLabel}</Text>
              </View>

              <View style={styles.chevronCircle}>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ===============================
// Styles
// ===============================
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  /* Header */
  headerBand: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 22,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 12.5,
    color: "rgba(255,255,255,0.75)",
    marginTop: 3,
  },

  /* Loading / Empty */
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSub,
    fontWeight: "600",
    fontSize: 14,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textMain,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13.5,
    color: COLORS.textSub,
    textAlign: "center",
    lineHeight: 20,
  },

  /* List */
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 50,
  },

  card: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: Platform.OS === "android" ? 2 : 0,
  },

  dateIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  date: {
    fontSize: 15.5,
    fontWeight: "800",
    color: COLORS.textMain,
  },

  weekday: {
    marginTop: 3,
    fontSize: 12.5,
    color: COLORS.textSub,
    fontWeight: "600",
  },

  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
});