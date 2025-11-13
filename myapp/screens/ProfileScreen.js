import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, useWindowDimensions
} from "react-native";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../api";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // โหลด token
  const loadTokenIfNeeded = useCallback(async () => {
    if (!token) {
      const t = await AsyncStorage.getItem("access_token");
      if (t) setToken(t);
    }
  }, [token]);

  // โหลดข้อมูลจาก backend
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [{ data: userRes }, { data: profRes }] = await Promise.all([
        API.get("/users/me"),
        API.get("/profiles/me"),
      ]);
      setUser(userRes);
      setProfile(profRes);
    } catch (e) {
      const status = e.response?.status;
      const detail = e.response?.data?.detail;
      if (status === 404 && detail === "Profile not found") {
        setErr("ยังไม่มีโปรไฟล์ โปรดสร้างโปรไฟล์ก่อน");
      } else if (status === 401) {
        setErr("ยังไม่ได้เข้าสู่ระบบหรือ token หมดอายุ");
      } else {
        setErr(detail || e.message || "โหลดข้อมูลไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTokenIfNeeded(); }, [loadTokenIfNeeded]);
  useEffect(() => { if (token) fetchData(); }, [token, fetchData]);

  // ✅ ถ้า refreshProfile = true ให้โหลดใหม่
  useFocusEffect(
    useCallback(() => {
      if (token) fetchData();
    }, [token, fetchData])
  );
  useEffect(() => {
    if (route.params?.refreshProfile) {
      fetchData();
      navigation.setParams({ refreshProfile: false }); // reset flag
    }
  }, [route.params?.refreshProfile, fetchData, navigation]);

  const logout = async () => {
    try { await AsyncStorage.removeItem("access_token"); } catch {}
    navigation.reset({ index: 0, routes: [{ name: "Auth" }] });
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${d.getFullYear()}`;
    } catch {
      return String(iso);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  if (err) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", padding: 16 }]}>
        <Text style={{ color: "#d00", marginBottom: 12, textAlign: "center" }}>{err}</Text>
        <TouchableOpacity
          style={[styles.button, { width: width * 0.8 }]}
          onPress={() => (token ? fetchData() : loadTokenIfNeeded())}
        >
          <Text style={styles.buttonText}>ลองใหม่</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { width: width * 0.8, backgroundColor: "#FF4444" }]}
          onPress={logout}
        >
          <Text style={styles.buttonText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const buildURL = (u) => (!u ? null : u.startsWith("/uploads") ? `${API.defaults.baseURL}${u}` : u);
  const avatarUri = buildURL(profile?.avatar_url || null);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={[
                  styles.avatar,
                  { width: width * 0.28, height: width * 0.28, borderRadius: width * 0.14 },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { width: width * 0.28, height: width * 0.28, borderRadius: width * 0.14 },
                ]}
              />
            )}
            <View style={styles.headerText}>
              <Text style={[styles.name, { fontSize: width * 0.055 }]}>{profile?.username || "-"}</Text>
              <Text style={[styles.email, { fontSize: width * 0.04 }]}>{user?.email || "-"}</Text>
              {/* ✅ แสดงเป้าหมายสุขภาพ */}
              <Text style={[styles.goalText, { fontSize: width * 0.04 }]}>
                🎯 เป้าหมาย: {profile?.goal || "-"}
              </Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("EditProfile")}>
              <Text style={styles.editText}>แก้ไข</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Table */}
        <View style={styles.card}>
          {[
            ["เป้าหมายน้ำหนัก", `${profile?.target_weight ?? "-"} Kg`],
            ["น้ำหนักปัจจุบัน", `${profile?.current_weight ?? "-"} Kg`],
            ["ส่วนสูง", `${profile?.height ?? "-"} CM`],
            ["เพศ", profile?.gender || "-"],
            ["วันเกิด", formatDate(profile?.date_of_birth)],
            [
              "อายุ",
              profile?.date_of_birth
                ? Math.max(0, new Date(Date.now() - new Date(profile.date_of_birth)).getUTCFullYear() - 1970) + " ปี"
                : "-",
            ],
            ["อาหารที่แพ้", profile?.food_allergies || "-"],
            ["เป้าหมายแคลอรี่", `${profile?.target_calories ?? "-"} Kcal`],
          ].map(([label, value], idx) => (
            <View style={styles.row} key={idx}>
              <Text style={[styles.label, { fontSize: width * 0.04 }]}>{label}</Text>
              <Text style={[styles.value, { fontSize: width * 0.045 }]}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <TouchableOpacity style={[styles.button, { width: width * 0.9 }]} onPress={logout}>
          <Text style={styles.buttonText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#B7FFC7" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  avatar: { backgroundColor: "#eee" },
  avatarPlaceholder: { backgroundColor: "#ccc" },
  headerText: { flex: 1, marginLeft: 12 },
  name: { fontWeight: "bold" },
  email: { color: "#555" },
  goalText: { marginTop: 4, color: "#1C7C54", fontWeight: "600" }, // ✅ เป้าหมายสุขภาพ
  editBtn: { backgroundColor: "#3366FF", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  editText: { color: "#fff" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  label: { color: "#333" },
  value: { fontWeight: "bold" },
  button: {
    backgroundColor: "#3366FF",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
