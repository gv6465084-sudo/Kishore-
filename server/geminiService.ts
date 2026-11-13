import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const MODEL_ID = 'gemini-4-hydrogen';

export class GeminiServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = 'GeminiServiceError';
    this.statusCode = statusCode;
  }
}

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim() && key !== 'MY_GEMINI_API_KEY');
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new GeminiServiceError(
      'GEMINI_API_KEY is not configured in the server environment.',
      503
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const FREE_FALLBACK_MODEL_ID = 'gemini-3.1-flash-lite';

export function parseGeminiError(err: unknown): { statusCode: number; message: string; isQuota: boolean; isTransient: boolean } {
  if (err instanceof GeminiServiceError) {
    const isQuota = err.statusCode === 429 || /quota|rate limit|429|RESOURCE_EXHAUSTED/i.test(err.message);
    const isTransient = err.statusCode === 503 || /503|UNAVAILABLE|high demand/i.test(err.message);
    return {
      statusCode: err.statusCode,
      isQuota,
      isTransient,
      message: err.message,
    };
  }

  const raw = err instanceof Error ? err.message : String(err);
  let code = 502;
  let statusStr = '';
  let innerMsg = raw;

  try {
    const parsed = JSON.parse(raw) as { error?: { code?: number; message?: string; status?: string } };
    if (parsed?.error) {
      code = parsed.error.code ?? 502;
      statusStr = parsed.error.status ?? '';
      innerMsg = parsed.error.message ?? raw;
    }
  } catch {
    if (raw.includes('503') || raw.includes('UNAVAILABLE')) code = 503;
    else if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED') || /quota|rate limit/i.test(raw)) code = 429;
    else if (raw.includes('403') || raw.includes('PERMISSION_DENIED')) code = 403;
    else if (raw.includes('API_KEY_INVALID')) code = 400;
  }

  const isQuota = code === 429 || statusStr === 'RESOURCE_EXHAUSTED';
  const isTransient = code === 503 || statusStr === 'UNAVAILABLE';

  if (isQuota) {
    return {
      statusCode: 429,
      isQuota: true,
      isTransient: false,
      message:
        'Gemini API quota or rate limit exceeded. Please wait briefly or verify your API quota in Settings > Secrets.',
    };
  }
  if (isTransient) {
    return {
      statusCode: 503,
      isQuota: false,
      isTransient: true,
      message:
        'The Gemini verification model is temporarily experiencing high demand (503). Please retry in a few seconds.',
    };
  }
  if (code === 403 || raw.includes('API_KEY_INVALID')) {
    return {
      statusCode: 403,
      isQuota: false,
      isTransient: false,
      message:
        'Gemini API key was rejected or lacks permission. Please verify GEMINI_API_KEY in Settings > Secrets.',
    };
  }

  return {
    statusCode: code >= 400 && code < 600 ? code : 502,
    isQuota: false,
    isTransient: false,
    message: innerMsg,
  };
}

export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const info = parseGeminiError(err);
      if (attempt < maxAttempts && info.isTransient) {
        await new Promise((r) => setTimeout(r, 900 * attempt));
        continue;
      }
      throw new GeminiServiceError(info.message, info.statusCode);
    }
  }
  const finalInfo = parseGeminiError(lastError);
  throw new GeminiServiceError(finalInfo.message, finalInfo.statusCode);
}

export function extractJsonObject<T>(rawText: string | undefined): T {
  const text = (rawText ?? '').trim();
  if (!text) {
    throw new GeminiServiceError('Empty response received from Gemini model.', 502);
  }

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : text;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as T;
    }
    throw new GeminiServiceError('Failed to parse structured JSON from model output.', 502);
  }
}

export interface GroundingSource {
  title: string;
  url: string;
}

export async function runNewsVerificationWithGemini(prompt: string): Promise<{
  text: string;
  groundingSources: GroundingSource[];
  searchRateLimited: boolean;
}> {
  const ai = getGeminiClient();

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          seed: 42,
        },
      })
    );

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const seen = new Set<string>();
    const groundingSources: GroundingSource[] = [];

    for (const chunk of chunks) {
      const web = (chunk as { web?: { uri?: string; title?: string } }).web;
      if (web?.uri && !seen.has(web.uri)) {
        seen.add(web.uri);
        groundingSources.push({
          title: web.title || web.uri,
          url: web.uri,
        });
      }
    }

    return {
      text: response.text ?? '',
      groundingSources,
      searchRateLimited: false,
    };
  } catch (err) {
    const info = parseGeminiError(err);
    // If Google Search grounding hits a quota/rate limit, retry without the search tool
    // on free-tier models and let factCheckService enforce Inconclusive when no external citations exist.
    if (info.isQuota || info.isTransient) {
      const fallbackPrompt = `${prompt}\n\nNOTE: Live Web Search Grounding is temporarily unavailable on this free-tier request. Do NOT invent any URLs or citations. Base your analysis strictly on linguistic claim extraction, internal structure, and any Fact Check API or user-supplied URLs provided above, and set assessment to "Inconclusive" or "Suspicious" if independent source evidence is unavailable.`;
      try {
        const fallbackResp = await withRetry(() =>
          ai.models.generateContent({
            model: MODEL_ID,
            contents: fallbackPrompt,
            config: {
              responseMimeType: 'application/json',
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              seed: 42,
            },
          })
        );
        return {
          text: fallbackResp.text ?? '',
          groundingSources: [],
          searchRateLimited: true,
        };
      } catch (innerErr) {
        const innerInfo = parseGeminiError(innerErr);
        if (innerInfo.isQuota) {
          const liteResp = await withRetry(() =>
            ai.models.generateContent({
              model: FREE_FALLBACK_MODEL_ID,
              contents: fallbackPrompt,
              config: {
                responseMimeType: 'application/json',
                seed: 42,
              },
            })
          );
          return {
            text: liteResp.text ?? '',
            groundingSources: [],
            searchRateLimited: true,
          };
        }
        throw innerErr;
      }
    }
    throw err;
  }
}

export async function runMultimodalJsonWithGemini<T>(
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>,
  systemInstruction: string
): Promise<T> {
  const ai = getGeminiClient();

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: MODEL_ID,
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          seed: 42,
        },
      })
    );

    return extractJsonObject<T>(response.text);
  } catch (err) {
    const info = parseGeminiError(err);
    if (info.isQuota) {
      const liteResponse = await withRetry(() =>
        ai.models.generateContent({
          model: FREE_FALLBACK_MODEL_ID,
          contents: { parts },
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            seed: 42,
          },
        })
      );
      return extractJsonObject<T>(liteResponse.text);
    }
    throw err;
  }
}
