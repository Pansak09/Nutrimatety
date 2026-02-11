# config.py
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS: str = "*"

    ADMIN_EMAILS: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

def cors_origin_list() -> List[str]:
    if settings.CORS_ORIGINS.strip() == "*":
        return ["*"]
    return [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

def admin_email_list() -> List[str]:
    return [e.strip().lower() for e in settings.ADMIN_EMAILS.split(",") if e.strip()]
