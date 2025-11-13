# routers/files.py
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Request
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError

BASE_DIR   = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
RESULTS_DIR= BASE_DIR / "results" / "runs"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/files", tags=["files"])

MAX_BYTES = 8 * 1024 * 1024
ALLOWED_EXT = {"jpg", "jpeg", "png", "webp"}

def _make_filename(orig_name: str) -> str:
    ext = (orig_name or "").split(".")[-1].lower()
    if ext not in ALLOWED_EXT:
        ext = "jpg"
    return f"{uuid.uuid4().hex}.{ext}"

async def _save_upload(file: UploadFile, max_bytes: int = MAX_BYTES) -> Path:
    fname = _make_filename(file.filename)
    fpath = UPLOAD_DIR / fname

    size = 0
    CHUNK = 64 * 1024

    with fpath.open("wb") as out:
        while True:
            chunk = await file.read(CHUNK)
            if not chunk:
                break
            size += len(chunk)
            if size > max_bytes:
                out.close()
                fpath.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="File too large")
            out.write(chunk)

    try:
        with Image.open(fpath) as im:
            im.verify()
    except UnidentifiedImageError:
        fpath.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Invalid image file")

    return fpath

def _to_url_path(p: Path) -> str:
    return f"/uploads/{p.name}"

# ============ FIXED UPLOAD WITHOUT AUTH =============
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...)
):
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image allowed")

    saved = await _save_upload(file)

    return JSONResponse(
        {"url": _to_url_path(saved), "filename": saved.name},
        status_code=status.HTTP_201_CREATED
    )
