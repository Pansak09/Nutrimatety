from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func,case
from datetime import datetime, timedelta, date

from database import get_db
from models import MealNutrition, Profile
from auth import get_current_user_email
import crud


router = APIRouter(prefix="/analytics", tags=["analytics"])

# ==============================
# CONFIG
# ==============================
DAYS_RANGE = 7
DIFF_THRESHOLD = 20  # ±20%

# ==============================
# Helper: คำนวณอายุ
# ==============================
def calculate_age(dob: date):
    if not dob:
        return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

# ==============================
# Helper: เป้าหมาย -> กลุ่มโภชนาการ
# ==============================
def map_goal_to_nutrition_group(goal: str):
    if goal == "ลดน้ำหนัก":
        return "low_calorie"
    elif goal == "เพิ่มน้ำหนัก":
        return "high_calorie"
    else:
        return "maintenance"

# ==============================
# Helper: สร้าง CASE expression สำหรับ SQL
# ==============================
def goal_group_case_expr():
    return case(
        (Profile.goal == "ลดน้ำหนัก", "low_calorie"),
        (Profile.goal == "เพิ่มน้ำหนัก", "high_calorie"),
        else_="maintenance",
    )


# ==============================
# Helper: แบ่งช่วงอายุ (Peer Group)
# ==============================
def get_age_range(age: int):
    if age < 15:
        return None, None   # หรือจะ raise error ก็ได้
    elif age <= 18:
        return 15, 18       # วัยรุ่น
    elif age <= 29:
        return 19, 29       # ผู้ใหญ่ตอนต้น
    elif age <= 39:
        return 30, 39       # วัยทำงาน
    elif age <= 49:
        return 40, 49       # กลางคน
    elif age <= 59:
        return 50, 59       # ก่อนสูงอายุ
    else:
        return 60, 120      # ผู้สูงอายุ

# ==============================
# Helper: วิเคราะห์ diff %
# ==============================
def analyze_diff(user_avg: float, group_avg: float, group_count: int):
    if group_count < 3 or not group_avg:
        return {
            "user_avg": round(user_avg or 0, 2),
            "group_avg": round(group_avg or 0, 2),
            "diff_percent": 0,
            "status": "unknown",
            "reason": "not_enough_group_data",
        }

    diff_percent = ((user_avg - group_avg) / group_avg) * 100

    if diff_percent >= DIFF_THRESHOLD:
        status = "above_group"
    elif diff_percent <= -DIFF_THRESHOLD:
        status = "below_group"
    else:
        status = "normal"

    return {
        "user_avg": round(user_avg, 2),
        "group_avg": round(group_avg, 2),
        "diff_percent": round(diff_percent, 2),
        "status": status,
    }

