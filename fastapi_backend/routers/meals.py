from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import date

from database import get_db
from models import MealNutrition, Menu
from schemas import MealCreate, MealOut, MealUpdate
from auth import get_current_user_email
import crud

router = APIRouter(prefix="/meals", tags=["meals"])


# ------------------------------------------------------------------------------
# Create Meal (ใช้ menu_id เต็มรูปแบบ)
# ------------------------------------------------------------------------------
@router.post("", response_model=MealOut)
def create_meal(
    payload: MealCreate,
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # normalize ชื่ออาหาร
    food_name = payload.name.strip()
    food_name_lower = food_name.lower()

    try:
        # หา menu
        menu = (
            db.query(Menu)
            .filter(func.lower(Menu.food_name) == food_name_lower)
            .first()
        )

        # ไม่เจอ → สร้าง menu
        if not menu:
            menu = Menu(
                food_name=food_name,
                calories=payload.calories,
                protein=payload.protein,
                carb=payload.carb,
                fat=payload.fat,
            )
            db.add(menu)
            db.flush()  # ได้ menu.id โดยไม่ commit

        # บันทึก meal
        meal = MealNutrition(
            user_id=user.id,
            menu_id=menu.id,
            name=menu.food_name,
            calories=payload.calories,
            protein=payload.protein,
            carb=payload.carb,
            fat=payload.fat,
            meal_time=payload.meal_time,
            image_url=payload.image_url,
        )

        db.add(meal)
        db.commit()
        db.refresh(meal)
        return meal

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Create meal failed: {str(e)}",
        )


# ------------------------------------------------------------------------------
# Get meals by date
# ------------------------------------------------------------------------------
@router.get("", response_model=List[MealOut])
def get_meals(
    date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)

    query = (
        db.query(MealNutrition)
        .filter(MealNutrition.user_id == user.id)
    )

    if date:
        # PostgreSQL-safe
        query = query.filter(func.date(MealNutrition.created_at) == date)

    return query.order_by(MealNutrition.created_at.desc()).all()


# ------------------------------------------------------------------------------
# Update Meal (ไม่แก้ menu)
# ------------------------------------------------------------------------------
@router.patch("/{meal_id}", response_model=MealOut)
def update_meal(
    meal_id: int,
    payload: MealUpdate,
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)

    meal = (
        db.query(MealNutrition)
        .filter(
            MealNutrition.id == meal_id,
            MealNutrition.user_id == user.id,
        )
        .first()
    )

    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(meal, field, value)

    db.commit()
    db.refresh(meal)
    return meal


# ------------------------------------------------------------------------------
# Delete Meal
# ------------------------------------------------------------------------------
@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)

    meal = (
        db.query(MealNutrition)
        .filter(
            MealNutrition.id == meal_id,
            MealNutrition.user_id == user.id,
        )
        .first()
    )

    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    db.delete(meal)
    db.commit()


# ------------------------------------------------------------------------------
# Get meal dates (History)
# ------------------------------------------------------------------------------
@router.get("/dates")
def get_meal_dates(
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)

    rows = (
        db.query(func.date(MealNutrition.created_at).label("d"))
        .filter(MealNutrition.user_id == user.id)
        .group_by("d")
        .order_by(desc("d"))
        .all()
    )

    return [str(r.d) for r in rows]
