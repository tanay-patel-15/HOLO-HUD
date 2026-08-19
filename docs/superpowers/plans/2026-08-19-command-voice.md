# Phase 4 Command & Voice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `"JARVIS, run diagnostics"` works spoken and typed through one `parse()` → handler path, with a center-overlay CommandBar, PTT voice-in, and voice-out only for mic-originated commands.

**Architecture:** Thin intent core. `parse(text) → Intent | null` is a pure function. Handlers return `{ log: string }` and never speak. `CommandBar` is the only place that knows `source: 'text' | 'voice'` and the only caller of `speak()`. Telemetry snapshots use `peekChannel`, never `navigator.*`.

**Tech Stack:** Vite 8 · React 19 · TypeScript · Zustand vanilla stores (`createStore` + `useStore`, same as `src/core/clock.ts`) · Web Speech API (`webkitSpeechRecognition` + `speechSynthesis`) · existing HUD tokens/Panel chrome.

## Global Constraints

- CLAUDE.md hard rules 1–6 remain in force (no GSAP on Three, one rAF loop, palette only from `tokens.css`, telemetry via `useTelemetry` in components / `peekChannel` in handlers, tabular-nums, no WebGL text).
- Spec copy is verbatim: `Command not recognized, sir.` / `Add what, sir.` / `Specify NOMINAL, ELEVATED, or CRITICAL, sir.` / `Voice link offline, sir.` / `Microphone access denied, sir.` / `Command failed, sir.` / `Palette protocols offline, sir. Phase six.` / `Single-viewport lock engaged, sir. Nowhere to navigate.` / `Nice try, sir.` / `Not yet, sir. Boot sequence is still on the bench.`
- PTT is hold backtick or hold mic glyph. `/` focuses the input but is not inserted. Typed `jarvis` / `jarvis,` prefix is stripped in the parser.
- `SpeechSynthesis` only when `source === 'voice'`. No unit-test framework — verify with `npx tsc -b`, `npm run lint`, `npm run build`, then the in-browser gate in the spec.
- No spoken wake-word, no Howler, no palette CSS, no Iron Man shutdown, no second rAF.

**Spec:** `docs/superpowers/specs/2026-08-19-command-voice-design.md`

---

### Task 1: Last-value cache + peekChannel

**Files:**
- Modify: `src/telemetry/registry.ts`

**Interfaces:**
- Consumes: existing `subscribeChannel`, `Channel`, `ChannelMap`
- Produces: `peekChannel<K extends Channel>(channel: K): ChannelMap[K] | undefined`

- [ ] **Step 1: Wrap every emission so the last value is cached**

Add a typed cache above `subscribeChannel`. Wrap the provider callback so both the cache and the subscriber see the same value, including the mandatory synchronous first emit:

```ts
const lastValues: Partial<{ [K in Channel]: ChannelMap[K] }> = {};

export function subscribeChannel<K extends Channel>(
  channel: K,
  emit: (value: ChannelMap[K]) => void,
): Unsubscribe {
  const entry = registry[channel];
  const provider = entry.primary.isAvailable() ? entry.primary : entry.fallback;
  return provider.subscribe((value) => {
    lastValues[channel] = value;
    emit(value);
  });
}

/** Non-React snapshot for command handlers. Components still use `useTelemetry`. */
export function peekChannel<K extends Channel>(channel: K): ChannelMap[K] | undefined {
  return lastValues[channel];
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b --pretty false`
Expected: clean (this file only, no unused locals).

- [ ] **Step 3: Commit**

```bash
git add src/telemetry/registry.ts
git commit -m "Add peekChannel last-value cache for command handlers"
```

---

### Task 2: Objectives store + Threat override

**Files:**
- Create: `src/hud/modules/objectives-store.ts`
- Modify: `src/hud/modules/Objectives.tsx`
- Create: `src/command/threat-override.ts`
- Modify: `src/hud/modules/ThreatLevel.tsx`

**Interfaces:**
- Consumes: existing `Objective` shape `{ id, text, done }`, storage key `holo-hud:objectives`, default five items from current `Objectives.tsx`
- Produces:
  - `objectivesStore` with `{ objectives: Objective[]; toggle(id: string): void; add(text: string): void }`
  - `useObjectives(): Objective[]`
  - `threatOverrideStore` with `{ level: ChannelMap['threat.level'] | null; set(level): void; clear(): void }`
  - `useThreatOverride(): ChannelMap['threat.level'] | null`

- [ ] **Step 1: Lift objectives into a vanilla Zustand store** (same `createStore` + `subscribeWithSelector` + `useStore` pattern as `src/core/clock.ts`)

`src/hud/modules/objectives-store.ts`:

- Export `Objective`, `STORAGE_KEY = 'holo-hud:objectives'`, `DEFAULT_OBJECTIVES` (unchanged five items).
- `loadObjectives()` same try/parse/fallback as today.
- `persist(objectives)` writes `JSON.stringify` to `STORAGE_KEY`.
- `add(text)`: trim, uppercase, slug id `${base}-${Date.now().toString(36)}` where `base` is `text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'objective'`.
- Call `persist` inside each `set`.

