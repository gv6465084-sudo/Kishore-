import sharp from 'sharp';
import exifr from 'exifr';
import type {
  AnalysisResult,
  AssessmentCategory,
  LanguageCode,
} from '../src/types/analysis.ts';
import {
  isGeminiConfigured,
  parseGeminiError,
  runMultimodalJsonWithGemini,
} from './geminiService.ts';
import { generateAnalysisId, verifyImageSignature } from './security.ts';

async function computeErrorLevelAnalysis(buffer: Buffer): Promise<{
  elaDataUrl: string;
  previewDataUrl: string;
  meanDifference: number;
  maxDifference: number;
  highVarianceRatio: number;
}> {
  const baseSharp = sharp(buffer, { failOn: 'none' }).rotate();
  const resizedOrig = await baseSharp
    .clone()
    .resize({ width: 768, height: 768, fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .toColorspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const previewJpeg = await sharp(resizedOrig.data, {
    raw: {
      width: resizedOrig.info.width,
      height: resizedOrig.info.height,
      channels: 3,
    },
  })
    .jpeg({ quality: 88 })
    .toBuffer();

  // Re-compress at JPEG quality 90 to inspect differential compression residuals
  const recompressedJpeg = await sharp(resizedOrig.data, {
    raw: {
      width: resizedOrig.info.width,
      height: resizedOrig.info.height,
      channels: 3,
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  const recompRaw = await sharp(recompressedJpeg, { failOn: 'none' })
    .removeAlpha()
    .toColorspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const origBytes = resizedOrig.data;
  const recompBytes = recompRaw.data;
  const len = Math.min(origBytes.length, recompBytes.length);
  const pixelCount = Math.floor(len / 3);
  const elaRgb = Buffer.alloc(pixelCount * 3);

  let sumDiff = 0;
  let maxDiff = 0;
  let highVarPixels = 0;
  const scale = 12;

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 3;
    const dr = Math.abs(origBytes[idx] - recompBytes[idx]);
    const dg = Math.abs(origBytes[idx + 1] - recompBytes[idx + 1]);
    const db = Math.abs(origBytes[idx + 2] - recompBytes[idx + 2]);
    const avg = (dr + dg + db) / 3;
    sumDiff += avg;
    if (avg > maxDiff) maxDiff = avg;
    if (avg > 12) highVarPixels++;

    const intensity = Math.min(255, Math.round(avg * scale));
    if (intensity < 85) {
      elaRgb[idx] = 8;
      elaRgb[idx + 1] = Math.round((intensity / 85) * 90) + 15;
      elaRgb[idx + 2] = Math.round((intensity / 85) * 180) + 45;
    } else if (intensity < 170) {
      const t = (intensity - 85) / 85;
      elaRgb[idx] = Math.round(t * 240);
      elaRgb[idx + 1] = Math.round(105 + t * 80);
      elaRgb[idx + 2] = Math.round(225 * (1 - t));
    } else {
      const t = (intensity - 170) / 85;
      elaRgb[idx] = 245;
      elaRgb[idx + 1] = Math.round(185 * (1 - t));
      elaRgb[idx + 2] = Math.round(35 * (1 - t));
    }
  }

  const elaPng = await sharp(elaRgb, {
    raw: {
      width: resizedOrig.info.width,
      height: resizedOrig.info.height,
      channels: 3,
    },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return {
    elaDataUrl: `data:image/png;base64,${elaPng.toString('base64')}`,
    previewDataUrl: `data:image/jpeg;base64,${previewJpeg.toString('base64')}`,
    meanDifference: Number((sumDiff / Math.max(1, pixelCount)).toFixed(2)),
    maxDifference: Number(maxDiff.toFixed(2)),
    highVarianceRatio: Number(((highVarPixels / Math.max(1, pixelCount)) * 100).toFixed(2)),
  };
}

interface GeminiImagePayload {
  assessment: AssessmentCategory;
  confidence: 'High' | 'Medium' | 'Low';
  summary: string;
  explanation: string;
  visual_inconsistencies: string[];
  evidence_strength: string;
  source_reliability: string;
  model_confidence: string;
  forensic_anomalies: string;
  next_steps: string[];
  limitations: string[];
}

export async function analyzeImageBuffer(params: {
  buffer: Buffer;
  originalName: string;
  language: LanguageCode;
}): Promise<AnalysisResult> {
  const sig = verifyImageSignature(params.buffer);
  if (!sig.valid) {
    throw new Error('Unsupported or invalid image signature. Allowed formats: JPG, JPEG, PNG, WebP.');
  }

  const metadata = await sharp(params.buffer, { failOn: 'none' }).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (width === 0 || height === 0) {
    throw new Error('Could not decode valid image dimensions. File may be corrupted.');
  }

  const bitsPerPixel = Number(((params.buffer.length * 8) / Math.max(1, width * height)).toFixed(2));

  // Extract EXIF safely
  let exifSummary: Record<string, string> = {};
  let hasExif = false;
  try {
    const rawExif = await exifr.parse(params.buffer, {
      pick: [
        'Make',
        'Model',
        'Software',
        'DateTimeOriginal',
        'CreateDate',
        'ExposureTime',
        'FNumber',
        'ISO',
        'FocalLength',
        'ColorSpace',
        'Artist',
      ],
    });
    if (rawExif && typeof rawExif === 'object') {
      for (const [k, v] of Object.entries(rawExif)) {
        if (v !== undefined && v !== null) {
          if (v instanceof Date) {
            exifSummary[k] = v.toISOString();
          } else if (ArrayBuffer.isView(v)) {
            exifSummary[k] = `[Binary ${v.byteLength} bytes]`;
          } else {
            exifSummary[k] = String(v).slice(0, 120);
          }
        }
      }
      hasExif = Object.keys(exifSummary).length > 0;
    }
  } catch {
    hasExif = false;
    exifSummary = {};
  }

  const ela = await computeErrorLevelAnalysis(params.buffer);

  const specialisedDetector = {
    available: false,
    status_message:
      params.language === 'ta'
        ? 'இலவச கட்டமைப்பில் சிறப்பு AI-பட வகைப்படுத்தி மாதிரி இயக்கப்படவில்லை. உள்ளூர் EXIF, சுருக்க பகுப்பாய்வு மற்றும் ELA மட்டுமே பயன்படுத்தப்படுகிறது.'
        : 'Specialised AI-generated image classifier is not configured in Free Mode. Local EXIF, compression, and ELA forensics completed.',
  };

  const elaNote =
    params.language === 'ta'
      ? 'பிழை நிலை பகுப்பாய்வு (ELA) என்பது ஒரு ஆய்வு உதவி மட்டுமே; அதிக பிரகாசம் கொண்ட பகுதிகள் திருத்தத்திற்கான உறுதியான ஆதாரம் அல்ல.'
      : 'Error Level Analysis (ELA) is an exploratory compression visualization only; bright regions reflect differential JPEG quantization and are not standalone proof of tampering.';

  const localFindings: string[] = [
    `${sig.detectedFormat} · ${width}×${height} px · ${bitsPerPixel} bpp`,
    hasExif
      ? `EXIF tags present (${Object.keys(exifSummary).slice(0, 4).join(', ')})`
      : 'EXIF headers absent (routinely stripped by messaging apps and screenshots)',
    `ELA exploratory variance: mean ${ela.meanDifference}, high-variance pixels ${ela.highVarianceRatio}%`,
  ];

  if (exifSummary.Software) {
    localFindings.push(`Editing/export software tag detected in EXIF: ${exifSummary.Software}`);
  }

  let aiStatus: AnalysisResult['ai_status'] = {
    available: false,
    mode: 'local_fallback',
    status_message:
      params.language === 'ta'
        ? 'GEMINI_API_KEY அமைக்கப்படாததால் உள்ளூர் தடயவியல் பகுப்பாய்வு மட்டுமே இயக்கப்பட்டது.'
        : 'GEMINI_API_KEY is not configured; local image forensics completed without AI visual review.',
  };

  if (isGeminiConfigured()) {
    try {
      const geminiImageBuf = await sharp(params.buffer, { failOn: 'none' })
        .rotate()
        .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 88 })
        .toBuffer();

      const langLabel = params.language === 'ta' ? 'Tamil (தமிழ்)' : 'English';
      const systemInstruction = `You are a cautious digital image forensics specialist for TruthScan AI.
MANDATORY RULES:
1. NEVER claim an image is manipulated or AI-generated solely because EXIF metadata is missing.
2. NEVER treat an Error Level Analysis (ELA) heatmap as definitive proof of tampering.
3. NEVER claim definitive AI-generated image detection without a validated specialised model—always use "Suspicious" or "Inconclusive" (or "Misleading" only if clear deceptive compositing/captioning is visible).
4. Do NOT label an ordinary photograph or device screenshot as "Suspicious" merely for smooth gradients, web compression, or stripped EXIF—use "Inconclusive" unless concrete visual tampering anomalies exist.
5. Respond in ${langLabel}. Return valid JSON only.`;

      const promptText = `Inspect this image for visual consistency, optical physics, lighting/shadows, and potential editing indicators.

Local Forensics Summary:
- Format: ${sig.detectedFormat}, Dimensions: ${width}x${height}, Density: ${bitsPerPixel} bpp
- EXIF Metadata: ${hasExif ? JSON.stringify(exifSummary) : 'Absent'}
- ELA Exploratory Stats: mean_diff=${ela.meanDifference}, max_diff=${ela.maxDifference}, high_variance_ratio=${ela.highVarianceRatio}%
- Specialised AI-Image Detector: Not configured in Free Mode

Return JSON with this exact schema:
{
  "assessment": "Suspicious | Inconclusive | Misleading",
  "confidence": "High | Medium | Low",
  "summary": "2-sentence cautious forensic summary",
  "explanation": "Detailed multi-sentence explanation separating metadata, compression residuals, and visual observations",
  "visual_inconsistencies": ["Specific observable visual cue"],
  "evidence_strength": "Exploratory Forensic Indicators",
  "source_reliability": "EXIF & Container Summary",
  "model_confidence": "Certainty note",
  "forensic_anomalies": "Short summary of metadata/compression/visual cues",
  "next_steps": ["Practical provenance check"],
  "limitations": ["Explicit limitation without C2PA or specialised classifier"]
}`;

      const parsed = await runMultimodalJsonWithGemini<GeminiImagePayload>(
        [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: geminiImageBuf.toString('base64'),
            },
          },
          { text: promptText },
        ],
        systemInstruction
      );

      let safeAssessment: AssessmentCategory = parsed.assessment || 'Inconclusive';
      if (safeAssessment !== 'Suspicious' && safeAssessment !== 'Inconclusive' && safeAssessment !== 'Misleading') {
        safeAssessment = 'Inconclusive';
      }

      return {
        analysis_id: generateAnalysisId(),
        created_at: new Date().toISOString(),
        language: params.language,
        module: 'image',
        title: params.originalName || `Image Inspection (${sig.detectedFormat})`,
        assessment: safeAssessment,
        confidence: parsed.confidence || 'Medium',
        summary: parsed.summary,
        explanation: parsed.explanation,
        ai_status: {
          available: true,
          mode: 'gemini_free_tier',
          status_message: 'Gemini free-tier visual inspection completed alongside local forensics.',
        },
        indicators: {
          evidence_strength: parsed.evidence_strength || 'Exploratory',
          source_reliability: parsed.source_reliability || (hasExif ? 'EXIF Present' : 'EXIF Stripped'),
          model_confidence: parsed.model_confidence || parsed.confidence || 'Medium',
          forensic_anomalies: parsed.forensic_anomalies || `${ela.highVarianceRatio}% ELA variance`,
          verification_status: safeAssessment,
        },
        findings: [
          ...localFindings,
          ...(Array.isArray(parsed.visual_inconsistencies) ? parsed.visual_inconsistencies : []),
        ],
        evidence: [],
        next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : [],
        limitations: Array.isArray(parsed.limitations) ? parsed.limitations : [],
        image_details: {
          filename: params.originalName,
          mime_type: sig.mimeType,
          file_size_bytes: params.buffer.length,
          format: sig.detectedFormat,
          width,
          height,
          channels: metadata.channels,
          color_space: metadata.space,
          bits_per_pixel: bitsPerPixel,
          has_exif: hasExif,
          exif_summary: exifSummary,
          ela_heatmap_data_url: ela.elaDataUrl,
          original_preview_data_url: ela.previewDataUrl,
          ela_stats: {
            mean_difference: ela.meanDifference,
            max_difference: ela.maxDifference,
            high_variance_ratio: ela.highVarianceRatio,
            interpretation_note: elaNote,
          },
          specialised_detector: specialisedDetector,
        },
      };
    } catch (err) {
      const info = parseGeminiError(err);
      aiStatus = {
        available: false,
        mode: 'local_fallback',
        status_message: info.message,
      };
    }
  }

  // Graceful Local Forensics Fallback when Gemini is unavailable / missing / rate-limited
  const fallbackSummary =
    params.language === 'ta'
      ? `உள்ளூர் படத் தடயவியல் முடிந்தது (${sig.detectedFormat}, ${width}×${height} px). AI காட்சி ஆய்வு கிடைக்காததால் முடிவு "முடிவு செய்ய முடியாதது" என வைக்கப்பட்டுள்ளது.`
      : `Local image forensics completed (${sig.detectedFormat}, ${width}×${height} px, ${bitsPerPixel} bpp). Without Gemini visual inspection or a specialised classifier, authenticity remains Inconclusive.`;

  return {
    analysis_id: generateAnalysisId(),
    created_at: new Date().toISOString(),
    language: params.language,
    module: 'image',
    title: params.originalName || `Image Inspection (${sig.detectedFormat})`,
    assessment: 'Inconclusive',
    confidence: 'Low',
    summary: fallbackSummary,
    explanation: `${aiStatus.status_message} ${elaNote}`,
    ai_status: aiStatus,
    indicators: {
      evidence_strength: 'Local Metadata & ELA Only',
      source_reliability: hasExif ? 'EXIF Metadata Present' : 'EXIF Metadata Absent',
      model_confidence: 'Low (Local forensics only)',
      forensic_anomalies: `${ela.highVarianceRatio}% ELA high-variance ratio`,
      verification_status: 'Inconclusive',
    },
    findings: localFindings,
    evidence: [],
    next_steps: [
      params.language === 'ta'
        ? 'அசல் கேமரா கோப்பு அல்லது தலைகீழ் படத் தேடல் மூலம் படத்தின் மூலத்தைச் சரிபார்க்கவும்.'
        : 'Request the original unedited camera file or run a manual reverse image search to verify provenance.',
    ],
    limitations: [
      aiStatus.status_message,
      specialisedDetector.status_message,
      elaNote,
    ],
    image_details: {
      filename: params.originalName,
      mime_type: sig.mimeType,
      file_size_bytes: params.buffer.length,
      format: sig.detectedFormat,
      width,
      height,
      channels: metadata.channels,
      color_space: metadata.space,
      bits_per_pixel: bitsPerPixel,
      has_exif: hasExif,
      exif_summary: exifSummary,
      ela_heatmap_data_url: ela.elaDataUrl,
      original_preview_data_url: ela.previewDataUrl,
      ela_stats: {
        mean_difference: ela.meanDifference,
        max_difference: ela.maxDifference,
        high_variance_ratio: ela.highVarianceRatio,
        interpretation_note: elaNote,
      },
      specialised_detector: specialisedDetector,
    },
  };
}
