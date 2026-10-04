import { GoogleGenAI } from "@google/genai";

// In-memory cache for audio snippets (keyed by content hash to prevent redundant API calls)
const audioCache = new Map<string, string>();
// In-memory cache for generated spoken transcripts
const transcriptCache = new Map<string, string>();

let currentPlayingAudio: HTMLAudioElement | null = null;
let currentStopCallback: (() => void) | null = null;

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

/**
 * Strips HTML tags and extracts text suitable for mathematical speech narration.
 */
export function extractTextForSpeech(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove buttons, edit triggers, and raw hidden elements
  doc.querySelectorAll('button, script, style, .edit-figure-btn, [aria-hidden="true"]').forEach(el => el.remove());

  // Replace figure images with their alt and caption text
  doc.querySelectorAll('figure').forEach(fig => {
    const img = fig.querySelector('img');
    const caption = fig.querySelector('figcaption');
    const altText = img?.getAttribute('alt') || '';
    const captionText = caption?.textContent || '';
    const replacement = document.createElement('p');
    replacement.textContent = `Figure: ${altText}. ${captionText}`;
    fig.replaceWith(replacement);
  });

  const text = doc.body.textContent || '';
  // Collapse whitespace
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Checks if a generated spoken transcript is already cached in memory.
 */
export function getCachedTranscript(rawText: string): string | undefined {
  const clean = rawText.trim();
  if (!clean) return undefined;
  return transcriptCache.get(hashString(clean));
}

/**
 * Converts mathematical lecture notes (including LaTeX formulas and equations)
 * into a clean, spoken English phonetic script that is ready to be read aloud.
 * 
 * Uses Gemini models with fast fallback (3.5-flash -> 3.7-flash -> 3.8-flash).
 */
export async function generateMathTranscript(rawContent: string): Promise<string> {
  const cleanText = rawContent.includes('<') ? extractTextForSpeech(rawContent) : rawContent.trim();
  if (!cleanText || cleanText.length < 3) {
    return cleanText;
  }

  const key = hashString(cleanText);
  if (transcriptCache.has(key)) {
    return transcriptCache.get(key)!;
  }

  const apiKey = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY__);
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  const prompt = `You are an educational mathematics lecturer creating a spoken reading script for students and accessibility screen-readers.
Convert the following mathematical notes into a clean, fluent spoken English script.

Rules:
1. Output ONLY the spoken words. Do not include any introductory phrases (e.g. do NOT say "Here is the transcript:", "Okay, let's begin:", or "This page discusses:").
2. Convert all mathematical notation, formulas, and LaTeX symbols into natural, spoken English phonetics:
   - Integrals: \\int_a^b -> "the integral from a to b of"
   - Fractions: \\frac{a}{b} -> "a over b"
   - Exponents: x^2 -> "x squared", x^n -> "x to the power of n"
   - Square roots: \\sqrt{x} -> "the square root of x"
   - Limits: \\lim_{x \\to 0} -> "the limit as x approaches zero of"
   - Derivatives: \\frac{dy}{dx} -> "the derivative of y with respect to x"
   - Sums: \\sum_{i=1}^n -> "the sum from i equals 1 to n of"
   - Greek letters and symbols: alpha, beta, theta, pi, partial, nabla, delta, etc.
3. Transcribe headings and definitions naturally as conversational transitions.
4. Keep the output clean, natural, and concise.

Content to transcribe:
${cleanText.slice(0, 4000)}`;

  const candidateModels = ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.8-flash'];
  let transcript = '';

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.2
        }
      });

      let text = response.text?.trim() || '';
      // Clean off any accidental meta-preamble
      text = text.replace(/^(Here is the (?:spoken )?(?:reading )?transcript:?|Spoken transcript:?|Transcript:?)\s*/i, '').trim();
      if (text) {
        transcript = text;
        break;
      }
    } catch (err) {
      console.warn(`Transcript generation failed on ${model}, attempting fallback:`, err);
    }
  }

  if (!transcript) {
    // Graceful fallback to cleaned raw text if model generation failed
    transcript = cleanText.slice(0, 2500);
  }

  transcriptCache.set(key, transcript);
  return transcript;
}

export interface SpeechGenerationResult {
  audioBase64: string;
  mimeType: string;
  fromCache: boolean;
  transcript: string;
}

