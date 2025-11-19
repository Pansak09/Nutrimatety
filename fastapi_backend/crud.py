from sqlalchemy.orm import Session
import models, schemas
from schemas import UserCreate
from auth import get_password_hash
import math
from datetime import date


# ==========================================
# 🔹 Helper Functions สำหรับคำนวณค่าโภชนาการ
# ==========================================

def calculate_age(dob: date):
    if not dob:
        return None
    today = date.today()
    age = today.year - dob.year
    if (today.month, today.day) < (dob.month, dob.day):
        age -= 1
    return age


def calc_bmi(weight, height):
    if not weight or not height:
        return None
    h_m = height / 100
    return round(weight / (h_m * h_m), 1)


def calc_bmr(gender, weight, height, age):
    if not weight or not height or not age:
        return None

    base = 10 * weight + 6.25 * height - 5 * age

    if gender in ["male", "ชาย", "m"]:
        return round(base + 5)
    else:
        return round(base - 161)


def calc_tdee(bmr, lifestyle):
    if not bmr:
        return None

    factor = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "athlete": 1.9,
    }.get(lifestyle, 1.375)

    return round(bmr * factor)


def calc_macro(goal, weight, tdee):
    """คำนวณโปรตีน คาร์บ ไขมันตามเป้าหมายสุขภาพ"""
    if not tdee or not weight:
        return None, None, None

    # Default
    protein_per_kg = 1.4
    fat_ratio = 0.30
    cal_factor = 1.0

    if goal == "ลดน้ำหนัก":
        protein_per_kg = 2.0
        fat_ratio = 0.25
        cal_factor = 0.80
    elif goal == "เพิ่มน้ำหนัก":
        protein_per_kg = 2.2
        fat_ratio = 0.30
        cal_factor = 1.15
    else:
        protein_per_kg = 1.4
        fat_ratio = 0.30
        cal_factor = 1.0

    target_cal = round(tdee * cal_factor)

    protein_g = round(weight * protein_per_kg)
    protein_cal = protein_g * 4

    fat_cal = round(target_cal * fat_ratio)
    fat_g = round(fat_cal / 9)

    carb_cal = target_cal - (protein_cal + fat_cal)
    carb_g = round(carb_cal / 4)

    return protein_g, carb_g, fat_g, target_cal


# ==========================================
# 🔹 User CRUD
# ==========================================
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: UserCreate):
    hashed_pw = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_pw)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# ==========================================
# 🔹 Profile CRUD
# ==========================================
def get_profile_by_user(db: Session, user_id: int):
    return db.query(models.Profile).filter(models.Profile.user_id == user_id).first()


def _apply_health_calculation(profile_dict):
    """ทำให้ backend คำนวณค่า BMR / BMI / TDEE / Macro ให้เอง"""

    gender = profile_dict.get("gender")
    height = profile_dict.get("height")
    current_weight = profile_dict.get("current_weight")
    dob = profile_dict.get("date_of_birth")
    goal = profile_dict.get("goal")
    lifestyle = profile_dict.get("lifestyle", "light")

    # AGE
    age = calculate_age(dob)

    # BMI
    bmi = calc_bmi(current_weight, height)

    # BMR
    bmr = calc_bmr(gender, current_weight, height, age)

    # TDEE
    tdee = calc_tdee(bmr, lifestyle)

    # Macros
    protein_g, carb_g, fat_g, target_cal = calc_macro(goal, current_weight, tdee)

    profile_dict["bmi"] = bmi
    profile_dict["bmr"] = bmr
    profile_dict["tdee"] = tdee

    profile_dict["protein_target"] = protein_g
    profile_dict["carb_target"] = carb_g
    profile_dict["fat_target"] = fat_g
    profile_dict["target_calories"] = target_cal

    return profile_dict


def create_profile(db: Session, user_id: int, data: schemas.ProfileCreate):
    payload = data.model_dump(exclude_unset=False)

    # คำนวณ BMI, BMR, TDEE, Macro
    payload = _apply_health_calculation(payload)

    prof = models.Profile(user_id=user_id, **payload)
    db.add(prof)
    db.commit()
    db.refresh(prof)
    return prof


def patch_profile(db: Session, user_id: int, data: schemas.ProfileUpdate):
    prof = get_profile_by_user(db, user_id)
    if not prof:
        return None

    update_data = data.model_dump(exclude_unset=True)

    # merge
    for k, v in update_data.items():
        setattr(prof, k, v)

    # คำนวณใหม่ (full calculation)
    final_payload = _apply_health_calculation({**prof.__dict__})

    for k, v in final_payload.items():
        setattr(prof, k, v)

    db.commit()
    db.refresh(prof)
    return prof


def update_profile(db: Session, user_id: int, data: schemas.ProfileUpdate):
    prof = get_profile_by_user(db, user_id)
    if not prof:
        return None

    update_data = data.model_dump(exclude_unset=False)

    for k, v in update_data.items():
        setattr(prof, k, v)

    # คำนวณใหม่ทั้งหมด
    final_payload = _apply_health_calculation({**prof.__dict__})
    for k, v in final_payload.items():
        setattr(prof, k, v)

    db.commit()
    db.refresh(prof)
    return prof
