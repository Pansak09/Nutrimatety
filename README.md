# nutrimatety
# 🥗 Nutrimatety - Health & Diet Tracking App

**Nutrimatety** คือแอปพลิเคชันดูแลสุขภาพและติดตามโภชนาการอัจฉริยะ ช่วยให้ผู้ใช้บรรลุเป้าหมายสุขภาพ (ลดน้ำหนัก/เพิ่มน้ำหนัก/รักษารูปร่าง) ผ่านการคำนวณทางวิทยาศาสตร์ (BMR/TDEE) และการบันทึกอาหารที่แม่นยำ

โปรเจกต์นี้พัฒนาด้วย **React Native (Expo)** สำหรับ Frontend และ **FastAPI** ร่วมกับ **PostgreSQL** สำหรับ Backend

## ✨ ฟีเจอร์หลัก (Key Features)

### 🔐 ระบบสมาชิกและความปลอดภัย (Authentication)
* **JWT Authentication:** ยืนยันตัวตนผ่าน Token เพื่อความปลอดภัยในการเข้าถึงข้อมูล

### 👤 โปรไฟล์สุขภาพอัจฉริยะ (Smart Health Profile)
* **Personalized Setup:** สร้างโปรไฟล์ตามข้อมูลจริง (อายุ, เพศ, ส่วนสูง, น้ำหนัก, ระดับกิจกรรม)
* **Goal Setting:** กำหนดเป้าหมายสุขภาพ (ลดน้ำหนัก, เพิ่มกล้ามเนื้อ, รักษาหุ่น)
* **Auto Calculation:** คำนวณค่า **BMI**, **BMR** (พลังงานพื้นฐาน) และ **TDEE** (พลังงานที่ใช้ต่อวัน) ให้อัตโนมัติทันที

### 🍽️ ระบบติดตามโภชนาการ (Nutrition Tracking)
* **Meal Logging:** บันทึกอาหารแยกตามมื้อ (เช้า, กลางวัน, เย็น, ของว่าง)
* **Macro-nutrients:** ติดตามสารอาหารหลักทั้ง **โปรตีน (Protein)**, **คาร์โบไฮเดรต (Carb)**, และ **ไขมัน (Fat)**
* **Menu Database:** เลือกบันทึกจากฐานข้อมูลเมนูอาหารที่มีโภชนาการระบุไว้แล้ว

### 📸 AI & Image Features
* **AI Food Analysis:** ระบบวิเคราะห์รูปภาพอาหาร (Smart Recognition)
* **Photo Gallery:** อัปโหลดและเก็บรูปภาพอาหารในแต่ละมื้อเพื่อเป็น Diary

### 📊 แดชบอร์ดและประวัติ (Dashboard & History)
* **Daily Summary:** แสดงกราฟวงกลมหรือแถบความคืบหน้าของแคลอรี่ที่กินไป vs เป้าหมาย
* **Eating History:** ดูประวัติการกินย้อนหลังเพื่อวิเคราะห์พฤติกรรมสุขภาพ

---

## 🛠 Tech Stack

### Frontend (Mobile App)
* **Framework:** React Native (via Expo SDK)
* **Language:** JavaScript / React
* **Navigation:** React Navigation (Stack & Bottom Tabs)
* **HTTP Client:** Axios
* **UI/UX:** Expo Vector Icons, StyleSheet

### Backend (API Server)
* **Framework:** FastAPI (Python)
* **Database:** PostgreSQL
* **ORM:** SQLAlchemy
* **Data Validation:** Pydantic
* **Authentication:** OAuth2 with Password (JWT), Passlib

---

## 🚀 การติดตั้งและรันโปรเจกต์ (Installation Guide)

### ส่วนที่ 1: ตั้งค่า Database & Backend

1.  **Clone Project**
    ```bash
    git clone [https://github.com/Pansak09/Nutrimatety.git](https://github.com/Pansak09/Nutrimatety.git)
    cd Nutrimatety/backend
    ```

2.  **เตรียม PostgreSQL Database**
    * สร้าง Database เปล่าใน PostgreSQL (เช่นชื่อ `nutrimatety_db`)
    * ตรวจสอบ Username/Password ของ PostgreSQL ในเครื่องคุณ

