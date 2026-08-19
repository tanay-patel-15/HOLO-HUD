# HOLO-HUD — Progress

> Update this at every phase gate, **before** starting the next phase.
> This file is what makes a session boundary free. If a session dies, read this first,
> then `ROADMAP.md`, then `CLAUDE.md`.

**Current phase:** Phase 2 — WebGL Core & Scene — ✅ Done, merged to main
**Last updated:** 2026-08-18

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| −1 · Durable docs | ✅ Done | `ROADMAP.md`, `PROGRESS.md`, `CLAUDE.md` written |
| 0 · Skeleton & contracts | ✅ Done | Gate verified in-browser |
| 1 · 2D HUD chrome | ✅ Done | Aesthetic gate passed, see below |
| 2 · WebGL core & scene | ✅ Done | All 6 deliverables built, verified live, reactor polished, perf-verified (300-frame sample, 0 frames over 16ms budget). PR #1 merged to `main` |
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

## Phase 2 — what was built

All 6 ROADMAP deliverables landed and were verified live in Chrome (screenshots + console +
direct DOM/state inspection, not just typecheck):

```
src/
  scene/                      # WebGL — owns the world (new this phase)
    Scene.tsx                  # <SceneCanvas>: Canvas + the external clock-driver useEffect
    CameraRig.tsx               # writes core/camera-store.ts for the first time
    ArcReactor/index.tsx         # 3 rings + segmented spoke ring + fresnel/noise core + instanced motes
    GridFloor.tsx                # drei <Grid>, slow idle rotation
    LightShafts.tsx              # additive-blended shader planes, fanned + rotating
    ParticleField.tsx            # drei <Sparkles> ambient dust
    Effects.tsx                  # EffectComposer: Bloom + ChromaticAberration + Noise (grain)
    shaders.ts                  # ArcCoreMaterial (fresnel+noise) & ShaftMaterial, via drei's
                                 # shaderMaterial + extend()
  hud/
    useParallax.ts               # cameraStore subscription -> direct style.transform mutation
    Panel.tsx, Frame.tsx        # now bound to useParallax at different `depth`s
  core/tokens.ts                 # readTokens() now normalizes CSS colors before handing them
                                 # to THREE.Color (see gotcha below) — Phase 0/1 behavior unchanged
```

- **Reactor**: `ArcReactor` — 3 independently-spinning `TorusGeometry` rings (incommensurable
  rad/s speeds), a 24-instance segmented spoke ring, a fresnel + two-octave-simplex-noise
  shader core (`ArcCoreMaterial`) with a slow sine "breathing" envelope, and ~90 instanced
  motes orbiting at randomized radius/height/speed.
- **Postprocessing**: `@react-three/postprocessing`'s `EffectComposer` — `Bloom` (mipmap blur,
  tuned so the shader body stays dim-cyan and only the rim/hot noise veins clip toward white),
  subtle `ChromaticAberration`, subtle `Noise` (film grain) via `BlendFunction.OVERLAY`.
- **Camera drift**: `CameraRig` drifts camera position on 3 incommensurable-frequency sines,
  `camera.lookAt(0,0,0)` every frame, republishes the resulting pose to `camera-store.ts`.
- **DOM parallax**: `hud/useParallax.ts` subscribes to `cameraStore` and mutates
  `node.style.transform` directly (no React re-render — same non-reactive-store pattern
  `providers/browser/perf.ts` uses for the clock). `Panel` takes a `depth` prop (0.7–1.4 across
  the current layout); `Frame`'s corner brackets compose their own static rotation with the
  parallax offset by hand instead of using the hook directly, since they need both. Verified
  live: inspected `element.style.transform` in the running app and confirmed real, distinct,
  non-zero `translate3d`/`rotateX`/`rotateY` values scaling correctly with each panel's `depth`.

**Gate check (done looks like):** reactor spinning + breathing ✅, panels parallaxing in sync
with camera drift ✅ — both confirmed live, not just by reading the code. `npm run build` /
`npm run lint` / `tsc -b` all clean. Zero console errors on a fresh reload.

