# HOLO-HUD — Progress

> Update this at every phase gate, **before** starting the next phase.
> This file is what makes a session boundary free. If a session dies, read this first,
> then `ROADMAP.md`, then `CLAUDE.md`.

**Current phase:** Phase 0 — Skeleton & Contracts (not started)
**Last updated:** 2026-08-11

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| −1 · Durable docs | ✅ Done | `ROADMAP.md`, `PROGRESS.md`, `CLAUDE.md` written |
| 0 · Skeleton & contracts | ⬜ Not started | Next up |
| 1 · 2D HUD chrome | ⬜ Not started | Go/no-go gate on the aesthetic |
| 2 · WebGL core & scene | ⬜ Not started | Biggest phase, 6–9 sessions |
| 3 · Live data modules | ⬜ Not started | Parallelize across 3 agents |
| 4 · Command & voice | ⬜ Not started | |
| 5 · Boot sequence & sound | ⬜ Not started | |
| 6 · Polish, FX, palettes | ⬜ Not started | |

---

## Next session should start with

Phase 0. Nothing exists yet beyond docs — no `package.json`, no `src/`.

Deliverables for the gate:

1. Vite + React 19 + TS + Tailwind v4 scaffold with path aliases
2. `src/styles/tokens.css` — palette as CSS custom properties
3. `src/core/tokens.ts` — mirrors those vars into a TS object for shader uniforms
4. `src/core/stage.tsx` — fixed 16:9 container, `ResizeObserver` + `transform: scale()`
5. Mobile reject screen below breakpoint
6. `src/core/clock.ts` — the one and only rAF loop
7. `src/core/camera-store.ts` — shared virtual camera (Zustand)
8. `src/telemetry/` — `types.ts`, `registry.ts`, `useTelemetry.ts`, plus **one** real provider
   (recommend `perf.ts` — no permissions needed, always available, immediately visible)

**Gate:** a black 16:9 box that scales correctly on resize, one live readout ticking at 60fps
from a real telemetry channel, reject screen appearing when the window narrows.

---

## Decisions locked (do not relitigate)

- Data via provider abstraction; browser-real + simulated. Local Node agent deferred, possibly
  never.
- 3D-heavy WebGL scene, not 2D-with-accents.
- Text command bar **and** voice, both feeding one shared intent parser.
- Fixed-aspect desktop canvas; in-universe reject screen instead of a mobile layout.
- Palette work deferred to Phase 6 — bloom threshold is coupled to color saturation, so
  building palettes before postprocessing exists means tuning everything twice. The *token
  plumbing* still lands in Phase 0.

---

## Open questions

- Which palette ships as default? Leaning Stark Cyan, but Clean Violet reads less dated.
  Decide at Phase 6 when bloom is tunable.
- Radar module: what does it actually plot? Geo + weather + synthetic contacts is the current
  plan. Revisit in Phase 3.

---

## Known issues / gotchas discovered

_(nothing yet — log anything that costs more than 20 minutes to rediscover)_
