// HistoryScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API } from "../api";

const API_BASE = "http://172.20.10.5:8000"; 

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
      };
    });

    setDays(list);
  };

  // ===============================
  // UI
  // ===============================
  return (
    <View style={styles.container}>
      <Text style={styles.header}>ประวัติย้อนหลัง</Text>

      {loading ? (
        <Text style={styles.loading}>กำลังโหลดข้อมูล...</Text>
      ) : days.length === 0 ? (
        <Text style={styles.empty}>ยังไม่มีข้อมูลอาหาร</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {days.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() =>
                navigation.navigate("HistoryDetail", {
                  date: item.dateISO,
                })
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.date}>{item.dateLabel}</Text>
                <Text style={styles.kcal}>กดเพื่อดูรายละเอียด</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#555" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ===============================
// Styles
// ===============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8FBEA",
    paddingTop: 50,
    paddingHorizontal: 18,
  },

  header: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 14,
    color: "#2c3e50",
  },

  loading: {
    marginTop: 40,
    textAlign: "center",
    color: "#555",
  },

  empty: {
    marginTop: 40,
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
  },

  scroll: {
    paddingBottom: 50,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },

  date: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  kcal: {
    marginTop: 4,
    color: "#27ae60",
    fontWeight: "600",
  },
});
