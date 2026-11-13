from fastapi import APIRouter, HTTPException
from ..schemas.analysis import NewsAnalyzeRequest
from ..services.factcheck_service import analyze_news_content

router = APIRouter(prefix="/api/news", tags=["news"])


@router.post("/analyze")
async def analyze_news(payload: NewsAnalyzeRequest):
    try:
        return await analyze_news_content(
            input_mode=payload.input_mode,
            text=payload.text,
            url=payload.url,
            evidence_urls=payload.evidence_urls,
            language=payload.language,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
