# routers/profile.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import crud, schemas, models
from database import get_db
from auth import get_current_user_email

router = APIRouter(prefix="/profiles", tags=["profiles"])

# CREATE PROFILE สร้างโปรไฟล์ใหม่
@router.post("/", response_model=schemas.ProfileOut, status_code=status.HTTP_201_CREATED)
def create_profile(
    profile: schemas.ProfileCreate,
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ป้องกันสร้างซ้ำ
    exists = crud.get_profile_by_user(db, user.id)
    if exists:
        raise HTTPException(status_code=400, detail="Profile already exists")

    # ตรวจสอบ username ซ้ำ
    if profile.username:
        username_exists = db.query(models.Profile).filter(
            models.Profile.username == profile.username
        ).first()
        if username_exists:
            raise HTTPException(status_code=400, detail="Username already taken")

    new_profile = crud.create_profile(db, user.id, profile)
    return new_profile

# GET MY PROFILE (ดึงโปรไฟล์ของตัวเอง)
@router.get("/me", response_model=schemas.ProfileOut)
def read_my_profile(
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)
    profile = crud.get_profile_by_user(db, user.id)

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile

# PATCH – UPDATE SOME FIELDS (อัปเดตบางฟิลด์)
@router.patch("/", response_model=schemas.ProfileOut)
def patch_my_profile(
    profile: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)
    db_profile = crud.get_profile_by_user(db, user.id)

    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # ตรวจสอบ username ซ้ำ
    if profile.username:
        username_exists = db.query(models.Profile).filter(
            models.Profile.username == profile.username,
            models.Profile.user_id != user.id
        ).first()
        if username_exists:
            raise HTTPException(status_code=400, detail="Username already taken")

    updated_profile = crud.patch_profile(db, user.id, profile)
    return updated_profile

# PUT – UPDATE ALL FIELDS (อัปเดตฟิลด์ทั้งหมด)
@router.put("/", response_model=schemas.ProfileOut)
def update_my_profile(
    profile: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)
    db_profile = crud.get_profile_by_user(db, user.id)

    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # ตรวจสอบ username ซ้ำ
    if profile.username:
        username_exists = db.query(models.Profile).filter(
            models.Profile.username == profile.username,
            models.Profile.user_id != user.id
        ).first()

        if username_exists:
            raise HTTPException(status_code=400, detail="Username already taken")

    updated_profile = crud.update_profile(db, user.id, profile)
    return updated_profile

# DELETE ACCOUNT (ลบบัญชีตัวเอง)
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # 1) ลบ meal ทั้งหมดของ user
        db.query(models.MealNutrition).filter(
            models.MealNutrition.user_id == user.id
        ).delete(synchronize_session=False)

        # 2) ลบ profile
        profile = crud.get_profile_by_user(db, user.id)
        if profile:
            db.delete(profile)

        # 3) ลบ user
        db.delete(user)

        db.commit()
        return

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Delete account failed: {str(e)}",
        )
