from typing import Tuple


def verify_image_signature(data: bytes) -> Tuple[bool, str, str]:
    if len(data) < 12:
        return False, "unknown", "application/octet-stream"
    if data[:3] == b"\xff\xd8\xff":
        return True, "JPEG", "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return True, "PNG", "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return True, "WebP", "image/webp"
    return False, "unknown", "application/octet-stream"


def verify_video_signature(data: bytes) -> Tuple[bool, str, str]:
    if len(data) < 12:
        return False, "unknown", "application/octet-stream"
    if data[:4] == b"\x1a\x45\xdf\xa3":
        return True, "WebM", "video/webm"
    if data[:4] == b"RIFF" and data[8:12] == b"AVI ":
        return True, "AVI", "video/x-msvideo"
    box_tag = data[4:8]
    if box_tag == b"ftyp":
        brand = data[8:12]
        if brand.startswith(b"qt"):
            return True, "MOV", "video/quicktime"
        if brand == b"M4V ":
            return True, "M4V", "video/x-m4v"
        return True, "MP4", "video/mp4"
    if box_tag in (b"wide", b"free", b"skip", b"moov", b"mdat") or b"ftyp" in data[:64]:
        is_mov = box_tag == b"wide"
        return True, ("MOV" if is_mov else "MP4"), ("video/quicktime" if is_mov else "video/mp4")
    return False, "unknown", "application/octet-stream"
