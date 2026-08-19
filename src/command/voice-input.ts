export type PttResult =
  | { ok: true; transcript: string }
  | { ok: false; reason: 'offline' | 'denied' | 'empty' };

interface RecognitionErrorEvent extends Event {
  error: string;
}

interface RecognitionResultEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface RecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: RecognitionResultEvent) => void) | null;
  onerror: ((ev: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type RecognitionCtor = new () => RecognitionInstance;

function getRecognitionCtor(): RecognitionCtor | undefined {
  const w = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function isSpeechRecognitionAvailable(): boolean {
  return getRecognitionCtor() !== undefined;
}

/**
 * Microphone that emits a transcript string. Call `startPushToTalk()` on
 * key/glyph down; `stop()` on release. Does not know about intents.
 */
export function startPushToTalk(): { stop: () => Promise<PttResult> } {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    return {
      stop: () => Promise.resolve({ ok: false, reason: 'offline' }),
    };
  }

  const recognition = new Ctor();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  let transcript = '';
  let denied = false;
  let settled = false;
  let resolveEnd: (() => void) | null = null;
  const ended = new Promise<void>((resolve) => {
    resolveEnd = resolve;
  });

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1];
    if (result?.[0]) transcript = result[0].transcript.trim();
  };
  recognition.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') denied = true;
  };
  recognition.onend = () => {
    if (settled) return;
    settled = true;
    resolveEnd?.();
  };

  try {
    recognition.start();
  } catch {
    return {
      stop: () => Promise.resolve({ ok: false, reason: 'empty' }),
    };
  }

  return {
    async stop() {
      try {
        recognition.stop();
      } catch {
        /* already stopped */
      }
      await ended;
      if (denied) return { ok: false, reason: 'denied' };
      if (!transcript) return { ok: false, reason: 'empty' };
      return { ok: true, transcript };
    },
  };
}
