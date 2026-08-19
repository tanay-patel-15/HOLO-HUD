# Phase 4 — Command & Voice

**Date:** 2026-08-19
**Status:** Approved design, pending implementation plan
**Gate:** `"JARVIS, run diagnostics"` works spoken *and* typed, through one code path.

## Context

Phase 3 is merged (`main` @ `ab7ea19`). Every HUD panel reads live telemetry via `useTelemetry(channel)`. Mission objectives exist as a localStorage-backed checklist (`hud/modules/Objectives.tsx`) with read + toggle-complete only — adding an item is explicitly Phase 4’s job.

ROADMAP Phase 4: a shared intent parser; text command bar and voice both produce the same intent objects; SpeechRecognition in, SpeechSynthesis out.

## Locked decisions

These are not open to relitigation during implementation:

1. **Thin intent core.** Typed discriminated union. `parse(text) → Intent | null`. No fuzzy NL, no shell grammar, no conversation state.
2. **Hybrid voice.** Push-to-talk is the real spoken path (hold backtick *or* hold mic glyph). Typed `JARVIS,` / `jarvis` is an optional prefix the parser strips. Spoken wake-word listening is Phase 6.
3. **Full ROADMAP command list.** Diagnostics, add-objective, set-threat, easter eggs have real effects. `swap palette` and `navigate` are real parser hits that reply in-universe that those systems are offline — no fake UI, no Phase 6 palette work pulled forward.
4. **Voice-in, voice-out.** `SpeechSynthesis` runs only when the command’s `source === 'voice'`. Typed commands stay silent in the log. Phase 5’s mute will wrap both Howler and `speechSynthesis.cancel()`.
5. **CommandBar placement.** Low overlay in the center reactor gap (~560px, centered), not a fourth full-width panel. DATA FEED stays the only bottom hairline bar.
6. **Iron Man easter egg** is a parser hit with a witty log reply only. No shutdown / reboot sequence (Phase 5 owns boot).
7. **`reset threat` exists** so a session override can be cleared without a reload.

## Architecture

One pipeline. The input device is metadata, not a parser branch.

```
typed string ─┐
              ├─► parse(text) ► Intent | null ► handler(intent) ► { log: string }
PTT transcript┘                                              │
                                                             ├─► always: append response log
                                                             └─► only if source === 'voice': speak(log)
```

- `parser.ts` is a pure function of a string. It does not know about React, the mic, or TTS.
- `intents.ts` maps `Intent` → `{ log: string }`. Handlers never speak and never call `navigator.*`.
- `CommandBar.tsx` is the only place that knows `source: 'text' | 'voice'` and the only caller of `speak()`.
- `voice-input.ts` is a microphone that emits a transcript string or an error.
- `voice-output.ts` is a speaker that takes a string. No-op if `speechSynthesis` is missing.

## File map

New, under `src/command/` (ROADMAP tree):

| File | Responsibility |
|---|---|
| `parser.ts` | Lowercase, strip optional `jarvis,` / `jarvis` prefix, match an ordered pattern table, return `Intent \| null` |
| `intents.ts` | `Intent` discriminated union + one handler per type |
| `CommandBar.tsx` | Overlay UI: input, ghost autocomplete, 3-line log, mic glyph, PTT key wiring |
| `voice-input.ts` | `SpeechRecognition` start/stop for PTT |
| `voice-output.ts` | `speechSynthesis.speak` / cancel |
| `threat-override.ts` | Zustand store, session-only. `level: ChannelMap['threat.level'] \| null` |

Lifted / extended:

| File | Change |
|---|---|
| `hud/modules/objectives-store.ts` | **New.** Zustand + localStorage. Persistence key remains `holo-hud:objectives`. Seeded defaults stay the current five thematic items. |
| `hud/modules/Objectives.tsx` | Becomes a reader/toggler of the store. No local `useState` for the list. |
| `hud/modules/ThreatLevel.tsx` | Prefers threat-override when non-null; otherwise `useTelemetry('threat.level')`. |
| `telemetry/registry.ts` | Last-value cache + `peekChannel(channel)` for non-React snapshots (diagnostics). Components still only use `useTelemetry`. |
| `App.tsx` | Mount `<CommandBar />` in the existing center `flex-1` gap, bottom-aligned. |

No new rAF loop. No GSAP on Three.js objects. No hardcoded palette colors — HUD chrome uses existing tokens (`text-hud-*`, `--hud-*`).

