from pathlib import Path
from pydantic_settings import BaseSettings

# Root directory of NetSentinel AI project
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "NetSentinel AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = False

    # Directories
    BASE_DIR: Path = PROJECT_ROOT
    DATA_DIR: Path = PROJECT_ROOT / "data"
    UPLOAD_DIR: Path = PROJECT_ROOT / "data" / "uploads"
    MODELS_DIR: Path = PROJECT_ROOT / "artifacts" / "models"
    REPORTS_DIR: Path = PROJECT_ROOT / "reports"
    SAMPLES_DIR: Path = PROJECT_ROOT / "data" / "samples"

    # Database
    DATABASE_URL: str = f"sqlite:///{PROJECT_ROOT / 'data' / 'netsentinel.db'}"

    # CORS - environment-driven so the same app can be reached via LAN or tunnel without editing source
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Limits and Safety
    MAX_UPLOAD_SIZE_MB: int = 100
    MAX_PREVIEW_ROWS: int = 50
    MAX_ANALYSIS_ROWS: int = 150000

    # Optional Gemini Integration
    GEMINI_API_KEY: str | None = None

    class Config:
        env_file = PROJECT_ROOT / ".env"
        extra = "ignore"


settings = Settings()

# Ensure runtime directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
settings.SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
