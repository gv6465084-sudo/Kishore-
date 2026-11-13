import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

export function generateAnalysisId(): string {
  return `TS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export function sanitizeTextInput(input: unknown, maxLength = 25000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Wraps untrusted user-submitted text in explicit data delimiters so the LLM
 * treats embedded instructions, markdown, or prompt-injection attempts purely as data.
 */
export function wrapUntrustedContent(label: string, content: string): string {
  const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, '_');
  const escaped = content.replace(/<\/untrusted_data/gi, '&lt;/untrusted_data');
  return `<untrusted_data field="${safeLabel}">\n${escaped}\n</untrusted_data>`;
}

export function verifyImageSignature(buffer: Buffer): { valid: boolean; detectedFormat: string; mimeType: string } {
  if (buffer.length < 12) {
    return { valid: false, detectedFormat: 'unknown', mimeType: 'application/octet-stream' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedFormat: 'JPEG', mimeType: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedFormat: 'PNG', mimeType: 'image/png' };
  }

  // WebP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { valid: true, detectedFormat: 'WebP', mimeType: 'image/webp' };
  }

  return { valid: false, detectedFormat: 'unknown', mimeType: 'application/octet-stream' };
}

export function verifyVideoSignature(buffer: Buffer): { valid: boolean; detectedFormat: string; mimeType: string } {
  if (buffer.length < 12) {
    return { valid: false, detectedFormat: 'unknown', mimeType: 'application/octet-stream' };
  }

  // WebM / Matroska: 1A 45 DF A3
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return { valid: true, detectedFormat: 'WebM', mimeType: 'video/webm' };
  }

  // AVI: RIFF....AVI 
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'AVI '
  ) {
    return { valid: true, detectedFormat: 'AVI', mimeType: 'video/x-msvideo' };
  }

  // ISO Base Media File Format (MP4, M4V, QuickTime MOV): 'ftyp' at offset 4,
  // or 'wide'/'free'/'skip'/'moov'/'mdat' leading atom before 'ftyp'
  const boxTag = buffer.subarray(4, 8).toString('ascii');
  if (boxTag === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString('ascii');
    if (brand.startsWith('qt')) {
      return { valid: true, detectedFormat: 'MOV', mimeType: 'video/quicktime' };
    }
    if (brand === 'M4V ') {
      return { valid: true, detectedFormat: 'M4V', mimeType: 'video/x-m4v' };
    }
    return { valid: true, detectedFormat: 'MP4', mimeType: 'video/mp4' };
  }

  const headSlice = buffer.subarray(0, Math.min(64, buffer.length)).toString('ascii');
  if (
    boxTag === 'wide' ||
    boxTag === 'free' ||
    boxTag === 'skip' ||
    boxTag === 'moov' ||
    boxTag === 'mdat' ||
    headSlice.includes('ftyp')
  ) {
    return {
      valid: true,
      detectedFormat: boxTag === 'wide' ? 'MOV' : 'MP4',
      mimeType: boxTag === 'wide' ? 'video/quicktime' : 'video/mp4',
    };
  }

  return { valid: false, detectedFormat: 'unknown', mimeType: 'application/octet-stream' };
}

export function isPrivateOrLocalHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }

  if (net.isIPv4(hostname)) {
    const parts = hostname.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 0) return true;
  }

  if (net.isIPv6(hostname)) {
    if (lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) {
      return true;
    }
  }

  return false;
}

export function validateExternalUrl(rawUrl: string): URL {
  const cleaned = sanitizeTextInput(rawUrl, 2048);
  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch {
    throw new Error('Invalid URL format. Provide a full http:// or https:// URL.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are permitted.');
  }

  if (isPrivateOrLocalHost(parsed.hostname)) {
    throw new Error('Private network and localhost URLs are blocked for security.');
  }

  return parsed;
}

export async function createEphemeralTempDir(prefix = 'truthscan-'): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function cleanupTempDir(dirPath: string | null | undefined): Promise<void> {
  if (!dirPath) return;
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch {
    // Best-effort silent cleanup to avoid masking primary errors
  }
}
