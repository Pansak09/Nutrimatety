# nutrimatety
# 🥗 Nutrimatety - Health & Diet Tracking App

**Nutrimatety** คือแอปพลิเคชันเพื่อสุขภาพที่ช่วยคำนวณและติดตามโภชนาการ (Nutrition Tracking) โดยเน้นการคำนวณค่าพลังงานที่เหมาะสมกับร่างกาย (BMR/TDEE) และบันทึกการรับประทานอาหารในแต่ละวัน พัฒนาด้วย **React Native** (Frontend) และ **FastAPI** (Backend)

## ✨ ฟีเจอร์หลัก (Features)

* **User Authentication:** ระบบสมัครสมาชิกและเข้าสู่ระบบอย่างปลอดภัย (JWT Authentication)
* **Smart Profile:** สร้างโปรไฟล์สุขภาพ (น้ำหนัก, ส่วนสูง, อายุ, เพศ, กิจกรรม)
* **Auto Calculation:** คำนวณค่า BMI, BMR, TDEE และเป้าหมายแคลอรี่ให้อัตโนมัติทันทีที่สมัคร
* **Food Tracking:** บันทึกเมนูอาหาร มื้อเช้า/กลางวัน/เย็น พร้อมดูค่าโภชนาการ (Protein, Carb, Fat)
* **Dashboard:** หน้าสรุปผลโภชนาการเปรียบเทียบกับเป้าหมายประจำวัน
* **History:** ดูประวัติการกินย้อนหลัง
* **Image Handling:** รองรับการอัปโหลดรูปภาพอาหารและรูปโปรไฟล์

## 🛠 Tech Stack

### Frontend (Mobile App)
* **Framework:** React Native (Expo SDK)
* **Navigation:** React Navigation (Stack & Bottom Tabs)
* **HTTP Client:** Axios
* **UI/Icons:** Ionicons, Expo Vector Icons
* **State/Storage:** React Hooks, AsyncStorage

### Backend (API Server)
* **Framework:** FastAPI (Python)
* **Database ORM:** SQLAlchemy
* **Validation:** Pydantic
* **Authentication:** OAuth2 with Password (Bearer Token), Passlib (Bcrypt)
* **Database:** SQLite (Default) / PostgreSQL

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```text
Nutrimatety/
├── backend/                  # ส่วนจัดการ API และฐานข้อมูล
│   ├── routers/              # แยก Endpoints (users, profiles, meals)
│   ├── crud.py               # ฟังก์ชันจัดการ Database
│   ├── models.py             # ตาราง Database (SQLAlchemy)
│   ├── schemas.py            # ตัวตรวจสอบข้อมูล (Pydantic Models)
│   ├── database.py           # การเชื่อมต่อ DB
│   ├── auth.py               # ระบบจัดการ Token & Password Hashing
│   └── main.py               # จุดเริ่มต้นของ Server (Entry Point)
│
└── frontend/                 # ส่วนหน้าจอ Application
    ├── App.js                # ตัวจัดการ Navigation หลัก
    ├── api.js                # ตั้งค่า Axios connection
    ├── screens/              # หน้าจอต่างๆ
    │   ├── LoginScreen.js
    │   ├── RegisterScreen.js
    │   ├── CreateProfileScreen.js # หน้ากรอกข้อมูลคำนวณสุขภาพ
    │   ├── HomeScreen.js          # หน้า Dashboard
    │   ├── FoodFormScreen.js      # หน้าบันทึกอาหาร
    │   └── ...
    └── components/           # UI ย่อยที่ใช้ซ้ำ
