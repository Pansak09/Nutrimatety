// api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* -----------------------------
   CONFIG: IP ของ Backend FastAPI
   ----------------------------- */
// ใส่ IPv4 ของเครื่อง Windows
const WINDOWS_IP = '172.20.10.3'; // <--- แก้ให้ตรงกับเครื่องของคุณ

export const API_BASE = `http://${WINDOWS_IP}:8000`;
console.log('API_BASE =', API_BASE);

/* -----------------------------
   สร้าง instance axios
   ----------------------------- */
export const API = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

/* -----------------------------
   Token Helpers
   ----------------------------- */
export async function setToken(token) {
  await AsyncStorage.setItem("access_token", token);
}
export async function clearToken() {
  await AsyncStorage.removeItem("access_token");
}
export async function getToken() {
  return AsyncStorage.getItem("access_token");
}

/* -----------------------------
   Interceptors: แนบ Token ทุก request
   ----------------------------- */
API.interceptors.request.use(async (config) => {
  const t = await AsyncStorage.getItem("access_token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

/* -----------------------------
   Interceptors: ถ้า token หมดอายุ → ลบออก
   ----------------------------- */
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err?.response?.status === 401) {
      await clearToken();
    }
    throw err; // ส่ง error กลับ
  }
);

/* -----------------------------
   Auth APIs
   ----------------------------- */
export async function register({ username, email, password }) {
  const { data } = await API.post("/register/", {
    username,
    email,
    password,
  });
  return data;
}

export async function login({ email, password }) {
  const { data } = await API.post("/login/", {
    email,
    password,
  });

  if (data?.access_token) {
    await setToken(data.access_token);
  }
  return data;
}

// ดึงข้อมูลผู้ใช้
export async function getMe() {
  const { data } = await API.get("/me");
  return data;
}

/* -----------------------------
   TEST API
   ----------------------------- */
export async function ping() {
  try {
    const { data } = await API.get("/");
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message || "network error" };
  }
}

/* -----------------------------
   File Upload
   ----------------------------- */
export async function uploadFile(imageUri) {
  const form = new FormData();
  form.append("file", {
    uri: imageUri,
    name: "photo.jpg",
    type: "image/jpeg",
  });

  const { data } = await API.post("/files/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data; // { url: "/uploads/xxx.jpg" }
}

/* -----------------------------
   YOLO Detection
   ----------------------------- */
export async function detect(imageUri, onUploadProgress) {
  const form = new FormData();
  form.append("file", {
    uri: imageUri,
    name: "upload.jpg",
    type: "image/jpeg",
  });

  const { data } = await API.post("/yolo/predict", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });

  return data;

  /* รูปแบบ data:
  {
    name: "Omelet Rice",
    image_url: "/uploads/abc.jpg",
    detections: [
      { label: "Omelet Rice", confidence: 0.82, box: [x1,y1,x2,y2] }
    ]
  }
  */
}
