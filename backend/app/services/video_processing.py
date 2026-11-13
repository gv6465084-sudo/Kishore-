import base64
from datetime import datetime, timezone
import io
import json
import subprocess
import cv2
import numpy as np
from PIL import Image
from google.genai import types
from ..utils.cleanup import ephemeral_temp_dir
from ..utils.file_validation import verify_video_signature
from ..utils.security import generate_analysis_id
from .gemini_service import is_gemini_configured, run_multimodal_json


def compute_frame_consistency(frames: list[tuple[float, bytes]]) -> dict:
    if len(frames) < 2:
        return {
            "compared_pairs": 0,
            "mean_frame_delta": 0.0,
            "max_frame_delta": 0.0,
            "summary": "Single frame extracted; frame comparison unavailable.",
        }
    grays = []
    for _, fb in frames:
        arr = np.frombuffer(fb, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
        if img is not None:
            grays.append(cv2.resize(img, (64, 36)).astype(np.float32))
    deltas = [float(np.mean(np.abs(grays[i] - grays[i + 1]))) for i in range(len(grays) - 1)]
    mean_d = round(sum(deltas) / max(1, len(deltas)), 2)
    max_d = round(max(deltas) if deltas else 0.0, 2)
    return {
        "compared_pairs": len(deltas),
        "mean_frame_delta": mean_d,
        "max_frame_delta": max_d,
        "summary": f"Compared {len(deltas)} frame transitions via OpenCV (mean delta: {mean_d}/255, max: {max_d}/255).",
    }


async def analyze_video_bytes(data: bytes, filename: str, language: str) -> dict:
    valid, fmt, mime = verify_video_signature(data)
    if not valid:
        raise ValueError("Unsupported video signature. Allowed: MP4, MOV, WEBM, M4V.")

    with ephemeral_temp_dir("truthscan-video-") as tmp:
        video_path = tmp / f"upload.{fmt.lower()}"
        video_path.write_bytes(data)

        probe_raw = subprocess.check_output(
            ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", str(video_path)],
            timeout=15,
        )
        probe = json.loads(probe_raw)
        v_stream = next((s for s in probe.get("streams", []) if s.get("codec_type") == "video"), None)
        a_stream = next((s for s in probe.get("streams", []) if s.get("codec_type") == "audio"), None)
        if not v_stream:
            raise ValueError("No readable video stream found.")

        duration = round(float(probe.get("format", {}).get("duration", 0.0)), 2)
        if duration > 180:
            raise ValueError("Video exceeds 180-second limit.")

        count = 2 if (0 < duration < 2) else 6
        timestamps = []
        if duration > 0.25:
            usable = max(0.1, duration - 0.08)
            timestamps = [round(((i + 0.5) / count) * usable, 2) for i in range(count)]
        else:
            timestamps = [0.0]

        frames = []
        for i, t in enumerate(timestamps):
            out_path = tmp / f"frame_{i}.jpg"
            subprocess.run(
                ["ffmpeg", "-y", "-ss", str(t), "-i", str(video_path), "-frames:v", "1", "-q:v", "3", "-vf", "scale=640:-2", str(out_path)],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=15,
            )
            if out_path.exists() and out_path.stat().st_size > 0:
                frames.append((t, out_path.read_bytes()))

        if len(frames) < 2:
            seq_pattern = str(tmp / "seq_%02d.jpg")
            subprocess.run(
                ["ffmpeg", "-y", "-i", str(video_path), "-vf", "thumbnail=n=12,scale=640:-2", "-vsync", "vfr", "-frames:v", "6", "-q:v", "3", seq_pattern],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=18,
            )
            seq_files = sorted(tmp.glob("seq_*.jpg"))
            if len(seq_files) > len(frames):
                frames = [
                    (round(((idx + 0.5) / len(seq_files)) * duration, 2) if duration > 0 else float(idx), f.read_bytes())
                    for idx, f in enumerate(seq_files)
                    if f.stat().st_size > 0
                ]

        if not frames:
            zero_path = tmp / "frame_zero.jpg"
            subprocess.run(
                ["ffmpeg", "-y", "-i", str(video_path), "-frames:v", "1", "-q:v", "3", "-vf", "scale=640:-2", str(zero_path)],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=15,
            )
            if zero_path.exists() and zero_path.stat().st_size > 0:
                frames.append((0.0, zero_path.read_bytes()))

        if not frames:
            raise ValueError("Failed to extract video frames.")

        consistency = compute_frame_consistency(frames)

        cols = min(3, len(frames))
        rows = (len(frames) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * 320, rows * 180), (8, 13, 24))
        for idx, (_, fb) in enumerate(frames):
            tile = Image.open(io.BytesIO(fb)).resize((320, 180))
            sheet.paste(tile, ((idx % cols) * 320, (idx // cols) * 180))
        sheet_buf = io.BytesIO()
        sheet.save(sheet_buf, format="JPEG", quality=88)

        frame_items = [
            {
                "timestamp_sec": t,
                "timestamp_label": f"{int(t // 60):02d}:{t % 60:04.1f}",
                "data_url": f"data:image/jpeg;base64,{base64.b64encode(fb).decode('ascii')}",
            }
            for t, fb in frames
        ]
        sheet_url = f"data:image/jpeg;base64,{base64.b64encode(sheet_buf.getvalue()).decode('ascii')}"

        deepfake_track = {
            "available": False,
            "status_message": "Specialised deepfake detection is not configured in Free Mode.",
            "findings": [],
        }

        ai_status = {
            "available": False,
            "mode": "local_fallback",
            "status_message": "GEMINI_API_KEY not configured; local FFmpeg frame extraction and OpenCV comparison completed.",
        }

        if is_gemini_configured():
            try:
                lang_label = "Tamil (தமிழ்)" if language == "ta" else "English"
                parts = [types.Part.from_bytes(data=fb, mime_type="image/jpeg") for _, fb in frames]
                parts.append(
                    f"Analyze these {len(frames)} frames from a {duration}s {fmt} video in {lang_label}. Local OpenCV comparison: {consistency['summary']}. Return JSON with assessment, confidence, summary, explanation, visual_findings, evidence_strength, source_reliability, model_confidence, forensic_anomalies, next_steps, limitations."
                )

                parsed = run_multimodal_json(
                    parts,
                    "You are a video forensics specialist. Never label a video deepfake from a single unusual frame.",
                )

                assessment = parsed.get("assessment", "Inconclusive")
                if assessment not in ("Suspicious", "Inconclusive", "Misleading"):
                    assessment = "Inconclusive"

                return {
                    "analysis_id": generate_analysis_id(),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "language": language,
                    "module": "video",
                    "title": filename,
                    "assessment": assessment,
                    "confidence": parsed.get("confidence", "Medium"),
                    "summary": parsed.get("summary", ""),
                    "explanation": parsed.get("explanation", ""),
                    "ai_status": {"available": True, "mode": "gemini_free_tier", "status_message": "Gemini free-tier frame analysis completed."},
                    "indicators": {
                        "evidence_strength": parsed.get("evidence_strength", "Sampled Frame Sequence"),
                        "source_reliability": parsed.get("source_reliability", fmt),
                        "model_confidence": parsed.get("model_confidence", "Medium"),
                        "forensic_anomalies": parsed.get("forensic_anomalies", consistency["summary"]),
                        "verification_status": assessment,
                    },
                    "findings": [consistency["summary"]] + parsed.get("visual_findings", []),
                    "evidence": [],
                    "next_steps": parsed.get("next_steps", []),
                    "limitations": parsed.get("limitations", []),
                    "video_details": {
                        "filename": filename,
                        "mime_type": mime,
                        "file_size_bytes": len(data),
                        "duration_sec": duration,
                        "resolution": f"{v_stream.get('width', 0)}×{v_stream.get('height', 0)}",
                        "codec": v_stream.get("codec_name", "unknown"),
                        "fps": 0,
                        "has_audio": bool(a_stream),
                        "audio_codec": a_stream.get("codec_name") if a_stream else None,
                        "contact_sheet_data_url": sheet_url,
                        "frames": frame_items,
                        "frame_consistency": consistency,
                        "tracks": {
                            "general_visual_analysis": {
                                "status": "completed",
                                "summary": parsed.get("summary", ""),
                                "findings": [consistency["summary"]] + parsed.get("visual_findings", []),
                            },
                            "specialised_deepfake_detection": deepfake_track,
                            "audio_analysis": {
                                "status": "completed" if a_stream else "no_audio",
                                "summary": "Audio stream metadata inspected." if a_stream else "No audio stream detected.",
                                "findings": [],
                            },
                            "lip_sync_analysis": {
                                "status": "unavailable",
                                "summary": "Dedicated acoustic lip-synchronisation detector is not configured in Free Mode.",
                                "findings": [],
                            },
                        },
                    },
                }
            except Exception as exc:
                ai_status = {"available": False, "mode": "local_fallback", "status_message": str(exc)}

        return {
            "analysis_id": generate_analysis_id(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "language": language,
            "module": "video",
            "title": filename,
            "assessment": "Inconclusive",
            "confidence": "Low",
            "summary": f"Local FFmpeg extraction ({len(frames)} frames) and OpenCV frame comparison completed. Authenticity remains Inconclusive.",
            "explanation": f"{ai_status['status_message']} {consistency['summary']}",
            "ai_status": ai_status,
            "indicators": {
                "evidence_strength": "Local FFmpeg Frames Only",
                "source_reliability": fmt,
                "model_confidence": "Low (Local frame comparison only)",
                "forensic_anomalies": consistency["summary"],
                "verification_status": "Inconclusive",
            },
            "findings": [consistency["summary"]],
            "evidence": [],
            "next_steps": ["Inspect extracted frames visually and verify original upload source."],
            "limitations": [ai_status["status_message"], deepfake_track["status_message"]],
            "video_details": {
                "filename": filename,
                "mime_type": mime,
                "file_size_bytes": len(data),
                "duration_sec": duration,
                "resolution": f"{v_stream.get('width', 0)}×{v_stream.get('height', 0)}",
                "codec": v_stream.get("codec_name", "unknown"),
                "fps": 0,
                "has_audio": bool(a_stream),
                "audio_codec": a_stream.get("codec_name") if a_stream else None,
                "contact_sheet_data_url": sheet_url,
                "frames": frame_items,
                "frame_consistency": consistency,
                "tracks": {
                    "general_visual_analysis": {
                        "status": "local_only",
                        "summary": consistency["summary"],
                        "findings": [consistency["summary"]],
                    },
                    "specialised_deepfake_detection": deepfake_track,
                    "audio_analysis": {
                        "status": "completed" if a_stream else "no_audio",
                        "summary": "Audio stream metadata inspected." if a_stream else "No audio stream detected.",
                        "findings": [],
                    },
                    "lip_sync_analysis": {
                        "status": "unavailable",
                        "summary": "Dedicated acoustic lip-synchronisation detector is not configured in Free Mode.",
                        "findings": [],
                    },
                },
            },
        }
