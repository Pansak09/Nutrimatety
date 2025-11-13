from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Menu
from schemas import MenuOut 
from sqlalchemy import or_

router = APIRouter()

@router.get("/menu", response_model=List[MenuOut])
def search_menu(search: str = Query(...), db: Session = Depends(get_db)):
    return db.query(Menu).filter(
        or_(
            Menu.food_name.ilike(f"%{search}%"),
            Menu.food_name_en.ilike(f"%{search}%")
        )
    ).all()