# ==============================
# Endpoint: Nutrition Behavior (7 วันล่าสุด)
# ==============================
@router.get("/nutrition-behavior")
def nutrition_behavior_analysis(
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    # ---------- user ----------
    user = crud.get_user_by_email(db, current_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ---------- profile ----------
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if not profile.date_of_birth:
        raise HTTPException(status_code=400, detail="Date of birth not set in profile")

    if not profile.goal:
        raise HTTPException(status_code=400, detail="Goal not set in profile")

    age = calculate_age(profile.date_of_birth)
    if age is None:
        raise HTTPException(status_code=400, detail="Invalid date_of_birth")

    age_min, age_max = get_age_range(age)
    if age_min is None:
        raise HTTPException(
            status_code=400,
            detail="Age must be 15 years or older to use analytics"
        )

    since_date = datetime.now() - timedelta(days=DAYS_RANGE)

    user_goal_group = map_goal_to_nutrition_group(profile.goal)
    group_goal_expr = goal_group_case_expr()

    # ==========================
    # AVG: user
    # ==========================
    def avg_user(column):
        return (
            db.query(func.avg(column))
            .filter(
                MealNutrition.user_id == user.id,
                MealNutrition.created_at >= since_date,
            )
            .scalar()
            or 0
        )

    # ==========================
    # AVG + COUNT: group (peer) + goal
    # ==========================
    def avg_group(column):
        q = (
            db.query(func.avg(column), func.count(MealNutrition.id))
            .join(Profile, MealNutrition.user_id == Profile.user_id)
            .filter(
                Profile.user_id != user.id,  # ตัดตัวเองออก
                Profile.gender == profile.gender,
                Profile.lifestyle == profile.lifestyle,
                Profile.date_of_birth.isnot(None),
                Profile.goal.isnot(None),
                group_goal_expr == user_goal_group,  # ✅ เป้าหมายสุขภาพร่วมแบ่งกลุ่ม
                func.date_part("year", func.age(Profile.date_of_birth)).between(age_min, age_max),
                MealNutrition.created_at >= since_date,
            )
            .first()
        )
        return (q[0] or 0), (q[1] or 0)

    # ==========================
    # CALCULATE
    # ==========================
    cal_user = avg_user(MealNutrition.calories)
    cal_group, cal_count = avg_group(MealNutrition.calories)

    protein_user = avg_user(MealNutrition.protein)
    protein_group, protein_count = avg_group(MealNutrition.protein)

    carb_user = avg_user(MealNutrition.carb)
    carb_group, carb_count = avg_group(MealNutrition.carb)

    fat_user = avg_user(MealNutrition.fat)
    fat_group, fat_count = avg_group(MealNutrition.fat)

    # ==========================
    # RESPONSE
    # ==========================
    return {
        "period": f"last_{DAYS_RANGE}_days",
        "peer_group": {
            "gender": profile.gender,
            "lifestyle": profile.lifestyle,
            "age_range": f"{age_min}-{age_max}",
            "goal": profile.goal,
            "nutrition_group": user_goal_group,
        },
        "calories": analyze_diff(cal_user, cal_group, cal_count),
        "protein": analyze_diff(protein_user, protein_group, protein_count),
        "carb": analyze_diff(carb_user, carb_group, carb_count),
        "fat": analyze_diff(fat_user, fat_group, fat_count),
    }

# ==============================
# Endpoint: Weekly Summary (7 วันล่าสุด) + goal
# ==============================
@router.get("/weekly-summary")
def weekly_summary(
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile or not profile.date_of_birth:
        raise HTTPException(status_code=400, detail="Profile incomplete")

    if not profile.goal:
        raise HTTPException(status_code=400, detail="Goal not set in profile")

    age = calculate_age(profile.date_of_birth)
    
    age_min, age_max = get_age_range(age)
    if age_min is None:
        raise HTTPException(
            status_code=400,
            detail="ผู้ใช้ต้องมีอายุ 15 ปีขึ้นไปจึงจะสามารถใช้งานระบบวิเคราะห์ข้อมูลได้"
        )
        
    since_date = datetime.now() - timedelta(days=DAYS_RANGE)

    user_goal_group = map_goal_to_nutrition_group(profile.goal)
    group_goal_expr = goal_group_case_expr()

    # ---------- helper ----------
    def avg_user(col):
        return (
            db.query(func.avg(col))
            .filter(
                MealNutrition.user_id == user.id,
                MealNutrition.created_at >= since_date,
            )
            .scalar()
            or 0
        )

    def avg_group(col):
        q = (
            db.query(func.avg(col), func.count(MealNutrition.id))
            .join(Profile, MealNutrition.user_id == Profile.user_id)
            .filter(
                Profile.user_id != user.id,
                Profile.gender == profile.gender,
                Profile.lifestyle == profile.lifestyle,
                Profile.goal.isnot(None),
                group_goal_expr == user_goal_group,
                func.date_part("year", func.age(Profile.date_of_birth)).between(age_min, age_max),
                MealNutrition.created_at >= since_date,
            )
            .first()
        )
        return (q[0] or 0), (q[1] or 0)

    metrics = [
        ("พลังงาน", MealNutrition.calories),
        ("โปรตีน", MealNutrition.protein),
        ("คาร์โบไฮเดรต", MealNutrition.carb),
        ("ไขมัน", MealNutrition.fat),
    ]

    alerts = []
    for label, column in metrics:
        u = avg_user(column)
        g, cnt = avg_group(column)

        result = analyze_diff(u, g, cnt)

        if result["status"] in ["above_group", "below_group"]:
            alerts.append({
                "label": label,
                "status": result["status"],
                "diff": abs(result["diff_percent"]),
            })

    # ==========================
    # สร้าง summary 1 บรรทัด
    # ==========================
    if alerts:
        top = sorted(alerts, key=lambda x: x["diff"], reverse=True)[0]
        direction = "สูงกว่ากลุ่มเป้าหมาย" if top["status"] == "above_group" else "ต่ำกว่ากลุ่มเป้าหมาย"

        return {
            "period": f"last_{DAYS_RANGE}_days",
            "summary_type": "warning",
            "peer_group": {
                "gender": profile.gender,
                "lifestyle": profile.lifestyle,
                "age_range": f"{age_min}-{age_max}",
                "goal": profile.goal,
                "nutrition_group": user_goal_group,
            },
            "message": f"สัปดาห์นี้คุณบริโภค{top['label']}{direction} {round(top['diff'])}%",
        }

    return {
        "period": f"last_{DAYS_RANGE}_days",
        "summary_type": "positive",
        "peer_group": {
            "gender": profile.gender,
            "lifestyle": profile.lifestyle,
            "age_range": f"{age_min}-{age_max}",
            "goal": profile.goal,
            "nutrition_group": user_goal_group,
        },
        "message": "สัปดาห์นี้คุณมีพฤติกรรมการกินใกล้เคียงกับกลุ่มเป้าหมาย ดีมาก!",
    }
