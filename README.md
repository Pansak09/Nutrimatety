# Nutrimatety

Nutrimatety คือแอปมือถือสำหรับติดตามโภชนาการและสุขภาพ ผู้ใช้สามารถสร้างโปรไฟล์สุขภาพ บันทึกมื้ออาหาร ดูสรุปและประวัติการรับประทานอาหาร รวมถึงถ่ายหรืออัปโหลดรูปอาหารเพื่อให้โมเดล YOLO ช่วยจำแนกอาหารได้

โปรเจกต์แบ่งเป็น React Native/Expo สำหรับแอปมือถือ และ FastAPI กับ PostgreSQL สำหรับ API และฐานข้อมูล

## ความสามารถ

- สมัครสมาชิก เข้าสู่ระบบด้วย JWT และเก็บโทเค็นใน AsyncStorage
- สร้างและแก้ไขโปรไฟล์สุขภาพ เช่น วันเกิด เพศ น้ำหนัก ส่วนสูง ระดับกิจกรรม และเป้าหมาย
- บันทึก แก้ไข และลบมื้ออาหาร พร้อมข้อมูลแคลอรี โปรตีน คาร์โบไฮเดรต และไขมัน
- ดูเมนูอาหาร ประวัติการรับประทาน และสรุป/พฤติกรรมโภชนาการรายสัปดาห์
- อัปโหลดรูปอาหารและวิเคราะห์ภาพด้วยโมเดล YOLOv8 ที่ `fastapi_backend/models/best.pt`
- จัดการเมนูอาหารสำหรับผู้ดูแลระบบผ่าน API และหน้า `/admin/menu-page`

## โครงสร้างโปรเจกต์

```text
.
├── myapp/                 # แอป React Native (Expo)
│   ├── App.js
│   ├── api.js             # ที่อยู่ FastAPI และ Axios client
│   ├── screens/
│   └── components/
└── fastapi_backend/       # FastAPI, SQLAlchemy และ PostgreSQL
    ├── main.py
    ├── routers/
    ├── models.py
    ├── schemas.py
    ├── alembic/
    └── models/best.pt     # โมเดล YOLO สำหรับจำแนกอาหาร
```

## เทคโนโลยี

- **Mobile:** React Native 0.81, Expo SDK 54, React Navigation, Axios, Expo Camera/Image Picker
- **Backend:** Python, FastAPI, Uvicorn, SQLAlchemy, Pydantic Settings, PostgreSQL, Alembic
- **AI/รูปภาพ:** Ultralytics YOLOv8, Pillow, NumPy
- **Authentication:** JWT (`python-jose`) และ Passlib/bcrypt

## ข้อกำหนดเบื้องต้น

- Node.js และ npm
- Python 3.10 ขึ้นไป
- PostgreSQL ที่กำลังทำงานอยู่
- Expo Go หรือ Android/iOS emulator สำหรับทดสอบแอป

## ตั้งค่าและรัน Backend

1. สร้างฐานข้อมูล PostgreSQL เช่น `nutrimatety_db`

2. เข้าโฟลเดอร์ Backend และสร้าง virtual environment

   ```powershell
   cd fastapi_backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

   สำหรับ macOS/Linux ให้ใช้ `source venv/bin/activate`

3. สร้างไฟล์ `fastapi_backend/.env` โดยกำหนดค่าที่จำเป็นดังนี้

   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/nutrimatety_db
   SECRET_KEY=replace_with_a_long_random_secret
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   CORS_ORIGINS=*
   ADMIN_EMAILS=admin@example.com
   ```

   `ADMIN_EMAILS` เป็นรายการอีเมลผู้ดูแลระบบ คั่นด้วยเครื่องหมายจุลภาค และใช้สำหรับ API ภายใต้ `/admin`.