- [ ] **Step 2: Rewrite `Objectives.tsx` as a reader**

Subscribe with `useObjectives()`. `toggle(id)` calls `objectivesStore.getState().toggle(id)`. No local list state, no `useEffect` persist (store owns that). Keep the existing markup (STATUS count, click-to-toggle boxes).

- [ ] **Step 3: Threat override store**

`src/command/threat-override.ts`:

```ts
export interface ThreatOverrideState {
  level: ChannelMap['threat.level'] | null;
  set: (level: ChannelMap['threat.level']) => void;
  clear: () => void;
}
```

Session-only, no localStorage. `useThreatOverride()` selects `state.level`.

- [ ] **Step 4: `ThreatLevel.tsx` prefers override**

```ts
const derived = useTelemetry('threat.level');
const override = useThreatOverride();
const level = override ?? derived;
```

Keep `LEVEL_CLASS` and `valueClassName` as they are.

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc -b --pretty false && npm run lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/hud/modules/objectives-store.ts src/hud/modules/Objectives.tsx src/command/threat-override.ts src/hud/modules/ThreatLevel.tsx
git commit -m "Lift objectives and threat override into Zustand stores"
```

---

### Task 3: Parser + intent handlers

**Files:**
- Create: `src/command/parser.ts`
- Create: `src/command/intents.ts`

**Interfaces:**
- Consumes: `peekChannel`, `objectivesStore.add`, `threatOverrideStore.set/clear`
- Produces:
  - `parse(text: string): Intent | null`
  - `AUTOCOMPLETE_HINTS` (canonical phrases, no easter eggs)
  - `handleIntent(intent: Intent): { log: string }`
  - `Intent` union as in the spec, except `set_threat.level` is `ChannelMap['threat.level'] | null` so a bad/missing level still parses and the handler can reply `Specify NOMINAL, ELEVATED, or CRITICAL, sir.`

- [ ] **Step 1: Write `parser.ts`**

Rules, in order:
1. `trim` + `toLowerCase`
2. Strip one leading `jarvis,` or `jarvis` plus whitespace: `/^jarvis,?\s+/`
3. Ordered matches — `reset threat` / `clear threat` before any `set threat`; `sudo` and `i am iron man` exact; then diagnostics aliases (`run diagnostics`, `diagnostics`, `run diagnostic`); `add objective:?\s*(.*)`; `set threat(?:\s+level)?(?:\s+to)?(?:\s+(.*))?$` with level `nominal|elevated|critical` else `null`; palette aliases; `navigate(?:\s+(.*))?$`
4. Else `null`

Export:

```ts
export const AUTOCOMPLETE_HINTS = [
  'run diagnostics',
  'add objective ',
  'set threat ',
  'reset threat',
  'swap palette',
  'navigate',
] as const;
```

- [ ] **Step 2: Write `intents.ts`**

`handleIntent` switch, wrapped so callers can also try/catch:
- `diagnostics` — peek fps, jank, gpu, cores, heap, `power.level`, `net.type`, lat/lon, temp/condition, threat (`threatOverrideStore.getState().level ?? peekChannel('threat.level')`). Missing → `--`. Multi-line dump, `font-hud-mono` will apply in the log via `data-readout`.
- `add_objective` — empty text → `Add what, sir.`; else `objectivesStore.getState().add(text)` and log `Objective added: ${uppercase}.`
- `set_threat` — `level === null` → specify line; else `set(level)` and log `Threat set to ${level}.`
- `reset_threat` — `clear()` and `Threat override cleared.`
- stubs and easter eggs: exact spec strings.

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b --pretty false`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/command/parser.ts src/command/intents.ts
git commit -m "Add shared intent parser and command handlers"
```

---

### Task 4: Voice I/O + CommandBar overlay

**Files:**
- Create: `src/command/voice-input.ts`
- Create: `src/command/voice-output.ts`
- Create: `src/command/CommandBar.tsx`
- Modify: `src/hud/Panel.tsx` (optional `surfaceClassName`, default `bg-hud-surface/70`)
- Modify: `src/App.tsx` (mount CommandBar in the center `flex-1` gap)
- Modify: `src/styles/animations.css` (mic pulse keyframes, 137ms language)

**Interfaces:**
- Consumes: `parse`, `AUTOCOMPLETE_HINTS`, `handleIntent`, `speak`
- Produces:
  - `isSpeechRecognitionAvailable(): boolean`
  - `startPushToTalk(): { stop: () => Promise<PttResult> }`
  - `speak(text: string): void` / `cancelSpeech(): void`
  - `<CommandBar />`

`PttResult`:
```ts
export type PttResult =
  | { ok: true; transcript: string }
  | { ok: false; reason: 'offline' | 'denied' | 'empty' };
