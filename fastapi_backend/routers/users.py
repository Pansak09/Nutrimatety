#routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import crud
from schemas import UserCreate, UserLogin, Token, RegisterWithProfile
from auth import verify_password, create_access_token, get_current_user_email, get_password_hash
from database import get_db

import models

router = APIRouter(prefix="/users", tags=["users"])

# ------------------------------------------------------------------
# Register (ยังไม่ถือว่าสมัครสมบูรณ์ จนกว่าจะมี profile)
# ------------------------------------------------------------------
@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    db_user = crud.create_user(db, user)
    token = create_access_token(sub=db_user.email)

    return {
        "access_token": token,
        "token_type": "bearer",
    }

# ------------------------------------------------------------------
# Login
# ------------------------------------------------------------------
@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user.email)

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(sub=db_user.email)
    return {"access_token": token, "token_type": "bearer"}

# ------------------------------------------------------------------
# Me (ใช้ตัวนี้ตัวเดียว)
# ------------------------------------------------------------------
@router.get("/me")
def read_me(
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)

    if not user:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {
        "id": user.id,
        "email": user.email,
        "signup_completed": crud.has_profile(db, user.id),
    }

@router.post("/register-with-profile")
def register_with_profile(
    payload: RegisterWithProfile,
    db: Session = Depends(get_db),
):
    try:
        user = crud.get_user_by_email(db, payload.email)

        # ถ้ายังไม่มี user → สร้างใหม่
        if not user:
            hashed_pw = get_password_hash(payload.password)
            user = models.User(
                email=payload.email,
                hashed_password=hashed_pw,
            )
            db.add(user)
            db.flush()

        # ถ้ามี profile แล้ว → ห้ามสมัครซ้ำ
        if crud.has_profile(db, user.id):
            raise HTTPException(
                status_code=400,
                detail="User already completed signup"
            )

        # สร้าง profile
        profile_data = payload.profile.model_dump()
        profile_data = crud._apply_health_calculation(profile_data)

        profile = models.Profile(
            user_id=user.id,
            **profile_data
        )
        db.add(profile)

        db.commit()

        token = create_access_token(sub=user.email)

        return {
            "access_token": token,
            "token_type": "bearer"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))