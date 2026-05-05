import os
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    MONGO_URI: str = os.environ.get("MONGO_URI", "mongodb://localhost:27017/medflow")
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "cambia-esto-en-produccion-min-32-chars")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://host.docker.internal:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()