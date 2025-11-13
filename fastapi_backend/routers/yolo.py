# routers/yolo.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from pathlib import Path
import uuid
import shutil

router = APIRouter(prefix="/yolo", tags=["yolo"])

UPLOAD_DIR = Path("uploads")
RESULTS_DIR = Path("results") / "runs"     # จะได้ /results/runs/...
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# โหลดโมเดลครั้งเดียวตอนเริ่ม
# ถ้า path ไม่ถูก ให้ตรวจว่า models/best.pt อยู่ถูกที่
model = YOLO("models/best.pt")

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    # ตรวจชนิดไฟล์
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="only image allowed")

    # ตั้งชื่อไฟล์และบันทึกลง uploads/
    ext = (Path(file.filename).suffix or ".jpg").lower()
    # กันบางเคสที่ไม่ใช่รูปจริง
    if ext not in [".jpg", ".jpeg", ".png", ".bmp", ".webp"]:
        ext = ".jpg"
    fname = f"{uuid.uuid4().hex}{ext}"
    fpath = UPLOAD_DIR / fname
    with fpath.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    # รัน YOLO และบันทึกรูปที่วาดกล่องไว้ใน /results/runs/
    # exist_ok=True เพื่อไม่ทับ run เดิม
    results = model.predict(
        source=str(fpath),
        save=True,
        conf=0.25,
        project=str(RESULTS_DIR.parent),  # "results"
        name=RESULTS_DIR.name,            # "runs"
        exist_ok=True
    )

    r = results[0]
    boxes = []
    for b in r.boxes:
        x1, y1, x2, y2 = map(float, b.xyxy[0])
        boxes.append({
            "cls": int(b.cls[0]),
            "conf": float(b.conf[0]),
            "box": [x1, y1, x2, y2],
        })

    # ไฟล์ผลลัพธ์ที่ YOLO เซฟไว้ (เป็นชื่อเดียวกับต้นฉบับ)
    saved_image = Path(r.save_dir) / fpath.name  # results/runs/<run_id>/<fname>
    # ทำ path แบบ relative เพื่อเสิร์ฟผ่าน StaticFiles("/results")
    rel_path = saved_image.relative_to("results")

    return JSONResponse({
        "success": True,
        "detections": boxes,
        "image_url": f"/results/{rel_path.as_posix()}",  # ภาพที่มีกรอบ
        "uploaded_url": f"/uploads/{fname}",             # ภาพต้นฉบับ
        "original_width": r.orig_shape[1],
        "original_height": r.orig_shape[0],
    })
