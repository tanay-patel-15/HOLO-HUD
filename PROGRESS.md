# HOLO-HUD — Progress

> Update this at every phase gate, **before** starting the next phase.
> This file is what makes a session boundary free. If a session dies, read this first,
> then `ROADMAP.md`, then `CLAUDE.md`.

**Current phase:** Phase 1 — 2D HUD Chrome (not started)
**Last updated:** 2026-08-11

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| −1 · Durable docs | ✅ Done | `ROADMAP.md`, `PROGRESS.md`, `CLAUDE.md` written |
| 0 · Skeleton & contracts | ✅ Done | Gate verified in-browser, see below |
| 1 · 2D HUD chrome | ⬜ Not started | Next up. Go/no-go gate on the aesthetic |
| 2 · WebGL core & scene | ⬜ Not started | Biggest phase, 6–9 sessions |
| 3 · Live data modules | ⬜ Not started | Parallelize across 3 agents |
| 4 · Command & voice | ⬜ Not started | |
| 5 · Boot sequence & sound | ⬜ Not started | |
| 6 · Polish, FX, palettes | ⬜ Not started | |

---

## What exists right now

Vite 8 + React 19 + TypeScript + Tailwind v4 app, `npm run dev` / `npm run build` / `npm run
lint` all clean.

```
src/
  core/
    clock.ts          # single rAF loop (Zustand vanilla store, non-reactive by default)
    camera-store.ts    # shared virtual camera contract — no writers yet, Phase 2 is first
    stage.tsx          # fixed 1920x1080 stage, CSS-scaled; MobileReject below 1024x600
    tokens.ts          # reads CSS custom properties into a TS object (for shader uniforms later)
  telemetry/
    types.ts           # ChannelMap, Provider interface
    registry.ts         # channel -> {primary, fallback} provider map, exhaustiveness-checked
    useTelemetry.ts      # the only sanctioned way a component reads telemetry
    providers/
      browser/perf.ts    # real FPS, derived from clock deltas — the Phase 3 reference provider
      simulated/perf.ts  # fallback (in practice near-dead code; rAF is universal)
  styles/
    tokens.css          # Stark Cyan palette as CSS custom properties + Tailwind @theme mapping
  App.tsx               # temporary: Stage + a centered live FPS readout, nothing else
```

**Verified in-browser** (Chrome, via automated resize + JS inspection, not just visual check):
- Stage scale is exactly `min(innerWidth/1920, innerHeight/1080)` — confirmed by reading the
  computed transform matrix against actual `window.innerWidth/innerHeight` at multiple sizes
- Reject screen fires below 1024×600, restores above it
- FPS readout changes value across reloads/resizes (120 → 134 observed) — genuinely live, not
  a static render
- Zero console errors, including on a fresh page load (checked after a full reload, not just a
  live tab)

**Deviation from ROADMAP's listed structure:** no `tailwind.config.ts` — Tailwind v4 is
CSS-first, so the token → utility-class mapping lives in `styles/tokens.css` via `@theme
inline` instead of a JS/TS config file. Same effect (`bg-hud-core`, `text-hud-text`, etc. all
work as Tailwind classes), less indirection.

**Also deviated:** `tsconfig.app.json` uses `"paths": { "@/*": [...] }` without `baseUrl` —
TS 6 deprecates `baseUrl`, and paths resolve relative to the config file without it.

---

## Next session should start with

Phase 1 — 2D HUD Chrome. No data, no 3D, pure aesthetic. This is explicitly the go/no-go gate
on whether the visual language works before sinking 6–9 sessions into Phase 2's WebGL core.

Deliverables:
1. Panel primitive with corner brackets and edge rails
2. SVG gauge kit: arc gauge, radial tick ring, bar meter, segmented readout
3. Hex-grid and scanline background layers
4. Typography scale, tabular numerals wired up (base CSS rule already exists in `index.css`)
5. Static layout of 6–8 empty panels

**Gate:** a screenshot that already reads as a Marvel interface, with placeholder numbers. If
it doesn't look right flat, bloom and 3D in Phase 2 won't rescue it — stop and iterate here
rather than proceeding.

Current `App.tsx` is throwaway scaffolding (a Stage + one FPS number) — expect to replace its
contents entirely, not extend it.

---

## Decisions locked (do not relitigate)

- Data via provider abstraction; browser-real + simulated. Local Node agent deferred, possibly
  never.
- 3D-heavy WebGL scene, not 2D-with-accents.
- Text command bar **and** voice, both feeding one shared intent parser.
- Fixed-aspect desktop canvas; in-universe reject screen instead of a mobile layout.
- Palette work deferred to Phase 6 — bloom threshold is coupled to color saturation, so
  building palettes before postprocessing exists means tuning everything twice. The *token
  plumbing* already exists (`styles/tokens.css`), only Stark Cyan is populated.
- Tailwind v4 config is CSS-first (`@theme inline` in `tokens.css`), not a `tailwind.config.ts`
  file — decided during Phase 0, see "What exists right now" above.

---

## Open questions

- Which palette ships as default? Leaning Stark Cyan, but Clean Violet reads less dated.
  Decide at Phase 6 when bloom is tunable.
- Radar module: what does it actually plot? Geo + weather + synthetic contacts is the current
  plan. Revisit in Phase 3.

---

## Known issues / gotchas discovered

- `npm create vite@latest <absolute-path>` resolved the path relative to cwd instead of as
  absolute, scaffolding into a nested subdirectory. Worked around by scaffolding then moving
  files up. Not a HOLO-HUD issue — just a create-vite quirk, noted in case it recurs.
- Chrome's `resize_window` sets the OS window size, not the viewport — `window.innerWidth` /
  `innerHeight` differ from the requested dimensions (toolbar chrome, DPR). Always read actual
  viewport dimensions via JS rather than assuming they match the resize call's arguments.
