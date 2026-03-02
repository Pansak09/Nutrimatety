#routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import crud
from schemas import UserCreate, UserLogin, Token, RegisterWithProfile
from auth import verify_password, create_access_token, get_current_user_email, get_password_hash
from database import get_db

import models

router = APIRouter(prefix="/users", tags=["users"])

# Register (ยังไม่ถือว่าสมัครสมบูรณ์ จนกว่าจะมี profile)
@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return {"ok": True}
    
# Login (ใช้สำหรับ login เข้าสู่ระบบ ถ้าไม่มี profile จะยังไม่ถือว่าสมัครสมบูรณ์)
@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    # ตรวจสอบ email ในระบบว่ามีหรือยัง
    db_user = crud.get_user_by_email(db, user.email)

    # ตรวจสอบ password ว่าถูกต้องหรือไม่
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # ถ้า email และ password ถูกต้อง → สร้าง token ให้เลย
    token = create_access_token(sub=db_user.email)
    return {"access_token": token, "token_type": "bearer"}

# ในการตรวจสอบ token และดึงข้อมูล user ปัจจุบันออกมา ถ้าไม่มี profile จะถือว่ายังสมัครไม่สมบูรณ์)
@router.get("/me")
def read_me(
    # ดึงข้อมูล user ปัจจุบันจาก token แล้วไปดึงข้อมูล user จาก database มาแสดง ถ้าไม่มี profile จะถือว่ายังสมัครไม่สมบูรณ์
    db: Session = Depends(get_db),
    # ดึง email จาก token แล้วไปดึงข้อมูล user จาก database มาแสดง ถ้าไม่มี profile จะถือว่ายังสมัครไม่สมบูรณ์
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)

    # ถ้าไม่มี user หรือไม่มี profile จะถือว่ายังสมัครไม่สมบูรณ์
    if not user:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # ถ้า user มี profile แล้ว ถึงจะถือว่าสมัครสมบูรณ์
    return {
        "id": user.id,
        "email": user.email,
        "signup_completed": crud.has_profile(db, user.id),
    }
    
@router.get("/check-email")
def check_email(
    email: str = Query(...),
    db: Session = Depends(get_db),
):
    exists = crud.get_user_by_email(db, email) is not None
    return {"available": (not exists)}

@router.get("/check-username")
def check_username(
    username: str = Query(..., min_length=3),
    db: Session = Depends(get_db),
):
    u = username.strip()
    exists = (
        db.query(models.Profile)
        .filter(models.Profile.username == u)
        .first()
        is not None
    )
    return {"available": (not exists)}

@router.post("/register-with-profile")
def register_with_profile(payload: RegisterWithProfile, db: Session = Depends(get_db)):
    try:
        # 1) เช็ค email ซ้ำ
        user = crud.get_user_by_email(db, payload.email)
        if user:
            raise HTTPException(status_code=400, detail="มี Gmail นี้ในระบบแล้ว")

        # (ถ้าต้องการเช็ค username ซ้ำด้วย)
        username = (payload.profile.username or "").strip()
        if username:
            exists_username = (
                db.query(models.Profile)
                .filter(models.Profile.username == username)
                .first()
                is not None
            )
            if exists_username:
                raise HTTPException(status_code=400, detail="username ซ้ำ")

        # 2) สร้าง user
        hashed_pw = get_password_hash(payload.password)
        user = models.User(email=payload.email, hashed_password=hashed_pw)
        db.add(user)
        db.flush()

        # 3) สร้าง profile
        profile_data = payload.profile.model_dump()
        profile_data = crud._apply_health_calculation(profile_data)

        profile = models.Profile(user_id=user.id, **profile_data)
        db.add(profile)
        db.commit()

        token = create_access_token(sub=user.email)
        return {"access_token": token, "token_type": "bearer"}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))