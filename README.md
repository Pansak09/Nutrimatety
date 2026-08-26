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

| Method | Endpoint | รายละเอียด |
| --- | --- | --- |
| `POST` | `/users/register` | ตรวจสอบว่าอีเมลยังไม่ถูกลงทะเบียน |
| `POST` | `/users/login` | เข้าสู่ระบบและรับ JWT |
| `POST` | `/users/register-with-profile` | สมัครสมาชิกพร้อมสร้างโปรไฟล์ |
| `GET` | `/users/me` | ดูผู้ใช้ปัจจุบัน |
| `POST` | `/profiles/` | สร้างโปรไฟล์ของผู้ใช้ที่เข้าสู่ระบบ |
| `GET` | `/profiles/me` | ดูโปรไฟล์ของผู้ใช้ปัจจุบัน |
| `PATCH/PUT` | `/profiles/` | แก้ไขโปรไฟล์ |
| `DELETE` | `/profiles/me` | ลบโปรไฟล์ |
| `GET` | `/menu` | รายการเมนูอาหาร |
| `GET/POST/PATCH/DELETE` | `/meals` | จัดการบันทึกมื้ออาหาร |
| `GET` | `/meals/dates` | วันที่ที่มีประวัติอาหาร |
| `POST` | `/files/upload` | อัปโหลดรูปภาพอาหาร |
| `POST` | `/yolo/predict` | จำแนกอาหารจากรูปภาพ |
| `GET` | `/analytics/nutrition-behavior` | สรุปพฤติกรรมโภชนาการ |
| `GET` | `/analytics/weekly-summary` | สรุปรายสัปดาห์ |
| `GET/POST/PUT/DELETE` | `/admin/menu` | จัดการเมนูสำหรับผู้ดูแลระบบ |

รายละเอียด request และ response ที่เป็นปัจจุบันดูได้จาก Swagger UI ที่ `/docs` หลังเริ่ม Backend

## ข้อมูลที่ไม่ควร commit

ไม่ควรนำค่าจริงใน `.env` เช่นรหัสผ่านฐานข้อมูลและ `SECRET_KEY` ขึ้น repository และไม่ควร commit โฟลเดอร์ runtime เช่น `venv/`, `uploads/`, `results/` และ `runs/` หากไม่ได้ตั้งใจเก็บไฟล์ตัวอย่าง

## แก้ปัญหาเบื้องต้น

- **เชื่อม API ไม่ได้จากมือถือ:** ตรวจสอบ `WINDOWS_IP` ใน `myapp/api.js`, เครือข่าย Wi-Fi และ firewall ของพอร์ต 8000
- **Backend เริ่มไม่ได้:** ตรวจสอบค่า `DATABASE_URL` และให้ PostgreSQL ทำงานอยู่
- **YOLO หาโมเดลไม่เจอ:** ให้รันคำสั่งจากโฟลเดอร์ `fastapi_backend` และตรวจสอบว่ามี `models/best.pt`
- **เข้า API ผู้ดูแลไม่ได้ (403):** เพิ่มอีเมลผู้ใช้ใน `ADMIN_EMAILS` แล้วเข้าสู่ระบบใหม่เพื่อขอ JWT