/**
 * Checks if speech audio for the given text is already cached in memory.
 */
export function getCachedAudio(text: string, voiceName: string = 'Kore'): string | undefined {
  const cleanText = text.trim();
  if (!cleanText) return undefined;
  const cacheKey = `${voiceName}_${hashString(cleanText)}`;
  return audioCache.get(cacheKey);
}

/**
 * Generates natural spoken audio for mathematical content using gemini-3.8-flash-lite-tts.
 * 
 * CRITICAL: The audio model receives ONLY the pure spoken lecture transcript.
 * It NEVER receives prompts, instructions, or meta-commentary, ensuring that the voice
 * reads the lecture content immediately from the very first word.
 */
export async function generateMathSpeech(
  rawContentOrTranscript: string,
  voiceName: string = 'Kore',
  speechStyle: string = 'Clear, articulate mathematics lecturer'
): Promise<SpeechGenerationResult> {
  const cleanInput = rawContentOrTranscript.trim();
  if (!cleanInput) {
    throw new Error('Text to speak cannot be empty');
  }

  // 1. Obtain or generate the clean spoken phonetic transcript
  // If the input doesn't look like an already processed transcript, generate one
  let spokenScript = cleanInput;
  if (cleanInput.includes('<') || cleanInput.includes('\\') || cleanInput.includes('$')) {
    spokenScript = await generateMathTranscript(cleanInput);
  }

  const cacheKey = `${voiceName}_${hashString(spokenScript)}`;
  if (audioCache.has(cacheKey)) {
    return {
      audioBase64: audioCache.get(cacheKey)!,
      mimeType: 'audio/wav',
      fromCache: true,
      transcript: spokenScript
    };
  }

  const apiKey = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY__);
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  // Limit script to 3000 chars for smooth single-take TTS rendering
  const textToSpeak = spokenScript.slice(0, 3000);

  let lastError: any = null;
  // Try up to 2 times in case of transient rate limit or network glitch
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                // CRITICAL: ONLY the clean transcript text is provided here.
                // NO system prompts or instructions to the AI are included.
                text: textToSpeak,
                speechMetadata: {
                  style: speechStyle
                }
              }
            ]
          }
        ] as any,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error('No audio returned by Gemini TTS');
      }

      audioCache.set(cacheKey, base64Audio);

      return {
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        fromCache: false,
        transcript: spokenScript
      };
    } catch (err) {
      lastError = err;
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }
  }

  throw lastError || new Error('Failed to generate math speech audio');
}

/**
 * Plays base64 WAV audio in the browser. Stops any currently playing audio.
 */
export function playAudioBase64(
  audioBase64: string,
  onEnded?: () => void,
  onError?: (err: any) => void
): { stop: () => void; audio: HTMLAudioElement } {
  // Stop existing playback
  stopCurrentAudio();

  const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
  currentPlayingAudio = audio;

  const handleEnded = () => {
    currentPlayingAudio = null;
    currentStopCallback = null;
    onEnded?.();
  };

  const handleError = (e: any) => {
    currentPlayingAudio = null;
    currentStopCallback = null;
    onError?.(e);
  };

  audio.addEventListener('ended', handleEnded, { once: true });
  audio.addEventListener('error', handleError, { once: true });

  const stop = () => {
    audio.removeEventListener('ended', handleEnded);
    audio.removeEventListener('error', handleError);
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (_) {}
    if (currentPlayingAudio === audio) {
      currentPlayingAudio = null;
      currentStopCallback = null;
    }
  };

  currentStopCallback = stop;

  audio.play().catch(err => {
    console.warn('Audio playback error:', err);
    onError?.(err);
  });

  return { stop, audio };
}

/**
 * Stops any audio currently playing through playAudioBase64.
 */
export function stopCurrentAudio(): void {
  if (currentStopCallback) {
    try {
      currentStopCallback();
    } catch (_) {}
    currentStopCallback = null;
  }
  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
    } catch (_) {}
    currentPlayingAudio = null;
  }
}

/**
 * Checks whether audio is currently playing.
 */
export function isAudioPlaying(): boolean {
  return currentPlayingAudio !== null && !currentPlayingAudio.paused;
}
