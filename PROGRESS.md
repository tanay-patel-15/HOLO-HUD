# HOLO-HUD — Progress

> Update this at every phase gate, **before** starting the next phase.
> This file is what makes a session boundary free. If a session dies, read this first,
> then `ROADMAP.md`, then `CLAUDE.md`.

**Current phase:** Phase 2 — WebGL Core & Scene (not started)
**Last updated:** 2026-08-11

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| −1 · Durable docs | ✅ Done | `ROADMAP.md`, `PROGRESS.md`, `CLAUDE.md` written |
| 0 · Skeleton & contracts | ✅ Done | Gate verified in-browser |
| 1 · 2D HUD chrome | ✅ Done | Aesthetic gate passed, see below |
| 2 · WebGL core & scene | ⬜ Not started | Next up. Biggest phase, 6–9 sessions |
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
  hud/
    Panel.tsx           # signature chrome: clip-path chamfered corners + corner tick brackets
    Frame.tsx            # outer viewfinder corner brackets spanning the stage
    primitives/
      ArcGauge.tsx        # SVG stroke-dasharray radial gauge
      TickRing.tsx        # radial tick-mark ring; faint+spin variant is the Phase 2 reactor placeholder
      BarMeter.tsx        # segmented power-bar meter
      Readout.tsx         # labeled mono value, tabular-nums
      Ticker.tsx          # seamless-loop scrolling marquee (duplicated-content technique)
    effects/
      HexGrid.tsx          # SVG hex-outline background texture (~5% opacity, non-tessellating)
      Scanlines.tsx         # static CRT scanline texture overlay
      EdgeTicks.tsx         # tick-mark strip filling the band between Frame's corner brackets
  styles/
    tokens.css          # Stark Cyan palette as CSS custom properties + Tailwind @theme mapping
    animations.css        # shared idle keyframes: slow-spin, scan-sweep, ticker-scroll
  App.tsx               # Phase 1's real static composition — see below, not throwaway anymore
```

**Phase 1 design decisions** (frontend-design skill was invoked before building — see the
skill's process for the full token/layout/signature planning method):
- **Signature:** clip-path chamfered panel corners + corner tick brackets, not rounded
  glassmorphism cards. Angular reads as instrument-panel/targeting; rounded reads as generic
  AI dashboard. This is the one deliberate aesthetic risk this phase took.
- **Layout:** corner-anchored and asymmetric (top/bottom hairline bars, two-panel stacks left
  and right), with the center kept deliberately quiet — just a large faint spinning `TickRing`
  — because that's where Phase 2's arc reactor lands. A first pass read as too sparse (dead
  space above/below reading as accidental); fixed by adding `EdgeTicks` to fill the
  frame-corner bands, enlarging the center ring (420→540px) and panel widths (72→80), and
  tightening the outer padding. Second pass confirmed the fix — screenshotted and compared
  before/after.
- **Type:** Chakra Petch (labels/titles, uppercase, wide tracking) + JetBrains Mono (every
  number). No body face — a HUD has no prose.

**Verified in-browser** (Chrome, live screenshots + console check, not just typecheck):
- Composition reads as an instrument HUD at 1920×1080, not a dashboard template
- Panel chamfer + corner-tick-bracket rendering is clean at close zoom, no anti-aliasing
  artifacts at the clip-path cut
- Live FPS readout (Phase 0's telemetry pipeline) still ticking correctly inside the new
  layout — not orphaned by the Phase 1 rebuild
- Zero console errors on a fresh reload
- `npm run build` and `npm run lint` clean

**Deviations from ROADMAP (Phase 0, still true):** no `tailwind.config.ts` (CSS-first `@theme`
in `tokens.css` instead); `tsconfig.app.json` paths without `baseUrl` (TS 6 deprecation).

**Deviation (Phase 1):** `hud/modules/` (SystemVitals, Radar, Weather, etc.) from the ROADMAP
file tree wasn't created — those imply real telemetry wiring, which is Phase 3 scope. Phase 1's
`App.tsx` composes `primitives/` directly with hardcoded placeholder values instead. Expect
`App.tsx` to be decomposed into `hud/modules/` when Phase 3 wires real data in.

---

## Next session should start with

Phase 2 — WebGL Core & Scene. The big one: 6–9 sessions. **Do not share this session with
Phase 0/1 work** — shader iteration eats context fast (see ROADMAP's session-boundary rule).

Deliverables:
1. R3F canvas layered behind the existing DOM chrome (`Panel`/`Frame`/etc. stay as-is on top)
2. Arc reactor: layered rings + custom shader (fresnel + layered noise) + instanced particles —
   replaces the center `TickRing` placeholder in `App.tsx`
3. Postprocessing: bloom, subtle chromatic aberration, film grain
4. Particle field, grid floor, volumetric light shafts
5. Camera drift — slow, continuous, never fully static — writing into `core/camera-store.ts`
   for the first time
6. Wire DOM parallax: panels read `getParallaxTransform()` (already implemented in
   `camera-store.ts`, currently unused/inert since nothing writes to the store yet)

**Gate:** reactor spinning and breathing, panels parallaxing in sync with camera drift. Record
10 seconds; if it doesn't land, tune before moving on.

**Hard rule to reread before starting:** CLAUDE.md #1 — GSAP never tweens a Three.js object
directly; WebGL animates in `useFrame`, reading `clockStore` non-reactively, same pattern
`providers/browser/perf.ts` already demonstrates.

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
  file.
- Panel chrome signature is angular clip-path corners, not rounded — locked in Phase 1, don't
  reintroduce border-radius on HUD chrome without deliberately revisiting this.

---

## Open questions

- Which palette ships as default? Leaning Stark Cyan, but Clean Violet reads less dated.
  Decide at Phase 6 when bloom is tunable.
- Radar module: what does it actually plot? Geo + weather + synthetic contacts is the current
  plan. Revisit in Phase 3.
- Exactly how `getParallaxTransform()` gets called per-frame without triggering React renders
  (CLAUDE.md's per-frame-state rule) needs a concrete pattern — likely a ref + direct style
  mutation inside a shared rAF-driven effect, not a React state update. Work out in Phase 2.

---

## Known issues / gotchas discovered

- `npm create vite@latest <absolute-path>` resolved the path relative to cwd instead of as
  absolute, scaffolding into a nested subdirectory. Worked around by scaffolding then moving
  files up. Not a HOLO-HUD issue — just a create-vite quirk, noted in case it recurs.
- Chrome's `resize_window` sets the OS window size, not the viewport — `window.innerWidth` /
  `innerHeight` differ from the requested dimensions (toolbar chrome, DPR). Always read actual
  viewport dimensions via JS rather than assuming they match the resize call's arguments.
- First composition pass in Phase 1 was too spatially sparse even though the individual
  elements were right — worth remembering for Phase 2's layout-adjacent work (parallax
  depth, particle density): a "quiet, disciplined" restraint principle can still read as
  "empty" if negative space isn't deliberately filled with detail (see EdgeTicks fix above).
