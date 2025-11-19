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

  /* ---------------- Load token ---------------- */
  const loadTokenIfNeeded = useCallback(async () => {
    if (!token) {
      const t = await AsyncStorage.getItem("access_token");
      if (t) setToken(t);
    }
  }, [token]);

  /* ---------------- Load backend ---------------- */
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
        setErr("Token หมดอายุ โปรดเข้าสู่ระบบใหม่");
      } else {
        setErr(detail || e.message || "โหลดข้อมูลไม่สำเร็จ");
      }

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTokenIfNeeded(); }, [loadTokenIfNeeded]);
  useEffect(() => { if (token) fetchData(); }, [token, fetchData]);

  useFocusEffect(
    useCallback(() => { if (token) fetchData(); }, [token, fetchData])
  );

  useEffect(() => {
    if (route.params?.refreshProfile) {
      fetchData();
      navigation.setParams({ refreshProfile: false });
    }
  }, [route.params?.refreshProfile]);

  /* ---------------- Logout ---------------- */
  const logout = async () => {
    await AsyncStorage.removeItem("access_token");
    navigation.reset({ index: 0, routes: [{ name: "Auth" }] });
  };

  /* ---------------- Helper Functions ---------------- */
  const buildURL = (u) =>
    !u ? null : u.startsWith("/uploads") ? `${API.defaults.baseURL}${u}` : u;

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return `${d.getDate().toString().padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
    } catch {
      return iso;
    }
  };

  const calcAge = (dob) => {
    if (!dob) return "-";
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const calcBMI = (w, h) => (!w || !h ? "-" : (w / ((h / 100) ** 2)).toFixed(1));

  const calcBMR = (gender, w, h, age) => {
    if (!w || !h || !age) return "-";
    const base = 10 * w + 6.25 * h - 5 * age;
    if (gender === "male") return Math.round(base + 5);
    return Math.round(base - 161);
  };

  const calcTDEE = (bmr, lifestyle) => {
    if (!bmr) return "-";
    const factor = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      athlete: 1.9,
    }[lifestyle] || 1.2;
    return Math.round(bmr * factor);
  };

  /* ---------------- If loading ---------------- */
  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#1B7F5A" />
        <Text style={{ marginTop: 12, color: "#1B7F5A" }}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  /* ---------------- Error ---------------- */
  if (err) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>{err}</Text>

        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
          <Text style={styles.retryText}>🔄 ลองใหม่</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ---------------- Avatar ---------------- */
  const avatarUri = buildURL(profile?.avatar_url);

  /* ---------------- Calculate ---------------- */
  const age = calcAge(profile?.date_of_birth);
  const bmi = calcBMI(profile?.current_weight, profile?.height);
  const bmr = calcBMR(profile?.gender, profile?.current_weight, profile?.height, age);
  const tdee = calcTDEE(bmr, profile?.lifestyle || "light");

  /* Macro Targets (ถ้า backend ไม่ส่งมาก็ใช้สูตร fallback) */
  const proteinTarget = profile?.protein_target ?? Math.round(tdee * 0.30 / 4);
  const carbTarget    = profile?.carb_target ?? Math.round(tdee * 0.40 / 4);
  const fatTarget     = profile?.fat_target ?? Math.round(tdee * 0.30 / 9);

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

        {/* ================= Header ================= */}
        <View style={styles.profileCard}>

          <View style={styles.headerRow}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={[
                  styles.avatar,
                  { width: width * 0.27, height: width * 0.27, borderRadius: width * 0.14 }
                ]}
              />
            ) : (
              <View style={[
                styles.avatarPlaceholder,
                { width: width * 0.27, height: width * 0.27 }
              ]}>
                <Text style={styles.avatarPlaceholderText}>No Image</Text>
              </View>
            )}

            <View style={styles.headerTextBox}>
              <Text style={[styles.name, { fontSize: width * 0.058 }]}>
                {profile?.username || "-"}
              </Text>

              <Text style={[styles.email, { fontSize: width * 0.04 }]}>
                {user?.email || "-"}
              </Text>

              <Text style={styles.goalChip}>
                🎯 เป้าหมาย: {profile?.goal || "-"}
              </Text>

              <Text style={styles.goalChip}>
                🏋🏻‍♂ Lifestyle: {profile?.lifestyle || "light"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Text style={styles.editText}>แก้ไข</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= General Info ================= */}
        <View style={styles.infoCard}>
          <InfoRow label="น้ำหนักปัจจุบัน" value={`${profile?.current_weight ?? "-"} kg`} />
          <InfoRow label="น้ำหนักเป้าหมาย" value={`${profile?.target_weight ?? "-"} kg`} />
          <InfoRow label="ส่วนสูง" value={`${profile?.height ?? "-"} cm`} />
          <InfoRow label="เพศ" value={profile?.gender || "-"} />
          <InfoRow label="วันเกิด" value={formatDate(profile?.date_of_birth)} />
          <InfoRow label="อายุ" value={`${age} ปี`} />
          <InfoRow label="อาหารที่แพ้" value={profile?.food_allergies || "-"} />
        </View>

        {/* ================= Health Calculation ================= */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>ค่าทางโภชนาการ</Text>
          <InfoRow label="BMI" value={bmi} />
          <InfoRow label="BMR" value={`${bmr} kcal`} />
          <InfoRow label="TDEE" value={`${tdee} kcal`} />
        </View>

        {/* ================= Daily Macro Target ================= */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>โภชนาการที่ควรได้รับต่อวัน</Text>
          <InfoRow label="พลังงานรวม" value={`${tdee} kcal`} />
          <InfoRow label="โปรตีน" value={`${proteinTarget} g`} />
          <InfoRow label="คาร์โบไฮเดรต" value={`${carbTarget} g`} />
          <InfoRow label="ไขมัน" value={`${fatTarget} g`} />
        </View>

        {/* ================= Logout ================= */}
        <TouchableOpacity style={styles.logoutBtnBottom} onPress={logout}>
          <Text style={styles.logoutBottomText}>ออกจากระบบ</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

/* ---------- Row Component ---------- */
function InfoRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/* ===========================================================
   🎨 UI STYLES (Premium Health App)
   =========================================================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#C9FFE2" },

  loadingBox: {
    flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#C9FFE2"
  },

  errorBox: {
    flex: 1, justifyContent: "center", alignItems: "center", padding: 30, backgroundColor: "#C9FFE2"
  },

  errorText: {
    color: "#d33", fontSize: 18, marginBottom: 16, textAlign: "center", fontWeight: "600"
  },

  retryBtn: {
    backgroundColor: "#1B7F5A", paddingVertical: 12, paddingHorizontal: 30,
    borderRadius: 14, marginBottom: 10
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  logoutBtn: {
    backgroundColor: "#FF5555", paddingVertical: 12,
    paddingHorizontal: 30, borderRadius: 14
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  profileCard: {
    backgroundColor: "#FFFFFF", padding: 20, borderRadius: 22,
    marginBottom: 18, shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 8, elevation: 3
  },

  headerRow: { flexDirection: "row", alignItems: "center" },

  avatarPlaceholder: {
    backgroundColor: "#E0E0E0", justifyContent: "center",
    alignItems: "center", borderRadius: 100
  },

  avatarPlaceholderText: { color: "#666" },

  headerTextBox: { flex: 1, marginLeft: 14 },

  name: { fontWeight: "800", color: "#1A4D3E" },
  email: { color: "#555", marginTop: 4 },

  goalChip: {
    marginTop: 6, backgroundColor: "#E4FFE6",
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 12, color: "#1B7F5A", fontWeight: "700"
  },

  editBtn: {
    backgroundColor: "#1B7F5A", paddingVertical: 6,
    paddingHorizontal: 16, borderRadius: 10
  },
  editText: { color: "#fff", fontWeight: "700" },

  infoCard: {
    backgroundColor: "#FFFFFF", borderRadius: 22,
    padding: 20, marginBottom: 20, elevation: 3
  },

  sectionTitle: {
    fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#333"
  },

  row: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#EEE"
  },

  rowLabel: { color: "#333", fontWeight: "600" },
  rowValue: { fontWeight: "700", color: "#1A4D3E" },

  logoutBtnBottom: {
    backgroundColor: "#FF6464", paddingVertical: 16,
    borderRadius: 14, marginTop: 22
  },

  logoutBottomText: {
    color: "#fff", fontWeight: "800",
    textAlign: "center", fontSize: 17
  },
});
