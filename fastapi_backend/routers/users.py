# routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import crud
from schemas import UserCreate, UserOut, UserLogin, Token
from auth import verify_password, create_access_token, get_current_user_email
from database import get_db

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    db_user = crud.create_user(db, user)
    token = create_access_token(sub=db_user.email)
    return {
        "user": {"id": db_user.id, "email": db_user.email},
        "access_token": token,
        "token_type": "bearer",
    }

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user.email)
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password",
                            headers={"WWW-Authenticate": "Bearer"})
    token = create_access_token(sub=db_user.email)
    return {"access_token": token, "token_type": "bearer"}

@router.get("/protected")
def protected_route(
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email)
):
    user = crud.get_user_by_email(db, current_email)
    return {"message": f"Hello, {user.email}! This is a protected route."}

@router.get("/me", response_model=UserOut)
def read_me(
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email),
):
    user = crud.get_user_by_email(db, current_email)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    return user