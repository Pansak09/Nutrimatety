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

export default function HistoryScreen({ navigation }) {
  const [days, setDays] = useState([]);

  useEffect(() => {
    generateHistoryDates();
  }, []);

  // สร้างรายชื่อวันที่ย้อนหลัง 14 วัน
  const generateHistoryDates = () => {
    const list = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      const iso = d.toISOString().split("T")[0];

      const thaiDate = d.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      list.push({
        id: i + 1,
        dateLabel: thaiDate,
        dateISO: iso,
      });
    }

    setDays(list);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>ประวัติย้อนหลัง</Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        {days.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate("HistoryDetail", { date: item.dateISO })
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
    </View>
  );
}

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

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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
