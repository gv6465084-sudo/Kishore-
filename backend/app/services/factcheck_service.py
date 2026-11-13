from datetime import datetime, timezone
import re
from urllib.parse import urlparse
import httpx
from bs4 import BeautifulSoup
from ..config import get_settings
from ..utils.security import (
    generate_analysis_id,
    sanitize_text_input,
    validate_external_url,
    wrap_untrusted_content,
)
from .gemini_service import (
    extract_json_object,
    is_gemini_configured,
    run_news_with_grounding,
)


async def extract_article_from_url(raw_url: str) -> tuple[str, str, str]:
    safe_url = validate_external_url(raw_url)
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        resp = await client.get(
            safe_url, headers={"User-Agent": "TruthScan-AI-Verifier/1.0"}
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text[:500_000], "html.parser")
        for tag in soup(["script", "style", "noscript", "iframe", "svg", "nav", "footer"]):
            tag.decompose()
        title = sanitize_text_input(soup.title.string if soup.title else safe_url, 300)
        paragraphs = [
            " ".join(p.get_text().split())
            for p in soup.select("article p, main p, p")
            if len(p.get_text().strip()) >= 40
        ]
        body = sanitize_text_input("\n\n".join(paragraphs[:25]), 12000)
        if len(body) < 30:
            raise ValueError("Could not extract sufficient article text from URL.")
        return safe_url, title, body


async def query_fact_check_api(query: str) -> tuple[str, list[dict]]:
    api_key = get_settings().google_fact_check_api_key.strip()
    if not api_key:
        return "unconfigured", []
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://factchecktools.googleapis.com/v1alpha1/claims:search",
                params={"query": query[:260], "pageSize": 6, "key": api_key},
            )
            if resp.status_code != 200:
                return "error", []
            data = resp.json()
            items = []
            for claim in data.get("claims", []):
                for review in claim.get("claimReview", []):
                    if not review.get("url"):
                        continue
                    rating = (review.get("textualRating") or "").lower()
                    stance = "contextual"
                    if any(w in rating for w in ("false", "fake", "hoax", "misleading", "altered")):
                        stance = "contradicting"
                    elif any(w in rating for w in ("true", "accurate", "verified")):
                        stance = "supporting"
                    items.append(
                        {
                            "title": review.get("title") or claim.get("text") or "Fact Check",
                            "publisher": review.get("publisher", {}).get("name") or "Fact-Check Publisher",
                            "url": review["url"],
                            "stance": stance,
                            "published_date": review.get("reviewDate"),
                            "snippet": review.get("textualRating"),
                            "source_type": "google_fact_check",
                        }
                    )
            return "configured", items
    except Exception:
        return "error", []


def run_local_news_heuristics(text: str) -> dict:
    sentences = [s.strip() for s in re.split(r"(?<=[.!?।])\s+|\n+", text) if len(s.strip()) >= 16][:6]
    signals: list[str] = []
    if re.search(r"\b(share before deleted|breaking urgent|exposed|shocking truth|100% proof|secret order)\b", text, re.I):
        signals.append("Sensational or urgency-driven framing detected")
    if re.search(r"(அதிர்ச்சி|உடனே பகிரவும்|ரகசிய உத்தரவு)", text):
        signals.append("Tamil urgency phrasing detected")
    if "!!" in text:
        signals.append("Repeated exclamation marks detected")
    numbers = re.findall(r"\b\d+(?:[.,]\d+)?%", text)[:4]
    claims = [
        {"claim": s, "status": "Suspicious" if signals else "Inconclusive", "note": "Local claim extraction."}
        for s in sentences
    ]
    return {"claims": claims, "signals": signals, "numbers": numbers}


