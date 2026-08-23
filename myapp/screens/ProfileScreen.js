import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, useWindowDimensions,
  Alert, Platform
} from "react-native";

import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { API } from "../api";

import { SafeAreaView } from "react-native-safe-area-context";

// ===================== PALETTE (matches HomeScreen) =====================
const COLORS = {
  bg: "#F6FAF8",
  card: "#FFFFFF",
  primaryDark: "#0F4C3A",
  primary: "#1B8A5A",
  primarySoft: "#E7F6EC",
  mint: "#2FBF87",
  gradientStart: "#1FAF7A",
  gradientEnd: "#0F4C3A",
  accentBlue: "#1565C0",
  accentBlueSoft: "#E3F2FD",
  danger: "#B00020",
  dangerSoft: "#FDECEC",
  textMain: "#0F2E27",
  textSub: "#6C8079",
  textFaint: "#9FB1AA",
  border: "#EAF2ED",
  overlay: "rgba(9,28,22,0.55)",
};

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

  /* ---------------- Delete Account ---------------- */
  const deleteAccount = () => {
    Alert.alert(
      "ยืนยันลบบัญชี",
      "การลบบัญชีจะลบข้อมูลผู้ใช้และโปรไฟล์ของคุณถาวร คุณแน่ใจหรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบบัญชี",
          style: "destructive",
          onPress: async () => {
            try {
              // เรียก API ลบบัญชี
              await API.delete("/profiles/me");

              // ล้าง token แล้วกลับหน้า Auth
              await AsyncStorage.removeItem("access_token");
              navigation.reset({ index: 0, routes: [{ name: "Auth" }] });
            } catch (e) {
              const detail = e.response?.data?.detail;
              Alert.alert("ลบบัญชีไม่สำเร็จ", detail || e.message || "เกิดข้อผิดพลาด");
            }
          },
        },
      ]
    );
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

  const LIFESTYLE_LABEL = {
    sedentary: "ไม่ค่อยออกกำลังกาย",
    light: "ออกกำลังกายเล็กน้อย",
    moderate: "ออกกำลังกายปานกลาง",
    active: "ออกกำลังกายหนัก",
    athlete: "นักกีฬา / ออกกำลังกายหนักมาก",
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

  const calcBMI = (w, h) =>
    !w || !h ? "-" : (w / ((h / 100) ** 2)).toFixed(1);

  const calcBMR = (gender, w, h, age) => {
    if (!w || !h || !age) return "-";
    const base = 10 * w + 6.25 * h - 5 * age;
    return gender === "male" ? Math.round(base + 5) : Math.round(base - 161);
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

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <SafeAreaView style={styles.safeLoading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </SafeAreaView>
    );
  }

  /* ---------------- Error ---------------- */
  if (err) {
    return (
      <SafeAreaView style={styles.safeError}>
        <View style={styles.errorIconWrap}>
          <Ionicons name="alert-circle-outline" size={30} color={COLORS.danger} />
        </View>
        <Text style={styles.errorText}>{err}</Text>

        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()} activeOpacity={0.85}>
          <Ionicons name="refresh" size={17} color="#fff" />
          <Text style={styles.retryText}>ลองใหม่</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /* ---------------- Avatar & Calculations ---------------- */
  const avatarUri = buildURL(profile?.avatar_url);
  const age = calcAge(profile?.date_of_birth);
  const bmi = calcBMI(profile?.current_weight, profile?.height);
  const bmr = calcBMR(profile?.gender, profile?.current_weight, profile?.height, age);
  const tdee = calcTDEE(bmr, profile?.lifestyle || "light");

  const proteinTarget = profile?.protein_target ?? Math.round(tdee * 0.30 / 4);
  const carbTarget    = profile?.carb_target ?? Math.round(tdee * 0.40 / 4);
  const fatTarget     = profile?.fat_target ?? Math.round(tdee * 0.30 / 9);

  /* =====================================================
     MAIN UI
     ===================================================== */
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ================= Header (gradient band) ================= */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBand}
        >
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>โปรไฟล์ของฉัน</Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate("EditProfile")}
              activeOpacity={0.85}
            >
              <Ionicons name="pencil" size={14} color={COLORS.primaryDark} />
              <Text style={styles.editText}>แก้ไข</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.headerRow}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={[
                    styles.avatar,
                    { width: width * 0.24, height: width * 0.24, borderRadius: width * 0.12 }
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { width: width * 0.24, height: width * 0.24, borderRadius: width * 0.12 }
                  ]}
                >
                  <Ionicons name="person" size={width * 0.1} color={COLORS.textFaint} />
                </View>
              )}

              <View style={styles.headerTextBox}>
                <Text style={[styles.name, { fontSize: width * 0.052 }]} numberOfLines={1}>
                  {profile?.username || "-"}
                </Text>

                <Text style={[styles.email, { fontSize: width * 0.034 }]} numberOfLines={1}>
                  {user?.email || "-"}
                </Text>
              </View>
            </View>

            <View style={styles.chipRow}>
              <View style={styles.goalChip}>
                <Ionicons name="flag" size={12} color={COLORS.primary} />
                <Text style={styles.goalChipText}>{profile?.goal || "-"}</Text>
              </View>

              <View style={[styles.goalChip, { backgroundColor: COLORS.accentBlueSoft }]}>
                <Ionicons name="barbell" size={12} color={COLORS.accentBlue} />
                <Text style={[styles.goalChipText, { color: COLORS.accentBlue }]}>
                  {LIFESTYLE_LABEL[profile?.lifestyle] || "-"}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ================= General Info ================= */}
        <View style={styles.infoCard}>
          <View style={styles.infoTitleRow}>
            <View style={styles.infoTitleIconWrap}>
              <Ionicons name="person-outline" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>ข้อมูลทั่วไป</Text>
          </View>
          <InfoRow label="น้ำหนักปัจจุบัน" value={`${profile?.current_weight ?? "-"} kg`} />
          <InfoRow label="ส่วนสูง" value={`${profile?.height ?? "-"} cm`} />
          <InfoRow label="เพศ" value={profile?.gender || "-"} />
          <InfoRow label="วันเกิด" value={formatDate(profile?.date_of_birth)} />
          <InfoRow label="อายุ" value={`${age} ปี`} />
          <InfoRow label="อาหารที่แพ้" value={profile?.food_allergies || "-"} last />
        </View>

        {/* ================= Health Calculation ================= */}
        <View style={styles.infoCard}>
          <View style={styles.infoTitleRow}>
            <View style={styles.infoTitleIconWrap}>
              <Ionicons name="body-outline" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>ค่าทางโภชนาการ</Text>
          </View>
          <InfoRow label="BMI" value={bmi} />
          <InfoRow label="BMR" value={`${bmr} kcal`} />
          <InfoRow label="TDEE" value={`${tdee} kcal`} last />
        </View>

        {/* ================= Daily Macro Target ================= */}
        <View style={styles.infoCard}>
          <View style={styles.infoTitleRow}>
            <View style={styles.infoTitleIconWrap}>
              <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>โภชนาการที่ควรได้รับต่อวัน</Text>
          </View>
          <InfoRow label="พลังงานรวม" value={`${tdee} kcal`} />
          <InfoRow label="โปรตีน" value={`${proteinTarget} g`} />
          <InfoRow label="คาร์โบไฮเดรต" value={`${carbTarget} g`} />
          <InfoRow label="ไขมัน" value={`${fatTarget} g`} last />
        </View>

        {/* ================= Logout / Delete ================= */}
        <View style={styles.actionsWrap}>
          <TouchableOpacity style={styles.logoutBtnBottom} onPress={logout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.primary} />
            <Text style={styles.logoutBottomText}>ออกจากระบบ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtnBottom} onPress={deleteAccount} activeOpacity={0.85}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text style={styles.deleteBottomText}>ลบบัญชี</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Row Component ---------- */
