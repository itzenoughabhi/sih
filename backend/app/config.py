import os
from typing import List
from pydantic_settings import BaseSettings

# Absolute path to backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

# Prioritize backend/data, fallback to ./data if backend/data doesn't exist
DEFAULT_DATA_DIR = os.path.join(BACKEND_DIR, "data")
if not os.path.exists(DEFAULT_DATA_DIR) and os.path.exists(os.path.join(PROJECT_ROOT, "data")):
    DEFAULT_DATA_DIR = os.path.join(PROJECT_ROOT, "data")

# Prioritize backend/bhusync.db, fallback to root bhusync.db
DEFAULT_DB_FILE = os.path.join(BACKEND_DIR, "bhusync.db")
if not os.path.exists(DEFAULT_DB_FILE) and os.path.exists(os.path.join(PROJECT_ROOT, "bhusync.db")):
    DEFAULT_DB_FILE = os.path.join(PROJECT_ROOT, "bhusync.db")

sqlite_db_path = DEFAULT_DB_FILE.replace("\\", "/")
DEFAULT_DB_URL = f"sqlite:///{sqlite_db_path}"

class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_NAME: str = "BhuSync AI"
    APP_PORT: int = 8000
    SECRET_KEY: str = "bhusync_hackathon_super_secret_key_2026_dev_only"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "*"]
    DATABASE_URL: str = os.environ.get("DATABASE_URL", DEFAULT_DB_URL)
    DEFAULT_PROJECT_CRS: str = "EPSG:4326"
    METRIC_CRS: str = "EPSG:32643"  # UTM 43N default for India
    DATA_DIR: str = os.environ.get("DATA_DIR", DEFAULT_DATA_DIR)
    DEMO_DIR: str = os.environ.get("DEMO_DIR", os.path.join(DEFAULT_DATA_DIR, "demo"))
    UPLOAD_DIR: str = os.environ.get("UPLOAD_DIR", os.path.join(DEFAULT_DATA_DIR, "uploads"))

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.DEMO_DIR, exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

