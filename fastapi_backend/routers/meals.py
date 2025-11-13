from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import cast, Date
from typing import List, Optional
from datetime import date

from database import get_db
from models import MealNutrition
from schemas import MealCreate, MealOut, MealUpdate

router = APIRouter(prefix="/meals", tags=["meals"])


# 🟢 Create meal
@router.post("", response_model=MealOut, status_code=status.HTTP_201_CREATED)
def create_meal(payload: MealCreate, db: Session = Depends(get_db)):
    try:
        meal = MealNutrition(**payload.dict())

        db.add(meal)
        db.commit()
        db.refresh(meal)
        return meal
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating meal: {str(e)}")


# 🟢 Get meals (all or by date)
@router.get("", response_model=List[MealOut])
def get_meals(date: Optional[date] = Query(None), db: Session = Depends(get_db)):
    query = db.query(MealNutrition)

    if date:
        query = query.filter(cast(MealNutrition.created_at, Date) == date)

    meals = query.order_by(MealNutrition.created_at.desc()).all()
    return meals


# 🟢 Delete by ID
@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(meal_id: int, db: Session = Depends(get_db)):
    meal = db.query(MealNutrition).filter(MealNutrition.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    db.delete(meal)
    db.commit()
    return


# 🟢 Update meal
@router.put("/{meal_id}", response_model=MealOut)
@router.patch("/{meal_id}", response_model=MealOut)
def update_meal(meal_id: int, payload: MealUpdate, db: Session = Depends(get_db)):
    meal = db.query(MealNutrition).filter(MealNutrition.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    update_data = payload.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(meal, field, value)

    db.commit()
    db.refresh(meal)

    return meal
