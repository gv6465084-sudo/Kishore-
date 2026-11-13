import { apiUrl } from '../context/SessionContext';
import type { AnalysisResult, LanguageCode } from '../types/analysis';

const DIRECT_UPLOAD_THRESHOLD_BYTES = 700 * 1024; // 700 KB
const SERVERLESS_DIRECT_MAX_BYTES = 3.8 * 1024 * 1024; // Stay under Netlify 6 MB function payload limit
const CHUNK_SIZE_BYTES = 700 * 1024; // 700 KB per chunk stays safely below proxy body limits

async function parseJsonOrThrow<T>(res: Response, fallbackMessage: string): Promise<T> {
  const rawText = await res.text();
  let data: (T & { error?: string }) | null = null;
  try {
    data = rawText ? (JSON.parse(rawText) as T & { error?: string }) : null;
  } catch {
    data = null;
  }
  if (!res.ok || !data) {
    throw new Error(data?.error || `${fallbackMessage} (HTTP ${res.status}).`);
  }
  return data;
}

async function compressImageForServerless(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode image in browser.'));
      el.src = objectUrl;
    });

    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const w = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
    const h = Math.max(1, Math.round((img.naturalHeight || 1) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
    );
    return blob && blob.size > 0 && blob.size < file.size ? blob : file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function uploadSingleChunkWithRetry(
  chunk: Blob,
  uploadId: string,
  index: number,
  totalChunks: number,
  filename: string
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(apiUrl('/api/upload/chunk'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Upload-Id': uploadId,
          'X-Chunk-Index': String(index),
          'X-Total-Chunks': String(totalChunks),
          'X-Filename': encodeURIComponent(filename),
        },
        body: chunk,
      });
      await parseJsonOrThrow<{ ok: boolean }>(res, 'Chunk upload failed');
      return;
    } catch (err) {
      lastError = err;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Chunk upload failed.');
}

async function uploadFileInChunks(
  file: File,
  onProgress?: (label: string) => void
): Promise<string> {
  const uploadId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE_BYTES));

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE_BYTES;
    const end = Math.min(file.size, start + CHUNK_SIZE_BYTES);
    onProgress?.(`${i + 1}/${totalChunks}`);
    await uploadSingleChunkWithRetry(
      file.slice(start, end),
      uploadId,
      i,
      totalChunks,
      file.name
    );
  }

  return uploadId;
}

export async function analyzeMediaFile(params: {
  endpoint: '/api/image/analyze' | '/api/video/analyze';
  file: File;
  language: LanguageCode;
  fallbackError: string;
  serverless?: boolean;
  onUploadProgress?: (label: string | null) => void;
}): Promise<AnalysisResult> {
  const { endpoint, file, language, fallbackError, serverless, onUploadProgress } = params;

  // In stateless serverless deployments (e.g. Netlify Functions), multi-request sticky RAM chunks
  // are not shared across invocations; upload directly within Netlify's 6 MB payload limit.
  if (serverless) {
    let payloadBlob: Blob = file;
    if (endpoint === '/api/image/analyze' && file.size > SERVERLESS_DIRECT_MAX_BYTES) {
      payloadBlob = await compressImageForServerless(file);
    }
    const formData = new FormData();
    formData.append('file', payloadBlob, file.name);
    formData.append('language', language);
    const res = await fetch(apiUrl(endpoint), {
      method: 'POST',
      body: formData,
    });
    return await parseJsonOrThrow<AnalysisResult>(res, fallbackError);
  }

  // Small files use single-request multipart upload; larger files use ephemeral chunked upload
  // to stay well under hosted proxy limits and avoid mobile connection drops.
  if (file.size <= DIRECT_UPLOAD_THRESHOLD_BYTES) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      const res = await fetch(apiUrl(endpoint), {
        method: 'POST',
        body: formData,
      });
      return await parseJsonOrThrow<AnalysisResult>(res, fallbackError);
    } catch (err) {
      const isNetworkErr = err instanceof TypeError;
      if (!isNetworkErr) throw err;
      // Fall through to chunked upload if direct upload hit a network/proxy failure
    }
  }

  const uploadId = await uploadFileInChunks(file, (progress) => {
    onUploadProgress?.(progress);
  });
  onUploadProgress?.(null);

  const res = await fetch(apiUrl(endpoint), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      upload_id: uploadId,
      language,
    }),
  });

  return await parseJsonOrThrow<AnalysisResult>(res, fallbackError);
}

/**
 * Fallback for VideoCheck when running serverless (without FFmpeg) or when slow mobile
 * connections cannot upload the raw video: extracts up to 4 representative JPEG frames
 * directly from the browser's decoded <video> element.
 */
export async function extractClientVideoFramesAndAnalyze(params: {
  file: File;
  language: LanguageCode;
}): Promise<AnalysisResult> {
  const { file, language } = params;
  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Browser video metadata load timed out.')), 10000);
      video.onloadeddata = () => {
        clearTimeout(timer);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Browser could not decode this video format locally.'));
      };
    });

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 360;
    const targetW = Math.min(512, width);
    const targetH = Math.max(2, Math.round((targetW * height) / Math.max(1, width)));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable for frame sampling.');
    }

    const count = duration < 2 ? 2 : 4;
    const usableDuration = Math.max(0.1, duration - 0.08);
    const sampledFrames: Array<{ timestamp_sec: number; data_base64: string }> = [];

    for (let i = 0; i < count; i++) {
      const t = Number((((i + 0.5) / count) * usableDuration).toFixed(2));
      await new Promise<void>((resolve) => {
        if (Math.abs(video.currentTime - t) < 0.01) {
          resolve();
          return;
        }
        const seekTimeout = setTimeout(resolve, 2500);
        video.onseeked = () => {
          clearTimeout(seekTimeout);
          resolve();
        };
        try {
          video.currentTime = t;
        } catch {
          clearTimeout(seekTimeout);
          resolve();
        }
      });

      ctx.drawImage(video, 0, 0, targetW, targetH);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      const b64 = dataUrl.split(',')[1] || '';
      if (b64) {
        sampledFrames.push({ timestamp_sec: t, data_base64: b64 });
      }
    }

    if (sampledFrames.length === 0) {
      throw new Error('Could not extract frames from browser video playback.');
    }

    const res = await fetch(apiUrl('/api/video/analyze-frames'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        mime_type: file.type || 'video/mp4',
        file_size_bytes: file.size,
        duration_sec: Number(duration.toFixed(2)),
        width,
        height,
        language,
        frames: sampledFrames,
      }),
    });

    return await parseJsonOrThrow<AnalysisResult>(res, 'Video frame analysis failed');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
