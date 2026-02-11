// HistoryDetail.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { API, API_BASE } from "../api";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

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
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>สรุปวันที่ {date}</Text>

        {/* SUMMARY */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>สรุปโภชนาการรวม</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.label}>พลังงานรวม</Text>
            <Text style={styles.value}>{totalKcal} kcal</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.label}>โปรตีน</Text>
            <Text style={styles.value}>{totalProtein} g</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.label}>คาร์โบไฮเดรต</Text>
            <Text style={styles.value}>{totalCarb} g</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.label}>ไขมัน</Text>
            <Text style={styles.value}>{totalFat} g</Text>
          </View>
        </View>

        {/* FOOD LIST */}
        <Text style={styles.listHeader}>รายการอาหารทั้งหมด</Text>

        <FlatList
          data={meals}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("FoodDetail", { item })}
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.img} />
              ) : (
                <View style={[styles.img, { backgroundColor: "#ccc" }]} />
              )}

              <View style={{ paddingLeft: 12, flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meal}>{item.meal_time}</Text>
                <Text style={styles.kcal}>{item.kcal} kcal</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

/* ======================= STYLE ======================= */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#E8FBEA",
  },

  container: {
    flex: 1,
    padding: 16,
  },

  header: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
    color: "#1D4D4F",
  },

  summaryCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    marginBottom: 18,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    color: "#27ae60",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  label: {
    fontSize: 15,
    color: "#444",
  },

  value: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D4D4F",
  },

  listHeader: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
    color: "#1D4D4F",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
  },

  img: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },

  meal: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },

  kcal: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 6,
    color: "#27ae60",
  },
});