## CommandBar & voice UX

**Placement.** Inside the current center `flex-1` column, `justify-end`, horizontally centered, `max-w` ~560px. Lighter chrome than side `Panel`s (lower fill opacity, still chamfered / corner ticks so it belongs to the HUD) so the reactor remains the hero. `depth` ~0.7 (same hairline layer as SYSTEM STATUS).

**Input.**
- Always visible. Always focusable.
- `/` focuses the field but is **not** inserted (game-chat convention). The parser does not have to strip a leading slash.
- Any other printable key, when focus is not already in the field, focuses it and inserts that character. Backtick is not in this set — it is PTT.
- `Enter` submits. Empty submit is ignored (no log line).
- `Escape` clears the draft and cancels in-flight PTT.
- `Tab` accepts the autocomplete ghost.

**Autocomplete.** Ghost suffix after the caret (dim cyan, `text-hud-text-dim`), not a dropdown. Prefix-match against canonical phrases only:

- `run diagnostics`
- `add objective `
- `set threat `
- `reset threat`
- `swap palette`
- `navigate`

Easter eggs are **not** in the hint list.

**Push-to-talk.**
- Hold **backtick** (`\``) anywhere on the page, or hold the mic glyph.
- Release stops recognition and submits the transcript through `parse()` with `source: 'voice'`.
- Backtick never inserts into the input field.
- While held: glyph pulses (CSS idle animation, 137ms-stagger language). Nothing static.
- Empty/garbage transcript on release → ignore, do not log “unrecognized”.

**Degradation (in-universe, never a thrown error):**
- No `SpeechRecognition` / `webkitSpeechRecognition` → glyph disabled; first PTT attempt logs `Voice link offline, sir.` Typed path untouched. `voice-input.ts` uses `window.SpeechRecognition || window.webkitSpeechRecognition` (Chrome ships the webkit prefix).
- Mic permission denied → log `Microphone access denied, sir.`
- No `speechSynthesis` → `voice-output.ts` is a silent no-op; log still writes.

## Intents

```ts
type Intent =
  | { type: 'diagnostics' }
  | { type: 'add_objective'; text: string }
  | { type: 'set_threat'; level: 'NOMINAL' | 'ELEVATED' | 'CRITICAL' }
  | { type: 'reset_threat' }
  | { type: 'swap_palette' }
  | { type: 'navigate'; target?: string }
  | { type: 'easter_sudo' }
  | { type: 'easter_iron_man' };
```

### Handlers

**`diagnostics`** — `peekChannel` the current last-known values for fps, jank, gpu, cores, heap, battery, net, geo, weather, threat (override if set, else peeked `threat.level`). Format a short multi-line dump into the log. Missing peeks render as `--`, never `undefined`.

**`add_objective`** — trim `text`; if empty, do not produce this intent (parser returns `null` *or* handler returns `Add what, sir?` — **handler**, so “add objective” with no rest still parses). Push `{ id, text: uppercase, done: false }` onto the objectives store. `id` is a slug of the text plus a short unique suffix so duplicates are allowed.

**`set_threat`** — write the override store. `ThreatLevel` reads override first. Session-only; a reload returns to derived.

**`reset_threat`** — set override to `null`.

**`swap_palette`** — log `Palette protocols offline, sir. Phase six.` No CSS change.

**`navigate`** — log `Single-viewport lock engaged, sir. Nowhere to navigate.` Ignore `target` for effect; parsing it is allowed so `navigate telemetry` still hits this intent.

**`easter_sudo`** — log `Nice try, sir.`

**`easter_iron_man`** — log `Not yet, sir. Boot sequence is still on the bench.` No dim, no reboot.

### Parser rules

1. Trim, lowercase.
2. Strip a single leading `jarvis,` or `jarvis` plus following whitespace. (`JARVIS, run diagnostics` and `run diagnostics` become the same remainder.)
3. Match an **ordered** pattern table, more specific first (`reset threat` before `set threat`; `i am iron man` before a generic catch-all that does not exist).
4. No match → `null` → CommandBar logs `Command not recognized, sir.`

Canonical spoken/typed phrases (aliases in parentheses also match):

