from typing import Literal, Optional
from pydantic import BaseModel, Field

LanguageCode = Literal["en", "ta"]
AssessmentCategory = Literal[
    "Verified", "Contradicted", "Misleading", "Suspicious", "Inconclusive"
]
ConfidenceLevel = Literal["High", "Medium", "Low"]
ModuleType = Literal["news", "image", "video"]


class ExplainableIndicators(BaseModel):
    evidence_strength: str
    source_reliability: str
    model_confidence: str
    forensic_anomalies: str
    verification_status: AssessmentCategory


class EvidenceItem(BaseModel):
    title: str
    publisher: str
    url: str
    stance: Literal["supporting", "contradicting", "contextual"]
    published_date: Optional[str] = None
    snippet: Optional[str] = None
    source_type: Literal["google_fact_check", "google_search_grounding", "submitted_url"]


class NewsAnalyzeRequest(BaseModel):
    input_mode: Literal["article", "headline", "social", "url"] = "article"
    text: Optional[str] = Field(default=None, max_length=25000)
    url: Optional[str] = Field(default=None, max_length=2048)
    evidence_urls: Optional[list[str]] = None
    language: LanguageCode = "en"


class AnalysisResponse(BaseModel):
    analysis_id: str
    created_at: str
    language: LanguageCode
    module: ModuleType
    title: str
    assessment: AssessmentCategory
    confidence: ConfidenceLevel
    summary: str
    explanation: str
    ai_status: Optional[dict] = None
    indicators: ExplainableIndicators
    findings: list[str] = []
    evidence: list[EvidenceItem] = []
    next_steps: list[str] = []
    limitations: list[str] = []
    news_details: Optional[dict] = None
    image_details: Optional[dict] = None
    video_details: Optional[dict] = None