**Reactor polish pass (before merging the Phase 2 PR):**
- Spoke ring was reading as invisible-thin — bumped instance size (`0.06→0.11` long,
  `0.012→0.026` tall) and switched its material from `dimColor` to `brightColor`/opacity 0.85.
  Now clearly reads as a segmented tick ring between the two inner rings, visible even at full
  HUD scale, not just zoomed in.
- Rings themselves (all 3) got slightly thicker tubes and higher opacity — the outer two were
  nearly invisible at normal viewing distance even though they showed up fine when zoomed in.
- Core shader (`ArcCoreMaterial`) gained a second, much narrower noise threshold (`hot`,
  smoothstep 0.82–0.97 vs. the existing `core` at 0.5–0.8) that picks out only the noise field's
  brightest few percent as sharp "energy vein" highlights mixed toward `uColorBright`. Reads as
  churning cracks of light across the surface instead of one uniform glow — much closer to an
  actual reactor core than a lit sphere.
- Ran a Chrome DevTools performance trace via `chrome-devtools-mcp` on page load — LCP 517ms /
  TTFB 4ms / CLS 0, no render-blocking issues, reasonable for a dev-mode Three.js bundle. That
  trace is Core-Web-Vitals shaped (load metrics), not a sustained-animation frame-time profile,
  so a follow-up session did the more direct check: sampled 300 consecutive
  `requestAnimationFrame` deltas during steady-state animation (reactor + camera drift + all
  postprocessing running) directly in the page. **Avg 8.32ms/frame (~120fps), p95 9.4ms, worst
  frame 12.8ms, zero frames over the 16.67ms/60fps budget.** That's a literal, direct
  confirmation of CLAUDE.md's "hold 60fps, frame time under 16ms" rule for this scene — not an
  inference from the live FPS readout. `EffectComposer` (bloom + aberration + grain) is included
  in that number, not measured separately.

**Still open — deferred, not blockers:**
- Palette work is still correctly deferred to Phase 6 per the locked decision below — only Stark
  Cyan has been visually tuned; bloom threshold will need re-tuning per-palette there.
- The frame-time sample above is from this machine/environment only — CLAUDE.md's own
  verification checklist calls out testing on a machine that isn't yours as a pre-deploy step,
  particularly for integrated-GPU bloom behavior. Still applies whenever deploy gets close.

**Hard rule note:** CLAUDE.md #1/#2 were the two hardest constraints to actually satisfy here —
see the "single rAF loop" gotcha below. Every WebGL animation in this phase (`CameraRig`,
`ArcReactor`, `GridFloor`, `LightShafts`) reads `clockStore.getState()` inside `useFrame` and
mutates Three objects directly; nothing GSAP-driven touches a Three.js object.

## Next session should start with

Phase 3 — Live Data Modules. Phase 2's gate, polish pass, and perf verification are all done
and merged. Read the four Phase 2 gotchas below first — they're general R3F/Canvas lessons
that will keep applying to any future `scene/` work, not just Phase 2-specific. Per ROADMAP,
Phase 3 is the strong case for parallelizing across 3 agents (independent provider files, one
shared interface, mechanical pass/fail criteria) — see ROADMAP's "Execution Strategy" section
for the exact agent/file split before starting.

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
- ~~Exactly how `getParallaxTransform()` gets called per-frame without triggering React
  renders~~ — resolved in Phase 2: `hud/useParallax.ts` subscribes directly to `cameraStore`
  (a Zustand vanilla store) and mutates `style.transform` in the subscription callback. No rAF
  of its own — `cameraStore` only updates once per tick of the single shared clock, from
  `CameraRig`'s `useFrame`, so this is a listener on state the one true loop already produces.

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

**Phase 2 — four real gotchas, all worth reading before touching `scene/` again:**

