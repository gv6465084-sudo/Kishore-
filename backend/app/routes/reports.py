import io
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from ..schemas.analysis import AnalysisResponse

router = APIRouter(prefix="/api/report", tags=["reports"])


@router.post("/json")
def export_json(result: AnalysisResponse):
    payload = {"platform": "TruthScan AI", **result.model_dump()}
    return Response(
        content=json.dumps(payload, indent=2, ensure_ascii=False),
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="truthscan-{result.analysis_id}.json"'
        },
    )


@router.post("/markdown")
def export_markdown(result: AnalysisResponse):
    lines = [
        "# TruthScan AI — Verification Report",
        f"- **Analysis ID:** {result.analysis_id}",
        f"- **Date:** {result.created_at}",
        f"- **Assessment:** {result.assessment} ({result.confidence})",
        "",
        "## Summary",
        result.summary,
        "",
        "## Explanation",
        result.explanation,
    ]
    return Response(
        content="\n".join(lines),
        media_type="text/markdown; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="truthscan-{result.analysis_id}.md"'
        },
    )


@router.post("/pdf")
def export_pdf(result: AnalysisResponse):
    try:
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(48, 790, "TruthScan AI - Verification Report")
        c.setFont("Helvetica", 10)
        c.drawString(48, 770, f"ID: {result.analysis_id} | Assessment: {result.assessment} ({result.confidence})")
        c.drawString(48, 750, f"Subject: {result.title[:80]}")
        text_obj = c.beginText(48, 720)
        text_obj.textLines(result.summary[:900])
        c.drawText(text_obj)
        c.showPage()
        c.save()
        return Response(
            content=buf.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="truthscan-{result.analysis_id}.pdf"'
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
