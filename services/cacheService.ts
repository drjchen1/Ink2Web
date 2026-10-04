import { GoogleGenAI } from "@google/genai";

interface ActiveCacheInfo {
  name: string;
  model: string;
  createdAt: number;
  expireTime?: string;
  approxTokenCount?: number;
}

let activeCache: ActiveCacheInfo | null = null;
let cacheFailureLogged = false;

/**
 * Attempts to create a server-side context cache for a multi-page document.
 * If the user's project/tier supports caching, this cuts input tokens by ~75% on subsequent calls.
 * If unsupported or quota limited, gracefully falls back without interrupting processing.
 */
export async function createDocumentContextCache(
  images: { base64: string; pageNumber: number }[],
  systemInstruction: string,
  model: string = 'gemini-3.8-flash'
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Caching is supported on Gemini models
  if (!model.includes('3.8-flash') && !model.includes('3.7-flash') && !model.includes('pro')) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const parts = images.flatMap(img => [
      { inlineData: { mimeType: 'image/jpeg', data: img.base64 } },
      { text: `Page ${img.pageNumber} reference image.` }
    ]);

    const cache = await ai.caches.create({
      model,
      config: {
        ttl: '3600s', // 1 hour TTL
        systemInstruction,
        contents: [
          {
            role: 'user',
            parts
          }
        ]
      }
    });

    if (cache?.name) {
      activeCache = {
        name: cache.name,
        model,
        createdAt: Date.now(),
        expireTime: cache.expireTime,
        approxTokenCount: (cache as any).usageMetadata?.totalTokenCount || images.length * 2500
      };
      console.log(`[Context Cache] Successfully cached document context: ${cache.name}`);
      return cache.name;
    }
  } catch (err: any) {
    if (!cacheFailureLogged) {
      const msg = err?.message || String(err);
      if (msg.includes('FreeTier') || msg.includes('limit=0') || msg.includes('429')) {
        console.info('[Context Cache] Note: Context caching requires a billing-enabled project. Running in high-speed direct mode.');
      } else {
        console.debug('[Context Cache] Context caching skipped:', msg);
      }
      cacheFailureLogged = true;
    }
  }

  return null;
}

/**
 * Returns the currently active cache name, if valid and not expired.
 */
export function getActiveCacheName(): string | null {
  if (!activeCache) return null;
  // If older than 50 minutes, consider expired
  if (Date.now() - activeCache.createdAt > 50 * 60 * 1000) {
    activeCache = null;
    return null;
  }
  return activeCache.name;
}

/**
 * Checks if context caching is active for the current document.
 */
export function isContextCacheActive(): boolean {
  return getActiveCacheName() !== null;
}

/**
 * Clears and deletes the active context cache.
 */
export async function clearActiveCache(): Promise<void> {
  if (!activeCache) return;
  const cacheName = activeCache.name;
  activeCache = null;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      await ai.caches.delete({ name: cacheName });
      console.log(`[Context Cache] Deleted cache: ${cacheName}`);
    }
  } catch (err) {
    // Ignore cleanup errors
  }
}
