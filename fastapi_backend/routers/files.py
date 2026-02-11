# routers/files.py
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/files", tags=["files"])

MAX_BYTES = 8 * 1024 * 1024
ALLOWED_EXT = {"jpg", "jpeg", "png", "webp"}


def _make_filename() -> str:
    return f"{uuid.uuid4().hex}.jpg"


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image allowed")

    fname = _make_filename()
    fpath = UPLOAD_DIR / fname

    size = 0
    CHUNK = 64 * 1024

    with fpath.open("wb") as out:
        while True:
            chunk = await file.read(CHUNK)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_BYTES:
                out.close()
                fpath.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="File too large")
            out.write(chunk)

    try:
        with Image.open(fpath) as im:
            im = im.convert("RGB")       # ← บังคับ RGB
            im.save(fpath, "JPEG", quality=95)
    except UnidentifiedImageError:
        fpath.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Invalid image file")

    return JSONResponse(
        {
            "url": f"/uploads/{fname}",
            "filename": fname
        },
        status_code=status.HTTP_201_CREATED
    )