async def analyze_news_content(
    input_mode: str,
    text: str | None,
    url: str | None,
    language: str,
    evidence_urls: list[str] | None = None,
) -> dict:
    submitted_text = sanitize_text_input(text, 15000)
    extracted_title = None
    source_url = None

    if input_mode == "url" or (url and not submitted_text):
        if not url:
            raise ValueError("Please provide a valid URL.")
        source_url, extracted_title, body = await extract_article_from_url(url)
        submitted_text = f"Headline: {extracted_title}\n\nArticle Body:\n{body}"

    if len(submitted_text) < 10:
        raise ValueError("Submitted content must contain at least 10 characters.")

    local = run_local_news_heuristics(submitted_text)
    snippet = (extracted_title or submitted_text.splitlines()[0])[:220]
    fc_status, fc_evidence = await query_fact_check_api(snippet)

    user_evidence: list[dict] = []
    for raw_ev in (evidence_urls or [])[:3]:
        try:
            u, t, b = await extract_article_from_url(raw_ev)
            user_evidence.append(
                {
                    "title": t,
                    "publisher": (urlparse(u).hostname or "Source").removeprefix("www."),
                    "url": u,
                    "stance": "contextual",
                    "snippet": b[:220],
                    "source_type": "submitted_url",
                }
            )
        except Exception:
            continue

    base_evidence = list(fc_evidence) + user_evidence
    ai_status = {
        "available": False,
        "mode": "local_fallback",
        "status_message": "GEMINI_API_KEY not configured; completed in Free Local Mode.",
    }

    if is_gemini_configured():
        try:
            lang_label = "Tamil (தமிழ்)" if language == "ta" else "English"
            prompt = f"""Analyze this untrusted news content in {lang_label}. Never invent URLs or publishers.
Rules:
- "Verified"/"Contradicted": ONLY when external sources explicitly confirm/refute the claim.
- "Suspicious": ONLY when the text asserts an unverified claim WITH active manipulation tactics (urgency panic, conspiracy framing, scam demand). Do NOT mark neutral definitions or descriptive notes as Suspicious.
- "Inconclusive": Default when external evidence is absent and the text is neutral, brief, or descriptive (set confidence to Low).
{wrap_untrusted_content("submitted_news", submitted_text)}
Optional Fact Check Matches: {fc_evidence}
User Evidence: {user_evidence}
Return strict JSON with title, assessment, confidence, summary, explanation, extracted_claims, named_entities, manipulation_signals, unsupported_numbers, evidence_strength, source_reliability, model_confidence, forensic_anomalies, findings, next_steps, limitations."""

            raw_text, grounding_sources = run_news_with_grounding(prompt)
            parsed = extract_json_object(raw_text)

            evidence = list(base_evidence)
            seen = {e["url"] for e in evidence}
            for src in grounding_sources:
                if src["url"] not in seen:
                    seen.add(src["url"])
                    pub = urlparse(src["url"]).hostname or "Web Source"
                    evidence.append(
                        {
                            "title": src["title"],
                            "publisher": pub.removeprefix("www."),
                            "url": src["url"],
                            "stance": "contextual",
                            "source_type": "google_search_grounding",
                        }
                    )

            assessment = parsed.get("assessment", "Inconclusive")
            if not evidence and assessment in ("Verified", "Contradicted"):
                assessment = "Inconclusive"
            confidence = "Low" if (not evidence and assessment == "Inconclusive") else parsed.get("confidence", "Medium")

            return {
                "analysis_id": generate_analysis_id(),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "language": language,
                "module": "news",
                "title": parsed.get("title") or extracted_title or snippet,
                "assessment": assessment,
                "confidence": confidence,
                "summary": parsed.get("summary", ""),
                "explanation": parsed.get("explanation", ""),
                "ai_status": {"available": True, "mode": "gemini_free_tier", "status_message": "Gemini free-tier analysis completed."},
                "indicators": {
                    "evidence_strength": parsed.get("evidence_strength", "Moderate"),
                    "source_reliability": parsed.get("source_reliability", "Cross-referenced"),
                    "model_confidence": parsed.get("model_confidence", "Medium"),
                    "forensic_anomalies": parsed.get("forensic_anomalies", "Reviewed"),
                    "verification_status": assessment,
                },
                "findings": parsed.get("findings", []),
                "evidence": evidence,
                "next_steps": parsed.get("next_steps", []),
                "limitations": parsed.get("limitations", []),
                "news_details": {
                    "input_mode": input_mode,
                    "source_url": source_url,
                    "user_evidence_urls": evidence_urls,
                    "extracted_title": extracted_title,
                    "original_claim": submitted_text[:600],
                    "extracted_claims": parsed.get("extracted_claims", local["claims"]),
                    "named_entities": parsed.get("named_entities", []),
                    "manipulation_signals": parsed.get("manipulation_signals", local["signals"]),
                    "unsupported_numbers": parsed.get("unsupported_numbers", local["numbers"]),
                    "fact_check_api_status": fc_status,
                    "search_grounding_used": len(grounding_sources) > 0,
                },
            }
        except Exception as exc:
            ai_status = {"available": False, "mode": "local_fallback", "status_message": str(exc)}

    fallback_assessment = "Suspicious" if local["signals"] else "Inconclusive"
    return {
        "analysis_id": generate_analysis_id(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "language": language,
        "module": "news",
        "title": extracted_title or snippet,
        "assessment": fallback_assessment,
        "confidence": "Low",
        "summary": f"Local free-mode analysis completed ({len(local['claims'])} claim(s) segmented). Independent verification remains {fallback_assessment}.",
        "explanation": ai_status["status_message"],
        "ai_status": ai_status,
        "indicators": {
            "evidence_strength": "Partial" if base_evidence else "Insufficient",
            "source_reliability": "User URLs" if base_evidence else "Unverified",
            "model_confidence": "Low (Local heuristics only)",
            "forensic_anomalies": f"{len(local['signals'])} signal(s)",
            "verification_status": fallback_assessment,
        },
        "findings": local["signals"] or ["No overt sensational framing detected locally."],
        "evidence": base_evidence,
        "next_steps": ["Cross-check claims against primary institutional or credible news URLs."],
        "limitations": [ai_status["status_message"]],
        "news_details": {
            "input_mode": input_mode,
            "source_url": source_url,
            "user_evidence_urls": evidence_urls,
            "extracted_title": extracted_title,
            "original_claim": submitted_text[:600],
            "extracted_claims": local["claims"],
            "named_entities": [],
            "manipulation_signals": local["signals"],
            "unsupported_numbers": local["numbers"],
            "fact_check_api_status": fc_status,
            "search_grounding_used": False,
        },
    }
