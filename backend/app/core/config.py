from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/filemanager"
    
    # JWT
    SECRET_KEY: str = "your-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Garage/S3 Storage
    STORAGE_ENDPOINT: str = "https://garage.rivetsoft.com"
    STORAGE_ACCESS_KEY: str = ""
    STORAGE_SECRET_KEY: str = ""
    STORAGE_BUCKET: str = "hgn"
    STORAGE_REGION: str = "garage"
    STORAGE_PREFIX: str = "filedock"  # Main folder inside bucket
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    
    class Config:
        # Load .env first, then .env.local can override
        # pydantic-settings loads from env_file
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra fields in .env


# Check if .env.local exists and load it to override
env_file = ".env"
if os.path.exists(".env.local"):
    env_file = ".env.local"
elif os.path.exists("backend/.env"):
    env_file = "backend/.env"

settings = Settings(_env_file=env_file)
