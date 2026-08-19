import { useCallback, useEffect, useRef, useState } from 'react';
import { handleIntent } from '@/command/intents';
import { ghostHint, parse } from '@/command/parser';
import { isSpeechRecognitionAvailable, startPushToTalk, type PttResult } from '@/command/voice-input';
import { cancelSpeech, speak } from '@/command/voice-output';
import { Panel } from '@/hud/Panel';

const MAX_VISIBLE_LOG = 3;
const voiceAvailable = isSpeechRecognitionAvailable();

function isField(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

export function CommandBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const pttRef = useRef<{ stop: () => Promise<PttResult> } | null>(null);
  const listeningRef = useRef(false);

  const [draft, setDraft] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [listening, setListening] = useState(false);

  const appendLog = useCallback((line: string) => {
    setLog((prev) => [...prev, line].slice(-MAX_VISIBLE_LOG));
  }, []);

  const dispatch = useCallback(
    (utterance: string, source: 'text' | 'voice') => {
      const trimmed = utterance.trim();
      if (!trimmed) return;
      try {
        const intent = parse(trimmed);
        const line = intent === null ? 'Command not recognized, sir.' : handleIntent(intent).log;
        appendLog(line);
        if (source === 'voice') speak(line);
      } catch {
        appendLog('Command failed, sir.');
        if (source === 'voice') speak('Command failed, sir.');
      }
    },
    [appendLog],
  );

  const beginPtt = useCallback(() => {
    if (listeningRef.current) return;
    if (!voiceAvailable) {
      appendLog('Voice link offline, sir.');
      return;
    }
    listeningRef.current = true;
    setListening(true);
    pttRef.current = startPushToTalk();
  }, [appendLog]);

  const finishPtt = useCallback(async () => {
    const session = pttRef.current;
    pttRef.current = null;
    listeningRef.current = false;
    setListening(false);
    if (!session) return;
    const result = await session.stop();
    if (!result.ok) {
      if (result.reason === 'denied') appendLog('Microphone access denied, sir.');
      if (result.reason === 'offline') appendLog('Voice link offline, sir.');
      return;
    }
    dispatch(result.transcript, 'voice');
  }, [appendLog, dispatch]);

  const abortPtt = useCallback(async () => {
    const session = pttRef.current;
    pttRef.current = null;
    listeningRef.current = false;
    setListening(false);
    if (!session) return;
    await session.stop();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '`') {
        e.preventDefault();
        if (!e.repeat) beginPtt();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setDraft('');
        cancelSpeech();
        void abortPtt();
        return;
      }

      const inField = isField(e.target);

      if (e.key === '/' && !inField) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      if (!inField && e.key.length === 1 && e.key !== '`') {
        e.preventDefault();
        inputRef.current?.focus();
        setDraft((current) => current + e.key);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === '`') {
        e.preventDefault();
        void finishPtt();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [abortPtt, beginPtt, finishPtt]);

  const hint = ghostHint(draft);

  return (
    <Panel
      title="COMMAND"
      depth={0.7}
      sweepDelay={3.6}
      surfaceClassName="bg-hud-surface/40"
      className="w-full max-w-[560px]"
    >
      <div className="flex flex-col gap-2">
        <div className="max-h-[4.5rem] overflow-hidden">
          <div className="flex flex-col justify-end gap-0.5">
            {log.map((line, i) => (
              <pre key={`${i}-${line.slice(0, 24)}`} data-readout className="m-0 text-[10px] leading-4 whitespace-pre-wrap text-hud-text-dim">
                {line}
              </pre>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-hud-border pt-2">
          <span className="font-hud-display text-[10px] tracking-[0.3em] text-hud-core">{'>'}</span>
          <div className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              type="text"
              aria-label="Command input"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const text = draft.trim();
                  setDraft('');
                  if (text) dispatch(text, 'text');
                }
                if (e.key === 'Tab' && hint) {
                  e.preventDefault();
                  setDraft(draft + hint);
                }
              }}
              className="font-hud-mono relative z-10 w-full bg-transparent text-xs tracking-wide text-hud-text outline-none"
            />
            {hint ? (
              <span aria-hidden className="font-hud-mono pointer-events-none absolute inset-0 text-xs tracking-wide text-hud-text-faint">
                <span className="invisible">{draft}</span>
                {hint}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Push to talk"
            disabled={!voiceAvailable}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              beginPtt();
            }}
            onPointerUp={() => {
              void finishPtt();
            }}
            onPointerCancel={() => {
              void abortPtt();
            }}
            className={`shrink-0 text-hud-core ${listening ? 'animate-hud-mic-pulse' : ''} ${voiceAvailable ? '' : 'opacity-30'}`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M6 11a6 6 0 0 0 12 0" />
              <path d="M12 17v3M8 20h8" />
            </svg>
          </button>
        </div>
      </div>
    </Panel>
  );
}
