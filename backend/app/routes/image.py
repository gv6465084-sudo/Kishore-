from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from ..config import get_settings
from ..services.image_forensics import analyze_image_bytes

router = APIRouter(prefix="/api/image", tags=["image"])


@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    language: str = Form("en"),
):
    settings = get_settings()
    data = await file.read(settings.max_upload_bytes + 1)
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Uploaded image exceeds 20 MB maximum size.")
    try:
        lang = "ta" if language == "ta" else "en"
        return await analyze_image_bytes(data, file.filename or "uploaded-image", lang)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
