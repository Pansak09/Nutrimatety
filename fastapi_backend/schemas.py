# schemas.py
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import date, datetime
from typing import Optional


# -----------------------
# User / Auth
# -----------------------
class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# -----------------------
# Profile (New Updated)
# -----------------------
class ProfileBase(BaseModel):
    username: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    height: Optional[int] = None
    current_weight: Optional[int] = None
    target_weight: Optional[int] = None
    goal: Optional[str] = None
    food_allergies: Optional[str] = None
    avatar_url: Optional[str] = None
    lifestyle: Optional[str] = "light"

class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(ProfileBase):
    pass


class ProfileOut(ProfileBase):
    id: int
    user_id: int
    bmi: Optional[float] = None
    bmr: Optional[int] = None
    tdee: Optional[int] = None
    protein_target: Optional[int] = None
    carb_target: Optional[int] = None
    fat_target: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)



# -----------------------
# Meal Nutrition (Menu)
# -----------------------
class MenuOut(BaseModel):
    food_name: str
    food_name_en: Optional[str] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbs: Optional[float] = None
    calories: Optional[float] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


# -----------------------
# Meals
# -----------------------
class MealCreate(BaseModel):
    name: str
    protein: Optional[float] = 0
    fat: Optional[float] = 0
    carb: Optional[float] = 0
    calories: Optional[float] = 0
    meal_time: str
    image_url: Optional[str] = None


class MealUpdate(BaseModel):
    name: Optional[str] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carb: Optional[float] = None
    calories: Optional[float] = None
    meal_time: Optional[str] = None
    image_url: Optional[str] = None


class MealOut(BaseModel):
    id: int
    name: str
    protein: Optional[float] = 0
    fat: Optional[float] = 0
    carb: Optional[float] = 0
    calories: Optional[float] = 0
    meal_time: str
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