function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/* ===========================================================
   🎨 UI STYLES (Modern Health App)
   =========================================================== */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  safeLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSub,
    fontWeight: "600",
    fontSize: 14,
  },

  safeError: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: COLORS.bg,
  },

  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  errorText: {
    color: COLORS.textMain,
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 22,
  },

  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 16,
    marginBottom: 10,
  },
  retryText: {
    color: "#fff", fontWeight: "700", fontSize: 15, marginLeft: 6,
  },

  logoutBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  logoutText: { color: COLORS.textSub, fontWeight: "700", fontSize: 15 },

  /* Header / gradient band */
  headerBand: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 22,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  editText: {
    marginLeft: 5,
    color: COLORS.primaryDark,
    fontWeight: "700",
    fontSize: 13,
  },

  profileCard: {
    backgroundColor: COLORS.card,
    padding: 18,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.12 : 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarPlaceholder: {
    backgroundColor: COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTextBox: { flex: 1, marginLeft: 14 },

  name: { fontWeight: "800", color: COLORS.textMain, letterSpacing: -0.2 },
  email: { color: COLORS.textSub, marginTop: 3, fontWeight: "500" },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
  },
  goalChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primarySoft,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 6,
  },
  goalChipText: {
    marginLeft: 5,
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 12.5,
  },

  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    marginHorizontal: 14,
    marginTop: 16,
    shadowColor: "#0F4C3A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  infoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoTitleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  rowLabel: { color: COLORS.textSub, fontWeight: "500", fontSize: 14 },
  rowValue: { fontWeight: "800", color: COLORS.textMain, fontSize: 15 },

  actionsWrap: {
    marginHorizontal: 14,
    marginTop: 22,
  },

  logoutBtnBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },

  logoutBottomText: {
    color: COLORS.primary,
    fontWeight: "800",
    textAlign: "center",
    fontSize: 15.5,
    marginLeft: 8,
  },

  deleteBtnBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.dangerSoft,
    paddingVertical: 15,
    borderRadius: 18,
    marginTop: 12,
    marginBottom: 10,
  },

  deleteBottomText: {
    color: COLORS.danger,
    fontWeight: "800",
    textAlign: "center",
    fontSize: 15.5,
    marginLeft: 8,
  },

});