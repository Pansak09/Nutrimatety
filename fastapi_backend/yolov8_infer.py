# yolov8_infer.py
from ultralytics import YOLO
from pathlib import Path

_model = None

def _get_model():
    global _model
    if _model is None:
        _model = YOLO(str(Path(__file__).resolve().parent / "models" / "best.pt"))
    return _model

def run_infer(input_path: str, results_dir: str):
    """
    return: (output_image_path, detections, (orig_w, orig_h))
    detections = [{cls:int, conf:float, box:[x1,y1,x2,y2]}]
    """
    model = _get_model()
    results = model.predict(
        source=input_path,
        save=True,
        project=results_dir,
        name="predict",
        exist_ok=True,
        conf=0.25
    )
    r = results[0]

    # path ของภาพ annotate ที่เซฟโดย YOLO
    out_path = str(r.plot(save=True)) if hasattr(r, "plot") else str(r.path)

    dets = []
    orig_w, orig_h = None, None
    if getattr(r, "orig_shape", None):
        orig_h, orig_w = r.orig_shape

    if r.boxes is not None:
        for b in r.boxes:
            cls = int(b.cls.item())
            conf = float(b.conf.item())
            x1, y1, x2, y2 = [float(v) for v in b.xyxy[0].tolist()]
            dets.append({"cls": cls, "conf": conf, "box": [x1, y1, x2, y2]})

    return out_path, dets, (orig_w or 0, orig_h or 0)
