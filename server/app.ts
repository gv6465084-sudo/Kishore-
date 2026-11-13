import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import type { AnalysisResult, LanguageCode } from '../src/types/analysis.ts';
import { analyzeNewsContent, isFactCheckConfigured } from './factCheckService.ts';
import { GeminiServiceError, isGeminiConfigured } from './geminiService.ts';
import { analyzeImageBuffer } from './imageForensics.ts';
import { buildMarkdownReport, buildPdfReportBuffer } from './reportService.ts';
import { MAX_UPLOAD_BYTES, sanitizeTextInput } from './security.ts';
import {
  analyzeClientVideoFrames,
  analyzeVideoBuffer,
  checkFfmpegAvailable,
} from './videoForensics.ts';

interface EphemeralChunkEntry {
  chunks: Array<Buffer | undefined>;
  receivedCount: number;
  totalChunks: number;
  totalBytes: number;
  originalName: string;
  expiresAt: number;
}

const ephemeralChunks = new Map<string, EphemeralChunkEntry>();

function pruneExpiredChunks() {
  const now = Date.now();
  for (const [id, entry] of ephemeralChunks.entries()) {
    if (entry.expiresAt <= now) {
      ephemeralChunks.delete(id);
    }
  }
}

function consumeEphemeralUpload(uploadId: string): { buffer: Buffer; originalName: string } {
  pruneExpiredChunks();
  const entry = ephemeralChunks.get(uploadId);
  if (!entry) {
    throw new Error('Upload session expired or not found. Please select the file and retry.');
  }
  ephemeralChunks.delete(uploadId);
  if (entry.receivedCount !== entry.totalChunks || entry.chunks.some((c) => !c)) {
    throw new Error('Incomplete file upload received. Please retry uploading.');
  }
  return {
    buffer: Buffer.concat(entry.chunks as Buffer[]),
    originalName: entry.originalName,
  };
}

function parseLanguage(raw: unknown): LanguageCode {
  return raw === 'ta' ? 'ta' : 'en';
}

function validateReportPayload(body: unknown): AnalysisResult {
  const data = body as Partial<AnalysisResult> | null;
  if (!data || !data.analysis_id || !data.assessment || !data.summary || !data.indicators) {
    throw new Error('Invalid or incomplete analysis payload for report generation.');
  }
  return data as AnalysisResult;
}