| Phrase | Intent |
|---|---|
| `run diagnostics` (`diagnostics`, `run diagnostic`) | `diagnostics` |
| `add objective <text>` (`add objective: <text>`) | `add_objective` |
| `set threat <level>` (`set threat level <level>`, `set threat to <level>`) | `set_threat` |
| `reset threat` (`clear threat`) | `reset_threat` |
| `swap palette` (`change palette`, `switch palette`) | `swap_palette` |
| `navigate` (`navigate <target>`) | `navigate` |
| `sudo` | `easter_sudo` |
| `i am iron man` (`jarvis i am iron man` after prefix strip) | `easter_iron_man` |

Threat `<level>` accepts `nominal`, `elevated`, `critical` (case-insensitive). Anything else → handler reply `Specify NOMINAL, ELEVATED, or CRITICAL, sir.`

## Telemetry peek

`subscribeChannel` already fans out to providers. Extend the registry with:

- a `lastValues` map updated on every emission (including the mandatory synchronous first emit)
- `peekChannel<K>(channel): ChannelMap[K] | undefined`

`peekChannel` is **only** for command handlers. React components continue to use `useTelemetry`. This does not violate CLAUDE.md #4’s spirit (no `navigator.*` from UI code). It avoids subscribing `CommandBar` to `perf.fps`, which would re-render the bar every frame.

If a channel has never had a subscriber, peek may be `undefined` — diagnostics prints `--`. Mounting the HUD already subscribes the live panels, so in normal operation peeks are populated.

## State

**Objectives store** (`hud/modules/objectives-store.ts`):

- Shape: `{ objectives: Objective[]; toggle(id); add(text) }`
- Persist to `localStorage['holo-hud:objectives']` on every change (same key and `Objective` shape as today: `{ id, text, done }`).
- Default list unchanged from Phase 3.
- `Objectives.tsx` click-to-toggle stays.

**Threat override** (`command/threat-override.ts`):

- Shape: `{ level: 'NOMINAL' \| 'ELEVATED' \| 'CRITICAL' \| null; set; clear }`
- Not persisted. Not a telemetry channel. Derived `threat.ts` is unchanged.

**Response log** lives in `CommandBar` local state (newest at bottom, ~3 visible lines, overflow hidden). Not persisted. Not a Zustand store — nothing else reads it.

## Error handling

Handlers and voice adapters never throw into the React tree:

| Condition | Log line |
|---|---|
| `parse` → `null` | `Command not recognized, sir.` |
| `add objective` with empty text | `Add what, sir?` |
| `set threat` with bad/missing level | `Specify NOMINAL, ELEVATED, or CRITICAL, sir.` |
| No SpeechRecognition | `Voice link offline, sir.` |
| Mic permission denied | `Microphone access denied, sir.` |
| Any unexpected handler exception | `Command failed, sir.` |

TTS failures are swallowed; the log line still appears.

## Non-goals (Phase 4)

- Spoken wake-word / always-listening
- Howler, boot timeline, skip-on-second-visit
- Actual palette CSS swap or bloom retune
- Panel-to-panel camera “navigation”
- Cinematic Iron Man shutdown
- Adding an objectives text-input in the panel (command bar owns add)
- A second `requestAnimationFrame` loop
- Unit-test framework (project is milestone-verified; parser is exercised through the gate below)

## Verification

The Phase 4 gate is met when all of these are true in Chrome against a running dev build:

1. Type `run diagnostics` → log dump of live values, no TTS.
2. Type `JARVIS, run diagnostics` → **same** `diagnostics` intent, same dump, no TTS.
3. Hold-PTT the phrase `run diagnostics` → same intent, same dump, **plus** spoken reply.
4. `add objective TEST ITEM` appears on OBJECTIVES, `localStorage['holo-hud:objectives']` contains it, survives reload.
5. `set threat critical` turns the THREAT readout red (`text-hud-danger`); `reset threat` restores the derived value/color.
6. `swap palette` and `navigate` produce the stub lines; no new UI, no token changes.
7. `sudo` → `Nice try, sir.`
8. `tsc -b`, `npm run lint`, `npm run build` clean. Zero console errors on a fresh reload.

## Constraints (carry into the implementation plan)

- CLAUDE.md hard rules 1–6 remain in force.
- `font-variant-numeric: tabular-nums` on any new numeric readout in the diagnostics dump.
- Stagger/pulse timings use the existing 137ms-ish language; no new rAF.
- Palette values only from `src/styles/tokens.css`.
- Web Speech is Chrome-only; that is accepted (desktop-only product). Degrade in-universe when the API is missing rather than feature-detecting a second code path for Firefox.
