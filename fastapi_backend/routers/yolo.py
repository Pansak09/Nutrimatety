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

model = YOLO("models/best.pt")  # classification model (yolov8n-cls, 50 classes)

TOP_K = 5


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

    # normalize image ก่อนส่งเข้า YOLO
    try:
        image_path = normalize_image(raw_path)
    except HTTPException:
        raw_path.unlink(missing_ok=True)
        raise

    # run YOLO classification
    try:
        results = model.predict(
            source=str(image_path),
            save=True,
            project="results",
            name="runs",
            exist_ok=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YOLO failed: {str(e)}")

    if not results:
        return {"success": False, "predicted_class": None, "top_k": []}

    r = results[0]
    probs = r.probs  # classification ใช้ probs ไม่ใช่ boxes

    top1_idx = int(probs.top1)
    top1_name = model.names[top1_idx]
    top1_conf = float(probs.top1conf)

    top5_idx = probs.top5[:TOP_K]
    top5_conf = probs.top5conf.cpu().numpy()[:TOP_K]
    top_k = [
        {"cls": int(idx), "label": model.names[int(idx)], "conf": round(float(conf), 4)}
        for idx, conf in zip(top5_idx, top5_conf)
    ]

    saved_image = Path(r.save_dir) / image_path.name
    rel_path = saved_image.relative_to("results")

    return JSONResponse({
        "success": True,
        "name": top1_name,
        "confidence": round(top1_conf, 4),
        "detections": top_k,   # ← ใช้ชื่อเดิม แค่เนื้อหาข้างในเปลี่ยนเป็น top-k แทน box
        "image_url": f"/results/{rel_path.as_posix()}",
        "uploaded_url": f"/uploads/{image_path.name}",
        "original_width": r.orig_shape[1],
        "original_height": r.orig_shape[0],
    })