export function createTruthScanApp(options?: { serverless?: boolean }): Express {
  const isServerless = Boolean(options?.serverless);
  const app = express();
  app.set('trust proxy', 1);

  // Normalize Netlify Functions prefix if invoked directly or rewritten
  app.use((req, _res, next) => {
    if (req.url.startsWith('/.netlify/functions/api')) {
      const stripped = req.url.replace(/^\/\.netlify\/functions\/api/, '');
      req.url = stripped.startsWith('/') ? stripped : `/${stripped}`;
    }
    next();
  });

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  const envOrigins = [
    ...(process.env.ALLOWED_ORIGINS || '').split(','),
    process.env.APP_URL || '',
    process.env.URL || '',
    process.env.DEPLOY_PRIME_URL || '',
  ]
    .map((o) => o.trim())
    .filter(Boolean);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const isAllowedFreeOrigin =
      !origin ||
      envOrigins.length === 0 ||
      envOrigins.includes(origin) ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) ||
      /^https:\/\/[a-z0-9-]+\.(run\.app|vercel\.app|onrender\.com|pages\.dev|netlify\.app)$/i.test(
        origin
      );

    if (origin && isAllowedFreeOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, X-Upload-Id, X-Chunk-Index, X-Total-Chunks, X-Filename'
      );
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  const chunkLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    keyGenerator: (req) =>
      String(
        req.headers['x-nf-client-connection-ip'] ||
          req.headers['x-forwarded-for'] ||
          req.ip ||
          'anonymous-client'
      ),
    message: { error: 'Too many chunk upload requests. Please wait briefly and try again.' },
  });

  app.post(
    '/api/upload/chunk',
    chunkLimiter,
    express.raw({ type: 'application/octet-stream', limit: '2mb' }),
    (req: Request, res: Response) => {
      if (isServerless) {
        res.status(400).json({ error: 'Chunked stateful uploads are disabled in serverless mode.' });
        return;
      }

      pruneExpiredChunks();
      const uploadId = sanitizeTextInput(req.header('x-upload-id'), 80);
      const chunkIndex = Number(req.header('x-chunk-index'));
      const totalChunks = Number(req.header('x-total-chunks'));
      const rawName = req.header('x-filename') || 'uploaded-media';
      let decodedName = rawName;
      try {
        decodedName = decodeURIComponent(rawName);
      } catch {
        decodedName = rawName;
      }
      const originalName = sanitizeTextInput(decodedName, 160) || 'uploaded-media';

      if (
        !uploadId ||
        !/^[a-zA-Z0-9_-]{8,80}$/.test(uploadId) ||
        !Number.isInteger(chunkIndex) ||
        !Number.isInteger(totalChunks) ||
        totalChunks < 1 ||
        totalChunks > 64 ||
        chunkIndex < 0 ||
        chunkIndex >= totalChunks
      ) {
        res.status(400).json({ error: 'Invalid chunk upload metadata headers.' });
        return;
      }

      const chunkBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      if (chunkBuf.length === 0) {
        res.status(400).json({ error: 'Empty upload chunk received.' });
        return;
      }

      let entry = ephemeralChunks.get(uploadId);
      if (!entry) {
        entry = {
          chunks: new Array<Buffer | undefined>(totalChunks),
          receivedCount: 0,
          totalChunks,
          totalBytes: 0,
          originalName,
          expiresAt: Date.now() + 3 * 60 * 1000,
        };
        ephemeralChunks.set(uploadId, entry);
      }

      if (entry.totalChunks !== totalChunks) {
        ephemeralChunks.delete(uploadId);
        res.status(400).json({ error: 'Mismatched chunk count for upload session.' });
        return;
      }

      if (!entry.chunks[chunkIndex]) {
        entry.receivedCount += 1;
        entry.totalBytes += chunkBuf.length;
      } else {
        entry.totalBytes = entry.totalBytes - entry.chunks[chunkIndex]!.length + chunkBuf.length;
      }

      if (entry.totalBytes > MAX_UPLOAD_BYTES) {
        ephemeralChunks.delete(uploadId);
        res.status(413).json({ error: 'Uploaded file exceeds the 20 MB maximum size limit.' });
        return;
      }

      entry.chunks[chunkIndex] = chunkBuf;
      entry.expiresAt = Date.now() + 3 * 60 * 1000;

      res.json({ ok: true, received: entry.receivedCount, total: entry.totalChunks });
    }
  );

  app.use(express.json({ limit: '15mb' }));

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 45,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    keyGenerator: (req) =>
      String(
        req.headers['x-nf-client-connection-ip'] ||
          req.headers['x-forwarded-for'] ||
          req.ip ||
          'anonymous-client'
      ),
    message: { error: 'Too many verification requests. Please wait a minute before trying again.' },
  });
  app.use('/api', apiLimiter);

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_UPLOAD_BYTES,
      files: 1,
    },
  });

  function optionalMultipartUpload(req: Request, res: Response, next: NextFunction) {
    if (req.is('multipart/form-data')) {
      upload.single('file')(req, res, next);
      return;
    }
    next();
  }

  app.get('/health', async (_req: Request, res: Response) => {
    const ffmpegAvailable = isServerless ? false : await checkFfmpegAvailable();
    res.json({
      status: 'ok',
      free_mode: true,
      privacy_mode: 'ephemeral_no_storage',
      capabilities: {
        gemini_configured: isGeminiConfigured(),
        fact_check_api_configured: isFactCheckConfigured(),
        local_forensics_available: true,
        ffmpeg_available: ffmpegAvailable,
        serverless: isServerless,
      },
      supported_languages: ['en', 'ta'],
    });
  });

  app.get('/api/config/languages', (_req: Request, res: Response) => {
    res.json({
      default: 'en',
      supported: [
        { code: 'en', label: 'English', native_label: 'English' },
        { code: 'ta', label: 'Tamil', native_label: 'தமிழ்' },
      ],
    });
  });

  app.get('/api/config/modules', async (_req: Request, res: Response) => {
    const ffmpegAvailable = isServerless ? false : await checkFfmpegAvailable();
    res.json({
      free_mode: true,
      max_upload_bytes: MAX_UPLOAD_BYTES,
      max_upload_mb: 20,
      modules: [
        {
          id: 'news',
          name: 'NewsCheck',
          inputs: ['article', 'headline', 'social', 'url'],
          languages: ['en', 'ta'],
          fact_check_api_configured: isFactCheckConfigured(),
        },
        {
          id: 'image',
          name: 'ImageCheck',
          accepted_formats: ['JPG', 'JPEG', 'PNG', 'WebP'],
          local_forensics_available: true,
          specialised_detector_configured: false,
        },
        {
          id: 'video',
          name: 'VideoCheck',
          accepted_formats: ['MP4', 'MOV', 'WEBM', 'M4V'],
          ffmpeg_available: ffmpegAvailable,
          specialised_deepfake_configured: false,
        },
      ],
    });
  });

  app.post('/api/news/analyze', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        input_mode?: string;
        text?: string;
        url?: string;
        evidence_urls?: string[];
        language?: string;
      };

      const allowedModes = ['article', 'headline', 'social', 'url'] as const;
      const inputMode = allowedModes.includes(body.input_mode as (typeof allowedModes)[number])
        ? (body.input_mode as 'article' | 'headline' | 'social' | 'url')
        : 'article';

      const result = await analyzeNewsContent({
        inputMode,
        text: body.text,
        url: body.url,
        evidenceUrls: Array.isArray(body.evidence_urls) ? body.evidence_urls : undefined,
        language: parseLanguage(body.language),
      });

      res.json(result);
    } catch (err) {
      const status = err instanceof GeminiServiceError ? err.statusCode : 400;
      const message = err instanceof Error ? err.message : 'News verification failed.';
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/image/analyze', optionalMultipartUpload, async (req: Request, res: Response) => {
    try {
      let buffer: Buffer;
      let originalName = 'uploaded-image';

      if (req.file) {
        buffer = req.file.buffer;
        originalName = sanitizeTextInput(req.file.originalname || 'uploaded-image', 160);
      } else if (typeof req.body?.upload_id === 'string' && req.body.upload_id.trim()) {
        const assembled = consumeEphemeralUpload(req.body.upload_id.trim());
        buffer = assembled.buffer;
        originalName = assembled.originalName;
      } else {
        res.status(400).json({ error: 'No image file uploaded. Supported: JPG, JPEG, PNG, WebP (max 20 MB).' });
        return;
      }

      const result = await analyzeImageBuffer({
        buffer,
        originalName,
        language: parseLanguage(req.body?.language),
      });

      res.json(result);
    } catch (err) {
      const status = err instanceof GeminiServiceError ? err.statusCode : 400;
      const message = err instanceof Error ? err.message : 'Image forensic analysis failed.';
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/video/analyze', optionalMultipartUpload, async (req: Request, res: Response) => {
    try {
      let buffer: Buffer;
      let originalName = 'uploaded-video';

      if (req.file) {
        buffer = req.file.buffer;
        originalName = sanitizeTextInput(req.file.originalname || 'uploaded-video', 160);
      } else if (typeof req.body?.upload_id === 'string' && req.body.upload_id.trim()) {
        const assembled = consumeEphemeralUpload(req.body.upload_id.trim());
        buffer = assembled.buffer;
        originalName = assembled.originalName;
      } else {
        res.status(400).json({ error: 'No video file uploaded. Supported: MP4, MOV, WEBM, M4V (max 20 MB).' });
        return;
      }

      const result = await analyzeVideoBuffer({
        buffer,
        originalName,
        language: parseLanguage(req.body?.language),
      });

      res.json(result);
    } catch (err) {
      const status = err instanceof GeminiServiceError ? err.statusCode : 400;
      const message = err instanceof Error ? err.message : 'Video verification failed.';
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/video/analyze-frames', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        filename?: string;
        mime_type?: string;
        file_size_bytes?: number;
        duration_sec?: number;
        width?: number;
        height?: number;
        language?: string;
        frames?: Array<{ timestamp_sec?: number; data_base64?: string }>;
      };

      if (!Array.isArray(body.frames) || body.frames.length === 0) {
        res.status(400).json({ error: 'No sampled video frames provided.' });
        return;
      }

      const decodedFrames = body.frames
        .slice(0, 6)
        .filter((f) => typeof f?.data_base64 === 'string' && f.data_base64.length > 0)
        .map((f, idx) => ({
          timestamp_sec: typeof f.timestamp_sec === 'number' ? f.timestamp_sec : idx,
          buf: Buffer.from(f.data_base64!, 'base64'),
        }));

      const result = await analyzeClientVideoFrames({
        frames: decodedFrames,
        originalName: sanitizeTextInput(body.filename || 'uploaded-video', 160),
        mimeType: sanitizeTextInput(body.mime_type || 'video/mp4', 80),
        fileSizeBytes: Number(body.file_size_bytes || 0),
        durationSec: Number(body.duration_sec || 0),
        width: Number(body.width || 640),
        height: Number(body.height || 360),
        language: parseLanguage(body.language),
      });

      res.json(result);
    } catch (err) {
      const status = err instanceof GeminiServiceError ? err.statusCode : 400;
      const message = err instanceof Error ? err.message : 'Video frame analysis failed.';
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/report/json', (req: Request, res: Response) => {
    try {
      const result = validateReportPayload(req.body);
      const exportPayload = {
        platform: 'TruthScan AI',
        tagline: 'Verify the Content. Reveal the Evidence. Protect the Truth.',
        privacy_notice: 'Generated on demand without permanent server storage.',
        ...result,
      };
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="truthscan-${result.analysis_id}.json"`);
      res.send(JSON.stringify(exportPayload, null, 2));
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid report data.' });
    }
  });

  app.post('/api/report/markdown', (req: Request, res: Response) => {
    try {
      const result = validateReportPayload(req.body);
      const md = buildMarkdownReport(result);
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="truthscan-${result.analysis_id}.md"`);
      res.send(md);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid report data.' });
    }
  });

  app.post('/api/report/pdf', async (req: Request, res: Response) => {
    try {
      const result = validateReportPayload(req.body);
      const pdfBuffer = await buildPdfReportBuffer(result);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="truthscan-${result.analysis_id}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'PDF report generation failed.' });
    }
  });

  // Multer & global API error handler
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'Uploaded file exceeds the 20 MB maximum size limit.' });
        return;
      }
      res.status(400).json({ error: `Upload error: ${err.message}` });
      return;
    }
    if (req.path.startsWith('/api')) {
      const msg = err instanceof Error ? err.message : 'Internal server error.';
      res.status(500).json({ error: msg });
      return;
    }
    next(err);
  });

  return app;
}
