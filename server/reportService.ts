import PDFDocument from 'pdfkit';
import type { AnalysisResult } from '../src/types/analysis.ts';

export function buildMarkdownReport(result: AnalysisResult): string {
  const lines: string[] = [];
  lines.push(`# TruthScan AI — Verification Report`);
  lines.push(`**Tagline:** Verify the Content. Reveal the Evidence. Protect the Truth.`);
  lines.push('');
  lines.push(`- **Analysis ID:** ${result.analysis_id}`);
  lines.push(`- **Date (UTC):** ${result.created_at}`);
  lines.push(`- **Language:** ${result.language === 'ta' ? 'Tamil (ta)' : 'English (en)'}`);
  lines.push(`- **Module:** ${result.module.toUpperCase()}`);
  lines.push(`- **Subject:** ${result.title}`);
  lines.push(`- **Assessment:** ${result.assessment}`);
  lines.push(`- **Confidence:** ${result.confidence}`);
  lines.push('');
  lines.push(`## Summary`);
  lines.push(result.summary);
  lines.push('');
  lines.push(`## Explainable Indicators`);
  lines.push(`- **Verification Status:** ${result.indicators.verification_status}`);
  lines.push(`- **Evidence Strength:** ${result.indicators.evidence_strength}`);
  lines.push(`- **Source Reliability:** ${result.indicators.source_reliability}`);
  lines.push(`- **Model Confidence:** ${result.indicators.model_confidence}`);
  lines.push(`- **Forensic Anomalies:** ${result.indicators.forensic_anomalies}`);
  lines.push('');
  lines.push(`## Detailed Explanation`);
  lines.push(result.explanation);
  lines.push('');

  if (result.findings.length > 0) {
    lines.push(`## Key Findings`);
    for (const f of result.findings) {
      lines.push(`- ${f}`);
    }
    lines.push('');
  }

  if (result.evidence.length > 0) {
    lines.push(`## Evidence & Citations`);
    for (const ev of result.evidence) {
      lines.push(
        `- **[${ev.stance.toUpperCase()}]** ${ev.title} — *${ev.publisher}* (${ev.url})${ev.published_date ? ` · ${ev.published_date}` : ''}`
      );
      if (ev.snippet) lines.push(`  - ${ev.snippet}`);
    }
    lines.push('');
  }

  if (result.limitations.length > 0) {
    lines.push(`## Limitations`);
    for (const l of result.limitations) {
      lines.push(`- ${l}`);
    }
    lines.push('');
  }

  if (result.next_steps.length > 0) {
    lines.push(`## Recommended Next Steps`);
    for (const n of result.next_steps) {
      lines.push(`- ${n}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(
    `*Privacy Notice: TruthScan AI operates ephemerally without permanent server storage. Generated on demand for session ${result.analysis_id}.*`
  );
  return lines.join('\n');
}

export async function buildPdfReportBuffer(result: AnalysisResult): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).fillColor('#0F172A').text('TruthScan AI — Verification Report');
    doc.fontSize(9.5).fillColor('#475569').text('Verify the Content. Reveal the Evidence. Protect the Truth.');
    doc.moveDown(0.8);

    // Metadata box
    doc.fontSize(10).fillColor('#1E293B');
    doc.text(`Analysis ID: ${result.analysis_id}`);
    doc.text(`Generated At: ${result.created_at}`);
    doc.text(`Module: ${result.module.toUpperCase()}   |   Language: ${result.language.toUpperCase()}`);
    doc.text(`Subject: ${result.title}`);
    doc.moveDown(0.6);

    doc.fontSize(13).fillColor('#1D4ED8').text(`Assessment: ${result.assessment} (Confidence: ${result.confidence})`);
    doc.moveDown(0.5);

    const addSection = (heading: string, body: string | string[]) => {
      doc.fontSize(11.5).fillColor('#0F172A').text(heading, { underline: false });
      doc.moveDown(0.2);
      doc.fontSize(10).fillColor('#334155');
      if (Array.isArray(body)) {
        for (const item of body) {
          doc.text(`• ${item}`, { indent: 8 });
        }
      } else {
        doc.text(body);
      }
      doc.moveDown(0.6);
    };

    addSection('Summary', result.summary);
    addSection('Explainable Indicators', [
      `Verification Status: ${result.indicators.verification_status}`,
      `Evidence Strength: ${result.indicators.evidence_strength}`,
      `Source Reliability: ${result.indicators.source_reliability}`,
      `Model Confidence: ${result.indicators.model_confidence}`,
      `Forensic Anomalies: ${result.indicators.forensic_anomalies}`,
    ]);
    addSection('Detailed Explanation', result.explanation);

    if (result.findings.length > 0) {
      addSection('Findings', result.findings);
    }

    if (result.evidence.length > 0) {
      addSection(
        'Evidence & Citations',
        result.evidence.map(
          (e) => `[${e.stance.toUpperCase()}] ${e.title} — ${e.publisher} (${e.url})`
        )
      );
    }

    if (result.limitations.length > 0) {
      addSection('Limitations', result.limitations);
    }

    if (result.next_steps.length > 0) {
      addSection('Recommended Next Steps', result.next_steps);
    }

    doc.moveDown(0.5);
    doc
      .fontSize(8.5)
      .fillColor('#64748B')
      .text(
        'Privacy Notice: TruthScan AI processes content ephemerally without permanent server-side databases or media storage. Content processed by external AI providers is subject to their respective data handling policies.'
      );

    doc.end();
  });
}
