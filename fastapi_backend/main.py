# main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base
import models  # โหลด models ก่อน

# ----------- Import Routers -----------
from routers.users import router as users_router
from routers.profile import router as profile_router
from routers.files import router as files_router
from routers.yolo import router as yolo_router
from routers import menu
from routers import meals

# ----------- สร้างตาราง -----------
Base.metadata.create_all(bind=engine)

# ----------- Init App -----------
app = FastAPI(title="Nutrition API", version="1.0.0")

# ----------- CORS -----------
ALLOW_ORIGINS = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------- Static Files (แก้ให้ถูกต้อง) -----------
STATIC_MOUNT = [
    ("/media", "media"),
    ("/uploads", "uploads"),
    ("/results", "results"),
]

for mount_path, folder in STATIC_MOUNT:
    if os.path.isdir(folder):
        app.mount(mount_path, StaticFiles(directory=folder), name=mount_path.strip("/"))

# ----------- Register Routers -----------
app.include_router(users_router)
app.include_router(profile_router)
app.include_router(files_router)
app.include_router(yolo_router)
app.include_router(menu.router)
app.include_router(meals.router)

# ----------- Health Check -----------
@app.get("/healthz", tags=["health"])
def healthz():
    return {"ok": True}

@app.get("/", include_in_schema=False)
def root():
    return {"message": "OK", "docs": "/docs"}

# ----------- Dev Mode -----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