3.  **ตั้งค่า Environment Variables**
    * สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/`
    * ใส่โค้ดด้านล่าง (เปลี่ยนข้อมูลให้ตรงกับเครื่องของคุณ):
    ```env
    # backend/.env
    # รูปแบบ: postgresql://username:password@localhost:5432/db_name
    DATABASE_URL=postgresql://postgres:password1234@localhost:5432/nutrimatety_db
    
    SECRET_KEY=yoursecretkey_changeme_12345
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    ```

4.  **ติดตั้งและรัน Backend**
    ```bash
    # สร้าง Virtual Environment
    python -m venv venv
    
    # Activate Environment
    # Windows:
    venv\Scripts\activate
    # Mac/Linux:
    source venv/bin/activate

    # ติดตั้ง Dependencies
    pip install -r requirements.txt
    
    # (ถ้ายังไม่มี driver สำหรับ postgres)
    pip install psycopg2-binary

    # รัน Server
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    ✅ *ตรวจสอบ:* เข้าเว็บ `http://localhost:8000/docs` ต้องเจอหน้า Swagger UI

---

### ส่วนที่ 2: ตั้งค่า Frontend (React Native)

1.  **เข้าไปที่โฟลเดอร์ Frontend**
    ```bash
    cd ../frontend
    ```

2.  **ติดตั้ง Dependencies**
    ```bash
    npm install
    ```

3.  **⚠️ สำคัญ: ตั้งค่า IP Address**
    * เนื่องจาก Mobile App ไม่สามารถเรียก `localhost` ของคอมพิวเตอร์ได้
    * ให้หา IPv4 ของเครื่องคอมพิวเตอร์ (Windows: `ipconfig`, Mac: `ifconfig`)
    * เปิดไฟล์ `api.js` (หรือไฟล์ config) แล้วแก้ URL:
    ```javascript
    // api.js
    // ❌ ห้ามใช้ localhost
    // ✅ ใช้ IP จริงของเครื่องคอมพิวเตอร์
    export const BASE_URL = "[http://192.168.1.](http://192.168.1.)XX:8000"; 
    ```

4.  **รันแอปพลิเคชัน**
    ```bash
    npx expo start
    ```
    * กด `a` เพื่อรันบน Android Emulator
    * กด `i` เพื่อรันบน iOS Simulator
    * สแกน QR Code ผ่านแอป **Expo Go** บนมือถือ (ต้องต่อ Wi-Fi วงเดียวกับคอมพิวเตอร์)

---

## 📝 API Endpoints ที่สำคัญ

| Method | Endpoint | รายละเอียด |
| :--- | :--- | :--- |
| `POST` | `/users/register-with-profile` | สมัครสมาชิก + สร้างโปรไฟล์สุขภาพ |
| `POST` | `/users/login` | เข้าสู่ระบบ (รับ Token) |
| `GET` | `/users/me` | ดูข้อมูล User ปัจจุบัน |
| `GET` | `/profiles/me` | ดูข้อมูล BMR, TDEE, และสารอาหารที่ต้องการ |
| `POST` | `/meals/` | บันทึกรายการอาหาร |

---

## ⚠️ ปัญหาที่พบบ่อย (Troubleshooting)

### 1. Error: `Network request failed`
* **สาเหตุ:** มือถือกับคอมพิวเตอร์ไม่ได้เชื่อมต่อ Wi-Fi เดียวกัน หรือใส่ IP Address ใน `api.js` ผิด
* **วิธีแก้:** เช็ค IPv4 ของเครื่องคอมฯ และอัปเดตในโค้ด Frontend ใหม่

### 2. Error 400 Bad Request (ตอนสมัครสมาชิก)
* **สาเหตุ:** ส่งค่าภาษาไทย (เช่น "ลดน้ำหนัก") ไปยัง Backend ที่รับค่าภาษาอังกฤษ (เช่น "lose_weight")
* **วิธีแก้:** ตรวจสอบไฟล์ `CreateProfileScreen.js` ว่ามีการ Map ค่า Goal ก่อนส่งหรือไม่

### 3. PostgreSQL Connection Error
* **สาเหตุ:** ยังไม่ได้สร้าง Database หรือใส่ Password ในไฟล์ `.env` ผิด
* **วิธีแก้:** เช็คไฟล์ `.env` และลองใช้โปรแกรมอย่าง pgAdmin หรือ DBeaver เชื่อมต่อดูว่าเข้าได้ไหม

---

## 👨‍💻 ผู้จัดทำ
GitHub: [Pansak09](https://github.com/Pansak09)
