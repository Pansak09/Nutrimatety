# yolov8_infer.py
from ultralytics import YOLO
from pathlib import Path

# ⭐ รายการ class ที่คุณเทรน YOLOv8 ไว้
CLASS_MAP = [
    "Fried Rice",
    "Pad Thai",
    "Papaya Salad",
    "Omelet Rice",
    "Green Curry",
    "Tom Yum"
]

_model = None

def detect_objects(image_path: str):
    global _model
    if _model is None:
        _model = YOLO("models/best.pt")

    results = _model.predict(
        source=image_path,
        save=True,
        project="results",
        name="runs",
        exist_ok=True,
    )

    r = results[0]

    detected_classes = []
    for b in r.boxes:
        cls_id = int(b.cls[0])
        conf = float(b.conf[0])
        name = CLASS_MAP[cls_id] if cls_id < len(CLASS_MAP) else f"class_{cls_id}"
        detected_classes.append(name)

    # ไฟล์ที่ YOLO เซฟไว้หลัง annotate
    saved_path = Path(r.save_dir) / Path(image_path).name

    return {
        "filename": saved_path.name,
        "detected_classes": detected_classes,
        "confidence": [float(b.conf[0]) for b in r.boxes],
    }
