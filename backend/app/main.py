import shutil
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .routes import image, news, reports, video
from .services.gemini_service import is_gemini_configured

settings = get_settings()

origins = list(settings.allowed_origins)
if settings.app_url:
    origins.append(settings.app_url)
if not origins:
    origins = ["*"]

app = FastAPI(
    title="TruthScan AI Backend",
    version="1.0.0",
    description="Free-tier, privacy-first ephemeral verification API for news, images, and videos.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://[a-z0-9-]+\.(run\.app|vercel\.app|onrender\.com|pages\.dev|netlify\.app)$",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

app.include_router(news.router)
app.include_router(image.router)
app.include_router(video.router)
app.include_router(reports.router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "free_mode": True,
        "privacy_mode": "ephemeral_no_storage",
        "capabilities": {
            "gemini_configured": is_gemini_configured(),
            "fact_check_api_configured": bool(settings.google_fact_check_api_key.strip()),
            "local_forensics_available": True,
            "ffmpeg_available": shutil.which("ffmpeg") is not None,
        },
        "supported_languages": ["en", "ta"],
    }


@app.get("/api/config/languages")
def get_languages():
    return {
        "default": "en",
        "supported": [
            {"code": "en", "label": "English", "native_label": "English"},
            {"code": "ta", "label": "Tamil", "native_label": "தமிழ்"},
        ],
    }


@app.get("/api/config/modules")
def get_modules():
    return {
        "free_mode": True,
        "max_upload_bytes": settings.max_upload_bytes,
        "max_upload_mb": 20,
        "modules": [
            {"id": "news", "name": "NewsCheck", "languages": ["en", "ta"]},
            {
                "id": "image",
                "name": "ImageCheck",
                "accepted_formats": ["JPG", "JPEG", "PNG", "WebP"],
                "local_forensics_available": True,
                "specialised_detector_configured": False,
            },
            {
                "id": "video",
                "name": "VideoCheck",
                "accepted_formats": ["MP4", "MOV", "WEBM", "M4V"],
                "ffmpeg_available": shutil.which("ffmpeg") is not None,
                "specialised_deepfake_configured": False,
            },
        ],
    }
