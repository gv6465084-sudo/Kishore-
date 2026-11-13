import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';
import type {
  AnalysisResult,
  AssessmentCategory,
  LanguageCode,
  VideoFrameItem,
} from '../src/types/analysis.ts';
import {
  isGeminiConfigured,
  parseGeminiError,
  runMultimodalJsonWithGemini,
} from './geminiService.ts';
import {
  cleanupTempDir,
  createEphemeralTempDir,
  generateAnalysisId,
  verifyVideoSignature,
} from './security.ts';

const execFileAsync = promisify(execFile);

export async function checkFfmpegAvailable(): Promise<boolean> {
  try {
    await execFileAsync('ffmpeg', ['-version'], { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

interface FfprobeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  sample_rate?: string;
}

interface FfprobeOutput {
  format?: { duration?: string };
  streams?: FfprobeStream[];
}

async function inspectVideoWithFfprobe(filePath: string): Promise<{
  durationSec: number;
  width: number;
  height: number;
  codec: string;
  fps: number;
  hasAudio: boolean;
  audioCodec?: string;
  audioSampleRate?: string;
}> {
  const { stdout } = await execFileAsync(
    'ffprobe',
    ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', filePath],
    { timeout: 15000 }
  );

  const parsed = JSON.parse(stdout) as FfprobeOutput;
  const videoStream = parsed.streams?.find((s) => s.codec_type === 'video');
  const audioStream = parsed.streams?.find((s) => s.codec_type === 'audio');

  if (!videoStream) {
    throw new Error('No readable video stream found inside uploaded file.');
  }

  let fps = 0;
  if (videoStream.r_frame_rate && videoStream.r_frame_rate.includes('/')) {
    const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
    if (den > 0) fps = Number((num / den).toFixed(2));
  }

  return {
    durationSec: Number(Number(parsed.format?.duration || 0).toFixed(2)),
    width: videoStream.width ?? 0,
    height: videoStream.height ?? 0,
    codec: videoStream.codec_name || 'unknown',
    fps,
    hasAudio: Boolean(audioStream),
    audioCodec: audioStream?.codec_name,
    audioSampleRate: audioStream?.sample_rate ? `${audioStream.sample_rate} Hz` : undefined,
  };
}

async function computeFrameConsistency(frames: Array<{ timestamp: number; buf: Buffer }>): Promise<{
  compared_pairs: number;
  mean_frame_delta: number;
  max_frame_delta: number;
  summary: string;
}> {
  if (frames.length < 2) {
    return {
      compared_pairs: 0,
      mean_frame_delta: 0,
      max_frame_delta: 0,
      summary: 'Single frame extracted; temporal frame comparison unavailable.',
    };
  }

  const graySamples = await Promise.all(
    frames.map((f) =>
      sharp(f.buf)
        .resize(64, 36, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer()
    )
  );

  let sumMean = 0;
  let maxDelta = 0;
  const pairs = graySamples.length - 1;

  for (let i = 0; i < pairs; i++) {
    const a = graySamples[i];
    const b = graySamples[i + 1];
    let diffAcc = 0;
    const len = Math.min(a.length, b.length);
    for (let j = 0; j < len; j++) {
      diffAcc += Math.abs(a[j] - b[j]);
    }
    const pairMean = diffAcc / Math.max(1, len);
    sumMean += pairMean;
    if (pairMean > maxDelta) maxDelta = pairMean;
  }

  const meanDelta = Number((sumMean / pairs).toFixed(2));
  const roundedMax = Number(maxDelta.toFixed(2));

  return {
    compared_pairs: pairs,
    mean_frame_delta: meanDelta,
    max_frame_delta: roundedMax,
    summary: `Compared ${pairs} consecutive frame transitions (mean luminance delta: ${meanDelta}/255, max transition: ${roundedMax}/255).`,
  };
}

interface GeminiVideoPayload {
  assessment: AssessmentCategory;
  confidence: 'High' | 'Medium' | 'Low';
  summary: string;
  explanation: string;
  visual_findings: string[];
  audio_summary: string;
  lip_sync_summary: string;
  evidence_strength: string;
  source_reliability: string;
  model_confidence: string;
  forensic_anomalies: string;
  next_steps: string[];
  limitations: string[];
}

export async function analyzeVideoBuffer(params: {
  buffer: Buffer;
  originalName: string;
  language: LanguageCode;
}): Promise<AnalysisResult> {
  const sig = verifyVideoSignature(params.buffer);
  if (!sig.valid) {
    throw new Error('Unsupported or invalid video signature. Allowed formats: MP4, MOV, WEBM, M4V.');
  }

  const ffmpegReady = await checkFfmpegAvailable();
  if (!ffmpegReady) {
    throw new Error('FFmpeg is not available in the server runtime to extract video frames.');
  }

  let tempDir: string | null = null;
  try {
    tempDir = await createEphemeralTempDir('truthscan-video-');
    const ext = sig.detectedFormat.toLowerCase();
    const videoPath = path.join(tempDir, `upload.${ext}`);
    await fs.writeFile(videoPath, params.buffer);

    const probe = await inspectVideoWithFfprobe(videoPath);
    if (probe.durationSec > 180) {
      throw new Error('Video duration exceeds the 180-second processing limit for ephemeral analysis.');
    }

    const frameCount = probe.durationSec > 0 && probe.durationSec < 2 ? 2 : 6;
    const timestamps: number[] = [];
    if (probe.durationSec > 0.25) {
      const usableDuration = Math.max(0.1, probe.durationSec - 0.08);
      for (let i = 0; i < frameCount; i++) {
        const t = Number((((i + 0.5) / frameCount) * usableDuration).toFixed(2));
        timestamps.push(t);
      }
    } else {
      timestamps.push(0);
    }

    const extractedSlots = await Promise.all(
      timestamps.map(async (t, i) => {
        const outPath = path.join(tempDir!, `frame_${i}.jpg`);
        try {
          await execFileAsync(
            'ffmpeg',
            [
              '-y',
              '-ss',
              String(t),
              '-i',
              videoPath,
              '-frames:v',
              '1',
              '-q:v',
              '4',
              '-vf',
              'scale=512:-2',
              outPath,
            ],
            { timeout: 15000 }
          );
          const frameBuf = await fs.readFile(outPath);
          return frameBuf.length > 0 ? { timestamp: t, buf: frameBuf } : null;
        } catch {
          return null;
        }
      })
    );

    const extractedFrames: Array<{ timestamp: number; buf: Buffer }> = [];
    for (const slot of extractedSlots) {
      if (slot) extractedFrames.push(slot);
    }

    // Fallback for unindexed WebM/MediaRecorder clips (duration=0) or tight GOPs:
    // extract sequential key/sample frames directly in a single pass.
    if (extractedFrames.length < 2) {
      try {
        const seqPattern = path.join(tempDir, 'seq_%02d.jpg');
        await execFileAsync(
          'ffmpeg',
          [
            '-y',
            '-i',
            videoPath,
            '-vf',
            'thumbnail=n=12,scale=512:-2',
            '-vsync',
            'vfr',
            '-frames:v',
            '6',
            '-q:v',
            '4',
            seqPattern,
          ],
          { timeout: 18000 }
        );
        const files = (await fs.readdir(tempDir))
          .filter((name) => /^seq_\d+\.jpg$/.test(name))
          .sort();
        if (files.length > extractedFrames.length) {
          extractedFrames.length = 0;
          for (let idx = 0; idx < files.length; idx++) {
            const buf = await fs.readFile(path.join(tempDir, files[idx]));
            if (buf.length > 0) {
              const approxTs =
                probe.durationSec > 0
                  ? Number((((idx + 0.5) / files.length) * probe.durationSec).toFixed(2))
                  : idx;
              extractedFrames.push({ timestamp: approxTs, buf });
            }
          }
        }
      } catch {
        // Ignore if primary extraction already captured at least one frame
      }
    }

    // Final guarantee: decode frame 0 directly if fast seeking yielded nothing
    if (extractedFrames.length === 0) {
      const zeroPath = path.join(tempDir, 'frame_zero.jpg');
      try {
        await execFileAsync(
          'ffmpeg',
          ['-y', '-i', videoPath, '-frames:v', '1', '-q:v', '4', '-vf', 'scale=512:-2', zeroPath],
          { timeout: 15000 }
        );
        const zeroBuf = await fs.readFile(zeroPath);
        if (zeroBuf.length > 0) {
          extractedFrames.push({ timestamp: 0, buf: zeroBuf });
        }
      } catch {
        // Handled cleanly below
      }
    }

    if (extractedFrames.length === 0) {
      throw new Error('Failed to extract any representative frames from the uploaded video.');
    }

    return await buildVideoAnalysisFromFrames({
      extractedFrames,
      originalName: params.originalName,
      detectedFormat: sig.detectedFormat,
      mimeType: sig.mimeType,
      fileSizeBytes: params.buffer.length,
      probe,
      language: params.language,
      extractionSource: 'ffmpeg',
    });
  } finally {
    await cleanupTempDir(tempDir);
  }
}

export async function analyzeClientVideoFrames(params: {
  frames: Array<{ timestamp_sec: number; buf: Buffer }>;
  originalName: string;
  mimeType: string;
  fileSizeBytes: number;
  durationSec: number;
  width: number;
  height: number;
  language: LanguageCode;
}): Promise<AnalysisResult> {
  if (!params.frames || params.frames.length === 0) {
    throw new Error('No video frames provided for verification.');
  }

  const normalizedFrames = await Promise.all(
    params.frames.slice(0, 6).map(async (f) => {
      const normalized = await sharp(f.buf, { failOn: 'none' })
        .resize({ width: 512, withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      return { timestamp: f.timestamp_sec, buf: normalized };
    })
  );

  return await buildVideoAnalysisFromFrames({
    extractedFrames: normalizedFrames,
    originalName: params.originalName,
    detectedFormat: params.mimeType.includes('webm') ? 'WebM' : 'MP4',
    mimeType: params.mimeType || 'video/mp4',
    fileSizeBytes: params.fileSizeBytes,
    probe: {
      durationSec: params.durationSec,
      width: params.width,
      height: params.height,
      codec: 'browser-decoded (network-optimized frame sampling)',
      fps: 0,
      hasAudio: false,
    },
    language: params.language,
    extractionSource: 'browser_canvas',
  });
}

async function buildVideoAnalysisFromFrames(input: {
  extractedFrames: Array<{ timestamp: number; buf: Buffer }>;
  originalName: string;
  detectedFormat: string;
  mimeType: string;
  fileSizeBytes: number;
  probe: {
    durationSec: number;
    width: number;
    height: number;
    codec: string;
    fps: number;
    hasAudio: boolean;
    audioCodec?: string;
    audioSampleRate?: string;
  };
  language: LanguageCode;
  extractionSource: 'ffmpeg' | 'browser_canvas';
}): Promise<AnalysisResult> {
  const { extractedFrames, probe, detectedFormat, mimeType, fileSizeBytes, originalName, language, extractionSource } = input;
  const timestamps = extractedFrames.map((f) => f.timestamp);
  const frameConsistency = await computeFrameConsistency(extractedFrames);

  // Build contact sheet using sharp
  const thumbW = 320;
  const thumbH = 180;
  const cols = Math.min(3, extractedFrames.length);
  const rows = Math.ceil(extractedFrames.length / cols);

  const composites = await Promise.all(
    extractedFrames.map(async (f, idx) => {
      const resized = await sharp(f.buf, { failOn: 'none' })
        .resize(thumbW, thumbH, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer();
      return {
        input: resized,
        left: (idx % cols) * thumbW,
        top: Math.floor(idx / cols) * thumbH,
      };
    })
  );

  const contactSheetBuf = await sharp({
    create: {
      width: cols * thumbW,
      height: rows * thumbH,
      channels: 3,
      background: { r: 8, g: 13, b: 24 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toBuffer();

  const frameItems: VideoFrameItem[] = extractedFrames.map((f) => {
    const mins = Math.floor(f.timestamp / 60);
    const secs = (f.timestamp % 60).toFixed(1).padStart(4, '0');
    return {
      timestamp_sec: f.timestamp,
      timestamp_label: `${String(mins).padStart(2, '0')}:${secs}`,
      data_url: `data:image/jpeg;base64,${f.buf.toString('base64')}`,
    };
  });

  const deepfakeTrack = {
    available: false,
    status_message:
      language === 'ta'
        ? 'இலவச கட்டமைப்பில் சிறப்பு டீப்ஃபேக் கண்டறிதல் மாதிரி இணைக்கப்படவில்லை. போலி மதிப்பெண்கள் உருவாக்கப்படவில்லை.'
        : 'Specialised deepfake detection is not configured in Free Mode. No synthetic deepfake score is generated.',
    findings: [] as string[],
  };

  let aiStatus: AnalysisResult['ai_status'] = {
    available: false,
    mode: 'local_fallback',
    status_message:
      language === 'ta'
        ? 'GEMINI_API_KEY அமைக்கப்படாததால் பிரேம் பிரித்தெடுத்தல் மற்றும் உள்ளூர் ஒப்பீடு மட்டுமே இயக்கப்பட்டது.'
        : 'GEMINI_API_KEY is not configured; local frame extraction and consistency comparison completed.',
  };

  if (isGeminiConfigured()) {
    try {
      const langLabel = language === 'ta' ? 'Tamil (தமிழ்)' : 'English';
      const systemInstruction = `You are a video forensics specialist for TruthScan AI.
MANDATORY RULES:
1. NEVER label a video as a confirmed deepfake merely because a single frame looks blurry or unusual.
2. Clearly separate general frame-sequence visual consistency from specialised deepfake detection (which is NOT configured in Free Mode).
3. Respond in ${langLabel}. Return valid JSON only.`;

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        ...extractedFrames.map((f) => ({
          inlineData: {
            mimeType: 'image/jpeg',
            data: f.buf.toString('base64'),
          },
        })),
        {
          text: `Analyze these ${extractedFrames.length} chronological video frames (${timestamps.join('s, ')}s) from a ${probe.durationSec}s ${detectedFormat} video (${probe.width}x${probe.height}, ${probe.fps} fps, audio: ${probe.hasAudio ? `${probe.audioCodec}` : 'Unavailable'}).
Local Frame Comparison: ${frameConsistency.summary}
Specialised Deepfake Model: Not configured in Free Mode.

Return JSON strictly matching:
{
  "assessment": "Suspicious | Inconclusive | Misleading",
  "confidence": "High | Medium | Low",
  "summary": "2-sentence overview of frame sequence observations",
  "explanation": "Detailed multi-sentence breakdown separating visual frame coherence, frame comparison, and model limitations",
  "visual_findings": ["Observation across frames 1..N"],
  "audio_summary": "Honest assessment of audio track metadata",
  "lip_sync_summary": "Honest note that acoustic lip-sync requires dedicated sync models",
  "evidence_strength": "Sampled Frame Sequence",
  "source_reliability": "Container metadata summary",
  "model_confidence": "Brief certainty note",
  "forensic_anomalies": "Summary of any facial boundary, lighting, or temporal inconsistencies",
  "next_steps": ["Recommended next verification step"],
  "limitations": ["Explicit limitation regarding frame sampling and unconfigured deepfake model"]
}`,
        },
      ];

      const parsed = await runMultimodalJsonWithGemini<GeminiVideoPayload>(
        parts,
        systemInstruction
      );

      let safeAssessment: AssessmentCategory = parsed.assessment || 'Inconclusive';
      if (safeAssessment !== 'Suspicious' && safeAssessment !== 'Inconclusive' && safeAssessment !== 'Misleading') {
        safeAssessment = 'Inconclusive';
      }

      return {
        analysis_id: generateAnalysisId(),
        created_at: new Date().toISOString(),
        language,
        module: 'video',
        title: originalName || `Video Analysis (${detectedFormat})`,
        assessment: safeAssessment,
        confidence: parsed.confidence || 'Medium',
        summary: parsed.summary,
        explanation: parsed.explanation,
        ai_status: {
          available: true,
          mode: 'gemini_free_tier',
          status_message:
            extractionSource === 'ffmpeg'
              ? 'Gemini free-tier frame analysis completed alongside local FFmpeg extraction.'
              : 'Gemini free-tier frame analysis completed using bandwidth-optimized client frame sampling.',
        },
        indicators: {
          evidence_strength: parsed.evidence_strength || 'Sampled Frame Sequence',
          source_reliability: parsed.source_reliability || `${detectedFormat} · ${probe.codec}`,
          model_confidence: parsed.model_confidence || parsed.confidence || 'Medium',
          forensic_anomalies: parsed.forensic_anomalies || frameConsistency.summary,
          verification_status: safeAssessment,
        },
        findings: [
          frameConsistency.summary,
          ...(Array.isArray(parsed.visual_findings) ? parsed.visual_findings : []),
        ],
        evidence: [],
        next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : [],
        limitations: Array.isArray(parsed.limitations) ? parsed.limitations : [],
        video_details: {
          filename: originalName,
          mime_type: mimeType,
          file_size_bytes: fileSizeBytes,
          duration_sec: probe.durationSec,
          resolution: `${probe.width}×${probe.height}`,
          codec: probe.codec,
          fps: probe.fps,
          has_audio: probe.hasAudio,
          audio_codec: probe.audioCodec,
          audio_sample_rate: probe.audioSampleRate,
          contact_sheet_data_url: `data:image/jpeg;base64,${contactSheetBuf.toString('base64')}`,
          frames: frameItems,
          frame_consistency: frameConsistency,
          tracks: {
            general_visual_analysis: {
              status: 'completed',
              summary: parsed.summary,
              findings: [
                frameConsistency.summary,
                ...(Array.isArray(parsed.visual_findings) ? parsed.visual_findings : []),
              ],
            },
            specialised_deepfake_detection: deepfakeTrack,
            audio_analysis: {
              status: probe.hasAudio ? 'completed' : 'no_audio',
              summary: probe.hasAudio
                ? parsed.audio_summary ||
                  `Audio stream detected (${probe.audioCodec}, ${probe.audioSampleRate ?? 'unknown rate'}). Dedicated synthetic-voice model not configured.`
                : extractionSource === 'browser_canvas'
                  ? 'Audio container inspection skipped during low-bandwidth frame sampling.'
                  : 'No audio track detected inside the uploaded video container.',
              findings: probe.hasAudio
                ? [`Codec: ${probe.audioCodec}`, `Sample rate: ${probe.audioSampleRate ?? 'N/A'}`]
                : [],
            },
            lip_sync_analysis: {
              status: 'unavailable',
              summary:
                parsed.lip_sync_summary ||
                'Dedicated acoustic-to-viseme lip-synchronisation detector is not configured in Free Mode.',
              findings: [],
            },
          },
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

  const localSummary =
    language === 'ta'
      ? `உள்ளூர் பிரேம் பிரித்தெடுத்தல் (${extractedFrames.length} பிரேம்கள்) மற்றும் பிரேம் ஒப்பீடு முடிந்தது. AI காட்சி ஆய்வு கிடைக்காததால் முடிவு "முடிவு செய்ய முடியாதது" என வைக்கப்பட்டுள்ளது.`
      : `Local frame extraction (${extractedFrames.length} frames) and transition comparison completed. Without Gemini frame review or a specialised deepfake model, authenticity remains Inconclusive.`;

  return {
    analysis_id: generateAnalysisId(),
    created_at: new Date().toISOString(),
    language,
    module: 'video',
    title: originalName || `Video Analysis (${detectedFormat})`,
    assessment: 'Inconclusive',
    confidence: 'Low',
    summary: localSummary,
    explanation: `${aiStatus.status_message} ${frameConsistency.summary}`,
    ai_status: aiStatus,
    indicators: {
      evidence_strength: 'Local Frames Only',
      source_reliability: `${detectedFormat} · ${probe.codec}`,
      model_confidence: 'Low (Local frame comparison only)',
      forensic_anomalies: frameConsistency.summary,
      verification_status: 'Inconclusive',
    },
    findings: [
      `Container: ${detectedFormat}, ${probe.width}×${probe.height}, ${probe.durationSec}s, ${probe.fps} fps`,
      frameConsistency.summary,
    ],
    evidence: [],
    next_steps: [
      language === 'ta'
        ? 'பிரித்தெடுக்கப்பட்ட பிரேம்களை கைமுறையாக ஆய்வு செய்து முதன்மை காணொளி மூலத்தைச் சரிபார்க்கவும்.'
        : 'Inspect the extracted contact sheet frames visually and trace the earliest original upload source.',
    ],
    limitations: [
      aiStatus.status_message,
      deepfakeTrack.status_message,
    ],
    video_details: {
      filename: originalName,
      mime_type: mimeType,
      file_size_bytes: fileSizeBytes,
      duration_sec: probe.durationSec,
      resolution: `${probe.width}×${probe.height}`,
      codec: probe.codec,
      fps: probe.fps,
      has_audio: probe.hasAudio,
      audio_codec: probe.audioCodec,
      audio_sample_rate: probe.audioSampleRate,
      contact_sheet_data_url: `data:image/jpeg;base64,${contactSheetBuf.toString('base64')}`,
      frames: frameItems,
      frame_consistency: frameConsistency,
      tracks: {
        general_visual_analysis: {
          status: 'local_only',
          summary: frameConsistency.summary,
          findings: [frameConsistency.summary],
        },
        specialised_deepfake_detection: deepfakeTrack,
        audio_analysis: {
          status: probe.hasAudio ? 'completed' : 'no_audio',
          summary: probe.hasAudio
            ? `Audio stream detected (${probe.audioCodec}, ${probe.audioSampleRate ?? 'unknown rate'}). Dedicated synthetic-voice model not configured.`
            : 'No audio track detected inside the uploaded video container.',
          findings: probe.hasAudio
            ? [`Codec: ${probe.audioCodec}`, `Sample rate: ${probe.audioSampleRate ?? 'N/A'}`]
            : [],
        },
        lip_sync_analysis: {
          status: 'unavailable',
          summary:
            'Dedicated acoustic-to-viseme lip-synchronisation detector is not configured in Free Mode.',
          findings: [],
        },
      },
    },
  };
}
