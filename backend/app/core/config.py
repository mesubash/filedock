from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os
from pathlib import Path


# Get the root directory (parent of backend/)
ROOT_DIR = Path(__file__).parent.parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"
ENV_LOCAL_FILE = ROOT_DIR / ".env.local"

# Determine which env file to use
env_file_to_use = ENV_LOCAL_FILE if ENV_LOCAL_FILE.exists() else ENV_FILE


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(env_file_to_use),
        env_file_encoding='utf-8',
        extra='ignore',
        case_sensitive=False
    )
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


# Initialize settings - will read from os.environ (loaded by dotenv above)
settings = Settings()
