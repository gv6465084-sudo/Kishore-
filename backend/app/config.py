from functools import lru_cache
import os
from pydantic import BaseModel


class Settings(BaseModel):
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    google_fact_check_api_key: str = os.getenv("GOOGLE_FACT_CHECK_API_KEY", "")
    app_url: str = os.getenv("APP_URL", "")
    allowed_origins: list[str] = [
        o.strip()
        for o in os.getenv("ALLOWED_ORIGINS", "").split(",")
        if o.strip()
    ]
    max_upload_bytes: int = 20 * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