```

- [ ] **Step 1: `voice-input.ts`**

Resolve ctor as `window.SpeechRecognition || window.webkitSpeechRecognition` via a local constructor type (do not assume lib.dom ships `webkitSpeechRecognition`). `lang = 'en-US'`, `continuous = false`, `interimResults = false`. `start()` on PTT begin. `stop()` calls `recognition.stop()`, waits for `onend`, reads final transcript. Map `error === 'not-allowed'` → `denied`; `no-speech` / empty transcript → `empty`; missing ctor → `offline` without throwing.

- [ ] **Step 2: `voice-output.ts`**

If `speechSynthesis` missing, no-op. Else `cancel()` then `SpeechSynthesisUtterance` at rate `1.05`. Swallow exceptions. `cancelSpeech()` for Escape.

- [ ] **Step 3: Panel surface override**

Add `surfaceClassName?: string` defaulting to `bg-hud-surface/70`. Use it instead of a hardcoded surface class so CommandBar can pass `bg-hud-surface/40`.

- [ ] **Step 4: `CommandBar.tsx`**

- `Panel title="COMMAND"` `depth={0.7}` `sweepDelay={3.6}` `surfaceClassName="bg-hud-surface/40"` `className="w-full max-w-[560px]"`
- Log: last 3 entries visible, `max-h-[4.5rem] overflow-hidden`, newest at bottom, `data-readout` + `whitespace-pre-wrap` for diagnostics.
- Input: transparent, `font-hud-mono`, ghost suffix `text-hud-text-dim` from first `AUTOCOMPLETE_HINTS` entry whose lowercase prefix-matches the draft and is longer.
- Mic SVG button, `currentColor`, `animate-hud-mic-pulse` while PTT held; `disabled` + no pulse when recognition unavailable.
- `dispatch(utterance, source)`: empty → return. `parse` null → unrecognized line. Else `try { handleIntent } catch { Command failed }`. `speak(log)` only if `source === 'voice'`.
- Window `keydown`/`keyup` (capture): ignore `meta/ctrl/alt`. Backtick → preventDefault, start/stop PTT (`e.repeat` ignored on keydown). `/` when focus is not the input → preventDefault, focus input, do not insert. Other printable (length 1, not backtick) when focus is not the input → focus and insert. Escape → clear draft, `cancelSpeech`, abort PTT. Enter in input → submit text. Tab in input → accept ghost.
- Hold-mic: `pointerdown` start, `pointerup`/`pointerleave`/`pointercancel` stop. `preventDefault` so it doesn't steal focus from the input.

- [ ] **Step 5: Pulse animation**

```css
@keyframes hud-mic-pulse {
  50% { opacity: 0.35; }
}
.animate-hud-mic-pulse {
  animation: hud-mic-pulse 1.096s ease-in-out infinite; /* 8 × 137ms */
}
```

- [ ] **Step 6: Mount in `App.tsx`**

Replace the empty center `<div className="flex-1" />` with:

```tsx
<div className="flex flex-1 flex-col items-center justify-end px-4">
  <CommandBar />
</div>
```

- [ ] **Step 7: Typecheck, lint, build**

Run: `npx tsc -b --pretty false && npm run lint && npm run build`
Expected: all clean.

- [ ] **Step 8: Commit**

```bash
git add src/command/voice-input.ts src/command/voice-output.ts src/command/CommandBar.tsx src/hud/Panel.tsx src/App.tsx src/styles/animations.css
git commit -m "Add CommandBar overlay with push-to-talk voice I/O"
```

---

### Task 5: PROGRESS.md + in-browser gate

**Files:**
- Modify: `PROGRESS.md`
- Modify: `docs/superpowers/specs/2026-08-19-command-voice-design.md` (status → implemented)

- [ ] **Step 1: Update phase table** — Phase 3 note: PR #3 merged. Phase 4: done, PR pending. Header current phase = 4. Next session = Phase 5. Lock: command bar owns add-objective (done); PTT hybrid; stubs for palette/navigate. Add a short “Phase 4 — what was built” section listing `src/command/` and the peek/store files. Note: SpeechRecognition needs a user gesture (PTT already is one).

- [ ] **Step 2: In-browser gate** against `npm run dev` in Chrome:
  1. Type `run diagnostics` → dump, no TTS
  2. Type `JARVIS, run diagnostics` → same intent
  3. Hold backtick, say `run diagnostics` → same dump + TTS
  4. `add objective TEST ITEM` → OBJECTIVES + localStorage
  5. `set threat critical` → THREAT red; `reset threat` restores derived
  6. `swap palette` / `navigate` stubs; `sudo` → Nice try
  7. Zero console errors

- [ ] **Step 3: Commit**

```bash
git add PROGRESS.md docs/superpowers/specs/2026-08-19-command-voice-design.md
git commit -m "Mark Phase 4 command and voice complete in PROGRESS"
```