4. ติดตั้ง dependencies และรันเซิร์ฟเวอร์

   ```powershell
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   จากนั้นเปิด [http://localhost:8000/docs](http://localhost:8000/docs) เพื่อดู Swagger UI หรือเรียก `GET /healthz` เพื่อตรวจสอบสถานะ API

> หมายเหตุ: ณ สถานะปัจจุบัน `fastapi_backend/requirements.txt` มีบรรทัด `passlib[bcrypt==3.2.2` ที่ปิดวงเล็บไม่ครบ และยังไม่ได้ระบุ `pydantic-settings` แม้โค้ดจะใช้งานอยู่ จึงต้องแก้ dependency เหล่านี้ก่อนติดตั้งในสภาพแวดล้อมใหม่

## ตั้งค่าและรันแอปมือถือ

1. เปิดเทอร์มินัลใหม่ แล้วเข้าโฟลเดอร์แอป

   ```powershell
   cd myapp
   npm install
   ```

2. แก้ค่า `WINDOWS_IP` ใน `myapp/api.js` ให้เป็น IPv4 ของเครื่องที่กำลังรัน FastAPI

   ```js
   const WINDOWS_IP = '192.168.1.100';
   ```

   แอปจริงต้องใช้ IP ของเครื่อง ไม่ใช่ `localhost` และอุปกรณ์มือถือกับคอมพิวเตอร์ควรอยู่เครือข่ายเดียวกัน

3. เริ่ม Expo

   ```powershell
   npm start
   ```

   หรือเลือกแพลตฟอร์มโดยตรงด้วย `npm run android`, `npm run ios` หรือ `npm run web`

## API หลัก

API ที่ต้องระบุตัวตนให้ส่ง header ต่อไปนี้ โดยนำ `access_token` ที่ได้จากการ login หรือสมัครสมาชิกมาใช้

```http
Authorization: Bearer <access_token>
```

### ผู้ใช้และโปรไฟล์

| Endpoint | ส่งไป (request) | ได้รับกลับ/นำไปแสดง (response) |
| --- | --- | --- |
| `POST /users/register` | JSON: `email`, `password` | `{ "ok": true }` เมื่ออีเมลยังไม่อยู่ในระบบ ใช้ตรวจสอบก่อนสมัคร |
| `POST /users/login` | JSON: `email`, `password` | `access_token`, `token_type` — เก็บ token เพื่อเรียก API ที่ล็อกอินแล้ว |
| `POST /users/register-with-profile` | JSON: `email`, `password`, `profile` | `access_token`, `token_type` — สร้างบัญชีและโปรไฟล์พร้อมเข้าสู่ระบบ |
| `GET /users/me` | Header: Bearer token | `id`, `email`, `signup_completed` — ใช้ตรวจสอบผู้ใช้ที่ล็อกอินและสถานะสร้างโปรไฟล์ |
| `GET /users/check-email?email=...` | Query: `email` | `available` — ใช้แสดงว่าอีเมลสมัครได้หรือไม่ |
| `GET /users/check-username?username=...` | Query: `username` | `available` — ใช้แสดงว่าชื่อผู้ใช้ใช้ได้หรือไม่ |
| `POST /profiles/` | Header + JSON โปรไฟล์ | โปรไฟล์พร้อมค่าคำนวณสุขภาพ ใช้หลังสมัครแบบแยกขั้นตอน |
| `GET /profiles/me` | Header: Bearer token | รายละเอียดโปรไฟล์และเป้าหมายสารอาหาร ใช้แสดงหน้า Profile/Home |
| `PATCH /profiles/` หรือ `PUT /profiles/` | Header + JSON เฉพาะฟิลด์ที่แก้ | โปรไฟล์ที่อัปเดตแล้ว รวมค่า BMI/BMR/TDEE ที่คำนวณใหม่ |
| `DELETE /profiles/me` | Header: Bearer token | ไม่มี response body (`204`) |

ฟิลด์ `profile` ที่ส่งได้คือ `username`, `gender`, `date_of_birth` (`YYYY-MM-DD`), `height`, `current_weight`, `target_weight`, `goal`, `food_allergies`, `avatar_url` และ `lifestyle` ส่วนโปรไฟล์ที่ตอบกลับเพิ่ม `id`, `user_id`, `bmi`, `bmr`, `tdee`, `protein_target`, `carb_target` และ `fat_target` เพื่อแสดงผลสุขภาพรายบุคคล

ตัวอย่างการสมัครพร้อมโปรไฟล์:

```json
{
  "email": "user@example.com",
  "password": "your-password",
  "profile": {
    "username": "nutri_user",
    "gender": "male",
    "date_of_birth": "2000-01-15",
    "height": 175,
    "current_weight": 70,
    "target_weight": 65,
    "goal": "ลดน้ำหนัก",
    "lifestyle": "light"
  }
}
```

### เมนูและบันทึกมื้ออาหาร

| Endpoint | ส่งไป (request) | ได้รับกลับ/นำไปแสดง (response) |
| --- | --- | --- |
| `GET /menu?search=...` | Query `search` (จำเป็น) | รายการเมนูที่ชื่อไทยหรืออังกฤษตรงคำค้น พร้อม `food_name`, `food_name_en`, `calories`, `protein`, `carb`, `fat`, `image_url` — ใช้เป็นรายการค้นหาอาหาร |
| `POST /meals` | Header + JSON มื้ออาหาร | มื้ออาหารที่บันทึกแล้ว: `id`, `menu_id`, `name`, สารอาหาร, `meal_time`, `image_url`, `created_at` |
| `GET /meals?date=YYYY-MM-DD` | Header; `date` ไม่บังคับ | รายการมื้อของผู้ใช้ (กรองตามวันได้) สำหรับหน้า History และสรุปมื้ออาหาร |
| `PATCH /meals/{meal_id}` | Header + JSON เฉพาะข้อมูลที่แก้ | รายการมื้ออาหารหลังแก้ไข |
| `DELETE /meals/{meal_id}` | Header: Bearer token | ไม่มี response body (`204`) |
| `GET /meals/dates` | Header: Bearer token | อาร์เรย์วันที่ เช่น `["2026-08-26"]` เพื่อทำเครื่องหมายวันที่มีประวัติอาหาร |

ข้อมูลมื้ออาหารที่ส่งตอนสร้างใช้ `name` และ `meal_time` เป็นฟิลด์จำเป็น และส่ง `protein`, `fat`, `carb`, `calories`, `image_url` ได้ตามต้องการ ตัวอย่าง:

```json
{
  "name": "ข้าวกะเพราไก่",
  "meal_time": "lunch",
  "calories": 550,
  "protein": 30,
  "carb": 65,
  "fat": 18,
  "image_url": "/uploads/example.jpg"
}
```

### รูปภาพและ AI

| Endpoint | ส่งไป (request) | ได้รับกลับ/นำไปแสดง (response) |
| --- | --- | --- |
| `POST /files/upload` | `multipart/form-data` ฟิลด์ `file` เป็นรูปภาพ (สูงสุด 8 MB) | `url`, `filename` — เก็บ `url` ไว้แสดงภาพหรือแนบกับมื้ออาหาร |
| `POST /yolo/predict` | `multipart/form-data` ฟิลด์ `file` เป็นรูปภาพ | `success`, `name`, `confidence`, `detections`, `image_url`, `uploaded_url`, `original_width`, `original_height` — แสดงชื่ออาหารที่ทำนาย ความมั่นใจ ตัวเลือก 5 อันดับแรก และภาพผลลัพธ์ |

`detections` ของ YOLO เป็นรายการอันดับการจำแนก เช่น `{ "cls": 1, "label": "Omelet Rice", "conf": 0.82 }` ไม่ใช่พิกัดกรอบวัตถุ

### การวิเคราะห์และผู้ดูแลระบบ

| Endpoint | ส่งไป (request) | ได้รับกลับ/นำไปแสดง (response) |
| --- | --- | --- |
| `GET /analytics/nutrition-behavior` | Header: Bearer token | ค่าเฉลี่ย 7 วันของ `calories`, `protein`, `carb`, `fat` เปรียบเทียบกับกลุ่มที่มีเพศ ไลฟ์สไตล์ ช่วงอายุ และเป้าหมายเดียวกัน พร้อม `period` และ `peer_group` |
| `GET /analytics/weekly-summary` | Header: Bearer token | `period`, `summary_type`, `peer_group`, `message` — ข้อความสรุป/แจ้งเตือนรายสัปดาห์สำหรับหน้า Summary |
| `GET/POST/PUT/DELETE /admin/menu` | Header ของอีเมลใน `ADMIN_EMAILS`; JSON เมนูสำหรับ POST/PUT | รายการหรือข้อมูลเมนู: `id`, `food_name`, `food_name_en`, `calories`, `protein`, `carb`, `fat` |

รายละเอียด request และ response ที่เป็นปัจจุบันดูได้จาก Swagger UI ที่ `/docs` หลังเริ่ม Backend

## ข้อมูลที่ไม่ควร commit

ไม่ควรนำค่าจริงใน `.env` เช่นรหัสผ่านฐานข้อมูลและ `SECRET_KEY` ขึ้น repository และไม่ควร commit โฟลเดอร์ runtime เช่น `venv/`, `uploads/`, `results/` และ `runs/` หากไม่ได้ตั้งใจเก็บไฟล์ตัวอย่าง

## แก้ปัญหาเบื้องต้น

- **เชื่อม API ไม่ได้จากมือถือ:** ตรวจสอบ `WINDOWS_IP` ใน `myapp/api.js`, เครือข่าย Wi-Fi และ firewall ของพอร์ต 8000
- **Backend เริ่มไม่ได้:** ตรวจสอบค่า `DATABASE_URL` และให้ PostgreSQL ทำงานอยู่
- **YOLO หาโมเดลไม่เจอ:** ให้รันคำสั่งจากโฟลเดอร์ `fastapi_backend` และตรวจสอบว่ามี `models/best.pt`
- **เข้า API ผู้ดูแลไม่ได้ (403):** เพิ่มอีเมลผู้ใช้ใน `ADMIN_EMAILS` แล้วเข้าสู่ระบบใหม่เพื่อขอ JWT