- **R3F's `frameloop="never"` + `advance(timestamp)` needs `timestamp` in *seconds*, not
  milliseconds.** `advance()`'s `timestamp` feeds straight into `state.clock.elapsedTime` (a
  `THREE.Clock`, seconds) to derive every subscriber's per-frame `delta` — there's no unit
  conversion inside R3F. Passing `elapsed * 1000` (an easy mistake coming from
  `requestAnimationFrame`'s own millisecond-timestamp convention) corrupts every `delta` by
  1000x, including inside `@react-three/postprocessing`'s `EffectComposer`, and the entire
  canvas silently renders nothing — no error, no console warning, just a blank layer. Always
  pass `clockStore`'s `elapsed` (already seconds) directly to `advance()`.
- **`useEffect` never fires for components mounted inside `<Canvas>` in this R3F 9 / React 19
  setup — but `useLayoutEffect` does.** Confirmed directly: a `useEffect` writing
  `document.title` from a component rendered as a child of `<Canvas>` never ran, even after
  several seconds and even under `frameloop="always"`; the identical effect in a normal
  DOM-rendered component ran immediately. `useFrame`'s own internal subscription (which
  demonstrably *does* run every tick) relies on `useIsomorphicLayoutEffect`, not `useEffect` —
  that's the one that's reliable here. Concretely bit `ArcReactor`'s spoke-ring instance
  placement (a one-time `setMatrixAt` loop): written as `useEffect`, it silently never ran,
  leaving every spoke instance collapsed at the identity matrix; switching to `useLayoutEffect`
  fixed it. **Rule of thumb for anything added inside `scene/` going forward: any one-time
  imperative Three.js setup goes in `useLayoutEffect`, never `useEffect`.** Anything that needs
  to run reliably from genuinely outside-Canvas, ordinary DOM-side code (like driving `advance()`
  itself) should live in a normal component and use the top-level `advance`/`invalidate` exports
  from `@react-three/fiber`, not `useThree(s => s.advance)` from inside the Canvas tree.
- **`getComputedStyle` returns CSS custom properties completely unparsed, and THREE.Color's
  `setStyle` only accepts legacy comma-separated `hsl(h, s%, l%)` — the modern space-separated
  `hsl(h s% l%)` `tokens.css` actually uses fails to parse and silently falls back to white,
  with no warning surfaced anywhere obvious.** This produced a "glowing white moon" instead of
  a cyan reactor for a long stretch of this session before being traced to the source. Fixed in
  `core/tokens.ts`: `readTokens()` now round-trips every value through a hidden element's
  `style.color` before returning it, which forces the browser's own CSS parser to normalize any
  valid color syntax (hsl, oklch, named, whatever a future palette uses) to
  `rgb(r, g, b)` — the one format both CSS and `THREE.Color` agree on. Any future code calling
  `new THREE.Color(readTokens().something)` is safe as a result; anything that reads
  `--hud-*` custom properties directly via `getComputedStyle` without going through
  `readTokens()` is not.
- **`gl.readPixels` on a WebGL context with default `preserveDrawingBuffer: false` reads back
  all zeros shortly after each frame is presented** — the browser clears the drawing buffer
  right after compositing to the screen. This produced a string of false "nothing is rendering"
  signals during debugging even when the canvas visually had content (confirmed via screenshot).
  Screenshots (the real compositor output) were the reliable ground truth throughout, not
  `gl.readPixels`; don't reach for raw pixel readback as a rendering-sanity check on this
  project's canvases.
- **Vite's dev-server + HMR state got repeatedly corrupted across rapid edits to `scene/`
  files this session** — symptoms included a completely blank canvas or an impossible FPS
  reading (500+) that a fresh full reload didn't fix. The reliable recovery was always: kill
  the dev server, `rm -rf node_modules/.vite`, restart, and open a brand-new tab (not just
  navigate an existing one). Given how much shader/scene iteration Phase 2 involves, expect to
  need this recovery again — don't over-trust a single `npm run dev` process across a long
  `scene/`-heavy session.
