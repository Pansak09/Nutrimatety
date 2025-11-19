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

export default function HistoryDetail({ route, navigation }) {
  const date = route.params?.date;
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      const res = await API.get("/meals", { params: { date } });

      const list = res.data.map((i) => ({
        id: i.id,
        name: i.name,
        meal_time: i.meal_time,
        kcal: i.calories,
        protein: i.protein,
        carb: i.carb,
        fat: i.fat,
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

  const totalKcal = meals.reduce((sum, m) => sum + (m.kcal || 0), 0);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>รายละเอียดวันที่ {date}</Text>
      <Text style={styles.total}>พลังงานรวม {totalKcal} kcal</Text>

      <FlatList
        data={meals}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("FoodDetail", { item })}
          >
            {/* image */}
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.img} />
            ) : (
              <View style={[styles.img, { backgroundColor: "#ccc" }]} />
            )}

            <View style={{ paddingLeft: 10, flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meal}>{item.meal_time}</Text>
              <Text style={styles.kcal}>{item.kcal} kcal</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#E8FBEA" },

  header: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },

  total: {
    fontSize: 18,
    fontWeight: "700",
    color: "#27ae60",
    marginBottom: 16,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
  },

  img: { width: 80, height: 80, borderRadius: 10 },
  name: { fontSize: 18, fontWeight: "700" },
  meal: { fontSize: 14, color: "#555" },
  kcal: { fontSize: 16, fontWeight: "700", marginTop: 4 },
});
