from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import crud, schemas, models
from database import get_db
from auth import get_current_user_email

router = APIRouter(prefix="/profiles", tags=["profiles"])


# 🟢 สร้างโปรไฟล์ใหม่
@router.post("/", response_model=schemas.ProfileOut, status_code=status.HTTP_201_CREATED)
def create_profile(
    profile: schemas.ProfileCreate,
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ป้องกันการสร้างซ้ำ
    exists = crud.get_profile_by_user(db, user.id)
    if exists:
        raise HTTPException(status_code=400, detail="Profile already exists")

    # ตรวจสอบ username ซ้ำ
    if profile.username:
        existing = db.query(models.Profile).filter(models.Profile.username == profile.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

    # ✅ เพิ่มการรองรับ goal (เป้าหมายสุขภาพ)
    new_profile = crud.create_profile(db, user.id, profile)
    return new_profile


# 🟢 อ่านโปรไฟล์ของตัวเอง
@router.get("/me", response_model=schemas.ProfileOut)
def read_own_profile(
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)
    prof = crud.get_profile_by_user(db, user.id)
    if not prof:
        raise HTTPException(status_code=404, detail="Profile not found")
    return prof


# 🟢 อัปเดตบางฟิลด์ของโปรไฟล์ (PATCH)
@router.patch("/", response_model=schemas.ProfileOut)
def patch_own_profile(
    profile: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)
    db_profile = crud.get_profile_by_user(db, user.id)
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # ตรวจสอบชื่อซ้ำ
    if profile.username:
        existing = (
            db.query(models.Profile)
            .filter(models.Profile.username == profile.username, models.Profile.user_id != user.id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

    # ✅ รองรับฟิลด์ goal และฟิลด์อื่น ๆ ทั้งหมด
    updated = crud.patch_profile(db, user.id, profile)
    return updated


# 🟢 อัปเดตโปรไฟล์ทั้งหมด (PUT)
@router.put("/", response_model=schemas.ProfileOut)
def update_own_profile(
    profile: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)
    db_profile = crud.get_profile_by_user(db, user.id)
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # ตรวจสอบชื่อซ้ำ
    if profile.username:
        existing = (
            db.query(models.Profile)
            .filter(models.Profile.username == profile.username, models.Profile.user_id != user.id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

    # ✅ รองรับการอัปเดต goal ด้วย
    updated = crud.update_profile(db, user.id, profile)
    return updated
