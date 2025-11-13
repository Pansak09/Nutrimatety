from sqlalchemy.orm import Session
import models, schemas
from schemas import UserCreate
from auth import get_password_hash

# ------------------------
# Users
# ------------------------
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_pw = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_pw)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# ------------------------
# Profiles
# ------------------------
def get_profile_by_user(db: Session, user_id: int):
    return db.query(models.Profile).filter(models.Profile.user_id == user_id).first()

def create_profile(db: Session, user_id: int, data: schemas.ProfileCreate):
    payload = data.model_dump(exclude_unset=False)
    prof = models.Profile(user_id=user_id, **payload)
    db.add(prof)
    db.commit()
    db.refresh(prof)
    return prof

def patch_profile(db: Session, user_id: int, data: schemas.ProfileUpdate):
    prof = get_profile_by_user(db, user_id)
    if not prof:
        return None

    # ✅ update เฉพาะฟิลด์ที่ส่งมา
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(prof, k, v)

    db.commit()
    db.refresh(prof)
    return prof
