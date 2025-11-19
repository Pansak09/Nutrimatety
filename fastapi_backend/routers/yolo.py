# routers/yolo.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from pathlib import Path
import uuid
import shutil

router = APIRouter(prefix="/yolo", tags=["yolo"])

UPLOAD_DIR = Path("uploads")
RESULTS_DIR = Path("results") / "runs"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# โหลดโมเดล YOLOv8
model = YOLO("models/best.pt")


@router.post("/predict")
async def predict(file: UploadFile = File(...)):

    # ตรวจองค์ประกอบไฟล์
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="only image allowed")

    ext = (Path(file.filename).suffix or ".jpg").lower()
    if ext not in [".jpg", ".jpeg", ".png", ".bmp", ".webp"]:
        ext = ".jpg"

    fname = f"{uuid.uuid4().hex}{ext}"
    fpath = UPLOAD_DIR / fname

    with fpath.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    # รัน YOLO
    results = model.predict(
        source=str(fpath),
        save=True,
        conf=0.25,
        project=str(RESULTS_DIR.parent),
        name=RESULTS_DIR.name,
        exist_ok=True
    )

    r = results[0]

    boxes = []
    for b in r.boxes:
        cls_id = int(b.cls[0])
        conf = float(b.conf[0])
        x1, y1, x2, y2 = map(float, b.xyxy[0])

        class_name = model.names[cls_id]

        boxes.append({
            "cls": cls_id,
            "conf": conf,
            "box": [x1, y1, x2, y2],
            "label": class_name
        })

    saved_image = Path(r.save_dir) / fpath.name
    rel_path = saved_image.relative_to("results")

    # ชื่ออาหารตัวแรกของภาพ
    food_name = boxes[0]["label"] if boxes else ""

    return JSONResponse({
        "success": True,
        "name": food_name,
        "detections": boxes,
        "image_url": f"/results/{rel_path.as_posix()}",
        "uploaded_url": f"/uploads/{fname}",
        "original_width": r.orig_shape[1],
        "original_height": r.orig_shape[0]
    })
