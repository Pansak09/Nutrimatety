# routers/yolo.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from pathlib import Path
import uuid
import shutil

from PIL import Image, UnidentifiedImageError

router = APIRouter(prefix="/yolo", tags=["yolo"])

UPLOAD_DIR = Path("uploads")
RESULTS_DIR = Path("results") / "runs"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

model = YOLO("models/best.pt")


def normalize_image(src: Path) -> Path:
    """
    เปิดรูปด้วย PIL แล้วบันทึกใหม่เป็น RGB JPEG
    เพื่อให้ YOLO / OpenCV อ่านได้ 100%
    """
    try:
        with Image.open(src) as im:
            im = im.convert("RGB")
            fixed = src.with_suffix(".jpg")
            im.save(fixed, format="JPEG", quality=95)
        return fixed
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Invalid image file")


@router.post("/predict")
async def predict(file: UploadFile = File(...)):

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image allowed")

    fname = f"{uuid.uuid4().hex}.jpg"
    raw_path = UPLOAD_DIR / fname

    # save raw upload
    with raw_path.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    # 🔥 FIX: normalize image ก่อนส่งเข้า YOLO
    try:
        image_path = normalize_image(raw_path)
    except HTTPException:
        raw_path.unlink(missing_ok=True)
        raise

    # run YOLO
    try:
        results = model.predict(
            source=str(image_path),
            conf=0.25,
            save=True,
            project="results",
            name="runs",
            exist_ok=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YOLO failed: {str(e)}")

    if not results:
        return {"success": False, "detections": []}

    r = results[0]

    boxes = []
    for b in r.boxes:
        cls_id = int(b.cls[0])
        conf = float(b.conf[0])
        x1, y1, x2, y2 = map(float, b.xyxy[0])

        label = model.names[cls_id] if cls_id in model.names else f"class_{cls_id}"

        boxes.append({
            "cls": cls_id,
            "label": label,
            "conf": conf,
            "box": [x1, y1, x2, y2],
        })

    saved_image = Path(r.save_dir) / image_path.name
    rel_path = saved_image.relative_to("results")

    return JSONResponse({
        "success": True,
        "name": boxes[0]["label"] if boxes else "",
        "detections": boxes,
        "image_url": f"/results/{rel_path.as_posix()}",
        "uploaded_url": f"/uploads/{image_path.name}",
        "original_width": r.orig_shape[1],
        "original_height": r.orig_shape[0],
    })
