import base64
from datetime import datetime, timezone
import io
import cv2
import numpy as np
from PIL import ExifTags, Image, ImageChops, ImageFile, ImageOps

ImageFile.LOAD_TRUNCATED_IMAGES = True
from google.genai import types
from ..utils.file_validation import verify_image_signature
from ..utils.security import generate_analysis_id
from .gemini_service import is_gemini_configured, run_multimodal_json


def compute_ela(img: Image.Image) -> tuple[str, str, dict]:
    rgb = img.convert("RGB")
    rgb.thumbnail((768, 768))

    orig_buf = io.BytesIO()
    rgb.save(orig_buf, format="PNG")
    preview_b64 = base64.b64encode(orig_buf.getvalue()).decode("ascii")

    recomp_buf = io.BytesIO()
    rgb.save(recomp_buf, format="JPEG", quality=90)
    recomp_buf.seek(0)
    recomp_img = Image.open(recomp_buf).convert("RGB")

    diff = ImageChops.difference(rgb, recomp_img)
    arr = np.asarray(diff, dtype=np.float32)
    mean_diff = float(np.mean(arr))
    max_diff = float(np.max(arr))
    high_ratio = float(np.mean(np.mean(arr, axis=2) > 12) * 100.0)

    # OpenCV sharpness/Laplacian variance metric as an additional local forensic signal
    gray_cv = cv2.cvtColor(np.asarray(rgb), cv2.COLOR_RGB2GRAY)
    laplacian_var = round(float(cv2.Laplacian(gray_cv, cv2.CV_64F).var()), 2)

    extrema = diff.getextrema()
    max_val = max([e[1] for e in extrema]) or 1
    scale = 255.0 / max_val
    enhanced = diff.point(lambda x: min(255, int(x * min(scale, 12))))

    ela_buf = io.BytesIO()
    enhanced.save(ela_buf, format="PNG")
    ela_b64 = base64.b64encode(ela_buf.getvalue()).decode("ascii")

    return (
        f"data:image/png;base64,{preview_b64}",
        f"data:image/png;base64,{ela_b64}",
        {
            "mean_difference": round(mean_diff, 2),
            "max_difference": round(max_diff, 2),
            "high_variance_ratio": round(high_ratio, 2),
            "laplacian_sharpness": laplacian_var,
            "interpretation_note": "Error Level Analysis is an exploratory visual aid only and is not standalone proof of manipulation.",
        },
    )


