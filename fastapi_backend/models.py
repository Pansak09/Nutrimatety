from sqlalchemy import Column, Integer, String, ForeignKey, Date, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    username = Column(String(150), unique=True, nullable=True)   
    gender = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    height = Column(Integer, nullable=True)
    current_weight = Column(Integer, nullable=True)
    target_weight = Column(Integer, nullable=True)
    target_calories = Column(Integer, nullable=True) 
    
    goal = Column(String, nullable=True)  

    food_allergies = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    profile = relationship(
        "Profile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Menu(Base):
    __tablename__ = "menu"

    id = Column(Integer, primary_key=True, index=True)
    food_name = Column(String, nullable=False)
    food_name_en = Column(String, nullable=True)
    calories = Column(Float, nullable=True)
    protein = Column(Float, nullable=True)
    carbs = Column(Float, nullable=True)
    fat = Column(Float, nullable=True)


class MealNutrition(Base):
    __tablename__ = "meal_nutrition"  

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    protein = Column(Float, nullable=True)
    fat = Column(Float, nullable=True)
    carb = Column(Float, nullable=True)
    calories = Column(Float, nullable=True)
    image_url = Column(String, nullable=True)
    meal_time = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
