import ipaddress
import re
import socket
import uuid
from urllib.parse import urlparse


def generate_analysis_id() -> str:
    return f"TS-{uuid.uuid4().hex[:8].upper()}"


def sanitize_text_input(text: str | None, max_length: int = 25000) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    return cleaned.strip()[:max_length]


def wrap_untrusted_content(label: str, content: str) -> str:
    safe_label = re.sub(r"[^a-zA-Z0-9_-]", "_", label)
    escaped = content.replace("</untrusted_data", "&lt;/untrusted_data")
    return f'<untrusted_data field="{safe_label}">\n{escaped}\n</untrusted_data>'


def validate_external_url(raw_url: str) -> str:
    parsed = urlparse(sanitize_text_input(raw_url, 2048))
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ValueError("Only valid http:// or https:// URLs are allowed.")
    host = parsed.hostname.lower()
    if host in ("localhost", "0.0.0.0", "::1") or host.endswith((".local", ".internal")):
        raise ValueError("Localhost and internal network URLs are blocked.")
    try:
        resolved = socket.gethostbyname(host)
        ip = ipaddress.ip_address(resolved)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise ValueError("Private IP targets are blocked for SSRF protection.")
    except socket.gaierror as exc:
        raise ValueError("Unable to resolve URL hostname.") from exc
    return parsed.geturl()
