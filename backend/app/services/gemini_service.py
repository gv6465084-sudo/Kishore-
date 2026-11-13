import json
import re
from typing import Any
from google import genai
from google.genai import types
from ..config import get_settings

MODEL_ID = "gemini-4-hydrogen"


def is_gemini_configured() -> bool:
    key = get_settings().gemini_api_key.strip()
    return bool(key and key != "MY_GEMINI_API_KEY")


def get_client() -> genai.Client:
    settings = get_settings()
    if not is_gemini_configured():
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    return genai.Client(api_key=settings.gemini_api_key)


def extract_json_object(raw_text: str | None) -> dict[str, Any]:
    text = (raw_text or "").strip()
    if not text:
        raise ValueError("Empty response received from Gemini model.")
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.IGNORECASE)
    candidate = match.group(1).strip() if match else text
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        start = candidate.find("{")
        end = candidate.rfind("}")
        if start != -1 and end > start:
            return json.loads(candidate[start : end + 1])
        raise


FREE_FALLBACK_MODEL_ID = "gemini-3.1-flash-lite"


def _is_quota_error(exc: Exception) -> bool:
    msg = str(exc).upper()
    return "429" in msg or "RESOURCE_EXHAUSTED" in msg or "QUOTA" in msg


def run_news_with_grounding(prompt: str) -> tuple[str, list[dict[str, str]]]:
    client = get_client()
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                seed=42,
            ),
        )
        sources: list[dict[str, str]] = []
        seen: set[str] = set()
        candidates = getattr(response, "candidates", None) or []
        if candidates:
            gm = getattr(candidates[0], "grounding_metadata", None)
            chunks = getattr(gm, "grounding_chunks", None) or []
            for chunk in chunks:
                web = getattr(chunk, "web", None)
                uri = getattr(web, "uri", None) if web else None
                title = getattr(web, "title", None) if web else None
                if uri and uri not in seen:
                    seen.add(uri)
                    sources.append({"title": title or uri, "url": uri})
        return response.text or "", sources
    except Exception as exc:
        if not _is_quota_error(exc):
            raise
        fallback_prompt = (
            f"{prompt}\n\nNOTE: Live Google Search Grounding is quota-limited. "
            "Do NOT invent URLs or citations. Set assessment to Inconclusive or Suspicious "
            "if no external Fact Check or user-supplied URLs exist."
        )
        try:
            resp = client.models.generate_content(
                model=MODEL_ID,
                contents=fallback_prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json", seed=42),
            )
            return resp.text or "", []
        except Exception as inner_exc:
            if not _is_quota_error(inner_exc):
                raise
            resp = client.models.generate_content(
                model=FREE_FALLBACK_MODEL_ID,
                contents=fallback_prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json", seed=42),
            )
            return resp.text or "", []


def run_multimodal_json(parts: list[Any], system_instruction: str) -> dict[str, Any]:
    client = get_client()
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=parts,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                seed=42,
            ),
        )
        return extract_json_object(response.text)
    except Exception as exc:
        if not _is_quota_error(exc):
            raise
        response = client.models.generate_content(
            model=FREE_FALLBACK_MODEL_ID,
            contents=parts,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                seed=42,
            ),
        )
        return extract_json_object(response.text)
