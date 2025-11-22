from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import cast, Date, desc
from typing import List, Optional
from datetime import date

from database import get_db
from models import MealNutrition
from schemas import MealCreate, MealOut, MealUpdate
from auth import get_current_user_email
import crud

router = APIRouter(prefix="/meals", tags=["meals"])


# 🟢 Create meal — Automatically attach user_id
@router.post("", response_model=MealOut)
def create_meal(
    payload: MealCreate,
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)

    meal = MealNutrition(
        user_id=user.id,
        **payload.dict()
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal


# 🟢 Get meals for CURRENT user only
@router.get("", response_model=List[MealOut])
def get_meals(
    date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)

    query = db.query(MealNutrition).filter(MealNutrition.user_id == user.id)

    if date:
        query = query.filter(cast(MealNutrition.created_at, Date) == date)

    meals = query.order_by(MealNutrition.created_at.desc()).all()
    return meals


# 🟢 Delete meal (only owner can delete)
@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)

    meal = (
        db.query(MealNutrition)
        .filter(MealNutrition.id == meal_id, MealNutrition.user_id == user.id)
        .first()
    )

    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    try:
        db.delete(meal)
        db.commit()
    except:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error deleting meal")


# 🟢 Update meal — only owner's meal
@router.put("/{meal_id}", response_model=MealOut)
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
        .filter(MealNutrition.id == meal_id, MealNutrition.user_id == user.id)
        .first()
    )

    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    update_data = payload.dict(exclude_unset=True)
    try:
        for field, value in update_data.items():
            setattr(meal, field, value)

        db.commit()
        db.refresh(meal)
        return meal

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating meal: {str(e)}")


# 🟢 Get unique dates (user only)
@router.get("/dates")
def get_meal_dates(
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)

    rows = (
        db.query(cast(MealNutrition.created_at, Date).label("d"))
        .filter(MealNutrition.user_id == user.id)
        .group_by("d")
        .order_by(desc("d"))
        .all()
    )

    return [str(r.d) for r in rows]