async def analyze_image_bytes(data: bytes, filename: str, language: str) -> dict:
    valid, fmt, mime = verify_image_signature(data)
    if not valid:
        raise ValueError("Invalid image signature. Allowed formats: JPG, JPEG, PNG, WebP.")

    img = ImageOps.exif_transpose(Image.open(io.BytesIO(data)))
    width, height = img.size
    bits_per_pixel = round((len(data) * 8) / max(1, width * height), 2)

    exif_summary: dict[str, str] = {}
    raw_exif = img.getexif()
    if raw_exif:
        for tag_id, val in raw_exif.items():
            tag_name = str(ExifTags.TAGS.get(tag_id, tag_id))
            exif_summary[tag_name] = str(val)[:120]

    preview_url, ela_url, ela_stats = compute_ela(img)
    specialised_detector = {
        "available": False,
        "status_message": "Specialised AI-generated image classifier is not configured in Free Mode.",
    }
    local_findings = [
        f"{fmt} · {width}×{height} px · {bits_per_pixel} bpp",
        "EXIF tags present" if exif_summary else "EXIF headers absent",
        f"ELA mean difference: {ela_stats['mean_difference']}, high-variance: {ela_stats['high_variance_ratio']}%",
    ]

    ai_status = {
        "available": False,
        "mode": "local_fallback",
        "status_message": "GEMINI_API_KEY not configured; local Pillow/OpenCV image forensics completed.",
    }

    if is_gemini_configured():
        try:
            jpeg_buf = io.BytesIO()
            resized = img.convert("RGB")
            resized.thumbnail((1280, 1280))
            resized.save(jpeg_buf, format="JPEG", quality=88)

            lang_label = "Tamil (தமிழ்)" if language == "ta" else "English"
            parsed = run_multimodal_json(
                [
                    types.Part.from_bytes(data=jpeg_buf.getvalue(), mime_type="image/jpeg"),
                    f"Inspect this {fmt} image ({width}x{height}), EXIF present: {bool(exif_summary)}, ELA stats: {ela_stats}. Respond in {lang_label} JSON.",
                ],
                "You are a cautious digital image forensics specialist. Never treat missing EXIF or ELA alone as proof of tampering, and never claim definitive AI-generated detection without a validated classifier.",
            )

            assessment = parsed.get("assessment", "Inconclusive")
            if assessment not in ("Suspicious", "Inconclusive", "Misleading"):
                assessment = "Inconclusive"

            return {
                "analysis_id": generate_analysis_id(),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "language": language,
                "module": "image",
                "title": filename,
                "assessment": assessment,
                "confidence": parsed.get("confidence", "Medium"),
                "summary": parsed.get("summary", ""),
                "explanation": parsed.get("explanation", ""),
                "ai_status": {"available": True, "mode": "gemini_free_tier", "status_message": "Gemini free-tier visual inspection completed."},
                "indicators": {
                    "evidence_strength": parsed.get("evidence_strength", "Exploratory"),
                    "source_reliability": parsed.get("source_reliability", "EXIF Inspected"),
                    "model_confidence": parsed.get("model_confidence", "Medium"),
                    "forensic_anomalies": parsed.get("forensic_anomalies", "ELA & visual check"),
                    "verification_status": assessment,
                },
                "findings": local_findings + parsed.get("visual_inconsistencies", []),
                "evidence": [],
                "next_steps": parsed.get("next_steps", []),
                "limitations": parsed.get("limitations", []),
                "image_details": {
                    "filename": filename,
                    "mime_type": mime,
                    "file_size_bytes": len(data),
                    "format": fmt,
                    "width": width,
                    "height": height,
                    "bits_per_pixel": bits_per_pixel,
                    "has_exif": bool(exif_summary),
                    "exif_summary": exif_summary,
                    "ela_heatmap_data_url": ela_url,
                    "original_preview_data_url": preview_url,
                    "ela_stats": ela_stats,
                    "specialised_detector": specialised_detector,
                },
            }
        except Exception as exc:
            ai_status = {"available": False, "mode": "local_fallback", "status_message": str(exc)}

    return {
        "analysis_id": generate_analysis_id(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "language": language,
        "module": "image",
        "title": filename,
        "assessment": "Inconclusive",
        "confidence": "Low",
        "summary": f"Local Pillow & OpenCV forensics completed ({fmt}, {width}×{height} px). Authenticity remains Inconclusive.",
        "explanation": f"{ai_status['status_message']} {ela_stats['interpretation_note']}",
        "ai_status": ai_status,
        "indicators": {
            "evidence_strength": "Local Metadata & ELA Only",
            "source_reliability": "EXIF Present" if exif_summary else "EXIF Absent",
            "model_confidence": "Low (Local forensics only)",
            "forensic_anomalies": f"{ela_stats['high_variance_ratio']}% ELA variance",
            "verification_status": "Inconclusive",
        },
        "findings": local_findings,
        "evidence": [],
        "next_steps": ["Request original camera RAW/file or perform manual reverse image search."],
        "limitations": [ai_status["status_message"], specialised_detector["status_message"], ela_stats["interpretation_note"]],
        "image_details": {
            "filename": filename,
            "mime_type": mime,
            "file_size_bytes": len(data),
            "format": fmt,
            "width": width,
            "height": height,
            "bits_per_pixel": bits_per_pixel,
            "has_exif": bool(exif_summary),
            "exif_summary": exif_summary,
            "ela_heatmap_data_url": ela_url,
            "original_preview_data_url": preview_url,
            "ela_stats": ela_stats,
            "specialised_detector": specialised_detector,
        },
    }
