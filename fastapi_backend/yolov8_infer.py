# yolov8_infer.py
from ultralytics import YOLO
from pathlib import Path

_model = None


def _get_model():
    global _model
    if _model is None:
        _model = YOLO("models/best.pt")
    return _model


def classify_image(image_path: str, top_k: int = 5) -> dict:
    """
    รัน inference บนโมเดล YOLOv8 classification (yolov8n-cls, 50 classes)
    คืนค่า top-1 prediction พร้อม confidence และ top-k อันดับรอง
    """
    model = _get_model()

    results = model.predict(
        source=image_path,
        save=True,
        project="results",
        name="runs",
        exist_ok=True,
    )

    r = results[0]
    probs = r.probs                 # Probs object เฉพาะของ classification task
    names = model.names             # ชื่อ class จริงที่ฝังอยู่ในตัวโมเดล (50 classes)

    top1_idx = int(probs.top1)
    top1_name = names[top1_idx]
    top1_conf = float(probs.top1conf)

    top5_idx = probs.top5[:top_k]
    top5_conf = probs.top5conf.cpu().numpy()[:top_k]
    top_k_results = [
        {"class": names[int(idx)], "confidence": round(float(conf), 4)}
        for idx, conf in zip(top5_idx, top5_conf)
    ]

    # ไฟล์ที่ YOLO เซฟไว้หลัง annotate
    saved_path = Path(r.save_dir) / Path(image_path).name

    return {
        "filename": saved_path.name,
        "predicted_class": top1_name,
        "confidence": round(top1_conf, 4),
        "top_k": top_k_results,
    }


if __name__ == "__main__":
    result = classify_image("test_image.jpg")
    print(result)