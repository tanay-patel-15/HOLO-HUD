# HOLO-HUD — Technical Roadmap

> Tony Stark / JARVIS-style holographic HUD. Browser-based, WebGL-heavy, voice-driven.
> This document is the source of truth for the build. See `PROGRESS.md` for current state
> and `CLAUDE.md` for the non-negotiable rules.

## Context

Solo dev project, built for fun and as a portfolio piece: a holographic HUD that runs in the
browser and feels *alive* — reactive, animated, never static.

Four decisions were locked before planning, and they drive everything below:

| Decision | Choice |
|---|---|
| **Data source** | Provider abstraction; real browser data + simulated fill-in. Local agent optional later. |
| **3D depth** | 3D-heavy — full WebGL scene, camera drift, bloom, particles |
| **Command input** | Text command bar **and** voice, sharing one intent parser, from the start |
| **End state** | Fixed-aspect cinematic canvas, CSS-scaled to any desktop window; in-universe reject screen on mobile |

**Intended outcome:** a deployable link that opens into a boot sequence and a living
holographic interface you can talk to.

---

## The Central Constraint

Full WebGL + readable text is the hard problem of this project. Text inside WebGL loses
subpixel antialiasing and rebuilds geometry on every change — unusable for readouts
updating at 60fps.

**The architecture that solves it: a shared virtual camera.**

- **WebGL owns the world** — arc reactor, particle field, volumetric light, grid floor, wireframe globe
- **The DOM owns every glyph** — panels, gauges, readouts, all crisply rendered
- **One camera state object** drives both. R3F reads it for the real camera; DOM panels read
  it to apply `translate3d` + `rotateY/X` parallax.

Both layers drift together, so the flat panels read as suspended in the same 3D space. This
is what the movie UIs actually do. It must exist in Phase 0 — retrofitting it means touching
every panel.

---

## Tech Stack

| Layer | Pick | Why |
|---|---|---|
| Build | **Vite 7 + React 19 + TypeScript** | Instant HMR matters enormously when tuning shaders and timings. No SSR benefit for a canvas app. |
| 3D | **React Three Fiber + drei + @react-three/postprocessing** | Declarative Three.js; component model matches how you'll compose scene elements. |
| Styling | **Tailwind v4** + CSS custom properties | Tailwind for layout/spacing. **All palette values live in CSS variables** — non-negotiable for theme swapping. |
| Sequencing | **GSAP** | Timeline choreography is its exact strength. Now fully free including all plugins. |
| Idle loops | **Plain CSS keyframes** | GPU-composited, zero JS cost, and there will be dozens running at once. |
| State | **Zustand** (`subscribeWithSelector`) | Context re-render storms are fatal at 60fps. Zustand lets WebGL read state without triggering React. |
| SFX | **Howler.js** | Autoplay-unlock handling and sprite pooling are genuinely annoying to hand-roll. |
| Mic analysis | **Raw Web Audio `AnalyserNode`** | Direct FFT access; Howler doesn't expose what you need. |
| Voice | **Web Speech API** (recognition + synthesis) | Chrome-only, which the desktop-only decision already accepted. |

### Tradeoffs Worth Knowing

**Vite vs Next.js** — Next buys SSR, routing, and API routes. You need none of them, and its
RSC model actively fights an all-client canvas app. If a local telemetry agent lands later,
it's a separate WebSocket process, not a Next API route.

**GSAP vs Framer Motion** — Motion excels at React enter/exit and spring physics. GSAP excels
at long, precisely-sequenced timelines. The boot sequence is a ~12-second choreographed
timeline; that's GSAP. Adding Motion as a third animation system isn't worth the coordination
cost.

**R3F vs vanilla Three.js** — R3F adds a reconciler layer and a real learning curve around
`useFrame` and ref discipline. Vanilla gives absolute control. R3F wins here because scene
elements map cleanly to components and drei's helpers (`shaderMaterial`, `Instances`,
`Effects`) save real time.

**Fonts** — Skip Orbitron; it's the default "sci-fi" choice and reads as such. Better:
**Chakra Petch** or **Saira Condensed** for display, **JetBrains Mono** for numeric readouts.
Apply `font-variant-numeric: tabular-nums` everywhere numbers change — otherwise digits jitter
panel width on every tick and the whole thing looks cheap.

---

## Roadmap

Estimates are in **focused sessions** (~3–4 hours). Total: **~22–32 sessions**, roughly 6–10
weeks of evenings.

### Phase −1 — Durable Docs · ~10 min ✅

`ROADMAP.md`, `PROGRESS.md`, `CLAUDE.md` written into the repo so no session loss costs
anything.

**Done looks like:** you can discard your chat history and a fresh session picks up exactly
where you left off.

### Phase 0 — Skeleton & Contracts · 2 sessions

The unglamorous phase that prevents three later rewrites.

- Vite + React + TS + Tailwind v4 scaffold, path aliases
- **Design token layer** — palette as CSS custom properties, mirrored into a TS object that
  feeds shader uniforms. One source of truth for both layers.
- **Fixed-aspect stage** — 16:9 container, `ResizeObserver` + CSS `transform: scale()` to fit
  any window with zero reflow
- **Mobile reject screen** below breakpoint
- **Telemetry registry** — channel types, provider interface, subscribe API
- **Central clock** — one `requestAnimationFrame` loop broadcasting elapsed/delta. Everything
  shares it.
- **Virtual camera store** — the shared state the WebGL camera and DOM parallax both read

**Done looks like:** a black 16:9 box that scales correctly when you resize, one live readout
updating at 60fps from a real telemetry channel, and the reject screen appearing when you
narrow the window.

### Phase 1 — 2D HUD Chrome · 4 sessions

No data, no 3D. Pure aesthetic.

- Panel primitive with corner brackets and edge rails
- SVG gauge kit: arc gauge, radial tick ring, bar meter, segmented readout
- Hex-grid and scanline background layers
- Typography scale, tabular numerals wired up
- Static layout of 6–8 empty panels

**Done looks like:** a screenshot that already reads as a Marvel interface, with placeholder
numbers. **This is the go/no-go on the aesthetic** — if it doesn't look right flat, 3D and
bloom won't rescue it.

### Phase 2 — WebGL Core & Scene · 6–9 sessions ← the big one

- R3F canvas layered behind the DOM chrome
- **Arc reactor** — layered rings, custom shader for the glow core (fresnel + layered noise),
  instanced particles
- Postprocessing: bloom, subtle chromatic aberration, film grain
- Particle field, grid floor, volumetric light shafts
- **Camera drift** — slow, continuous, never fully static
- **DOM parallax wired to the shared camera**

**Done looks like:** reactor spinning and breathing, panels parallaxing in sync with camera
drift. Record 10 seconds. If it doesn't give you chills, tune before moving on — everything
after this is additive.

### Phase 3 — Live Data Modules · 4 sessions

Implement the providers behind the Phase 0 abstraction.

| Channel | Source | Availability |
|---|---|---|
| `audio.fft` | `getUserMedia` → `AnalyserNode` | Universal — **highest-value real signal** |
| `perf.fps` / `perf.jank` | rAF deltas, `PerformanceObserver` | Universal |
| `sys.gpu` | `WEBGL_debug_renderer_info` | Chrome — returns real GPU string |
| `sys.cores` | `navigator.hardwareConcurrency` | Universal |
| `sys.heap` | `performance.memory` | Chrome only |
| `sys.memory` | `navigator.deviceMemory` | Chrome only, coarse |
| `power.*` | `getBattery()` | Chrome/Edge |
| `net.*` | `navigator.connection` | Chrome only |
| `geo.*` | `navigator.geolocation` | Universal, prompts |
| `weather.*` | Open-Meteo (free, no key, CORS) | Universal |
| everything else | Simulated providers | Always |

Plus: mission objectives (to-do reskin, localStorage), and **threat level as a derived
metric** — low battery + high jank + late hour → `ELEVATED`. Real inputs, absurd output,
genuinely fun.

**Done looks like:** every panel live, nothing renders `undefined`, and force-disabling any
provider degrades to simulated data with no visible break.

### Phase 4 — Command & Voice · 4 sessions

- **Intent parser** — the shared core. Text and voice both produce the same intent objects.
- Command bar: always-focusable, autocomplete, scrolling response log
- Web Speech recognition → same parser; `SpeechSynthesis` for spoken replies
- Command set: navigate, swap palette, run diagnostics, add objective, set threat level,
  easter eggs

**Done looks like:** "JARVIS, run diagnostics" works spoken *and* typed, through one code path.

### Phase 5 — Boot Sequence & Sound · 3 sessions

- GSAP master boot timeline (beat sheet below)
- Howler SFX + ambient hum, persisted mute toggle
- Skip-on-second-visit via localStorage

**Done looks like:** you reload the page and don't reach for the skip button.

### Phase 6 — Polish, FX, Palettes · ongoing

Alternate palettes, glitch effects, easter eggs, 60fps perf pass, deploy.

---

## Component Inventory

### Quick wins — high vibe, low cost

- **Corner brackets / panel chrome** — pure CSS borders, ~30 min
- **Scanline overlay** — repeating linear-gradient + `translateY` keyframe, ~15 min
- **Radar sweep** — a rotating `conic-gradient` is a convincing sweep in about five lines
- **Hex grid** — SVG `<pattern>`, ~30 min
- **Typing / decrypt text effect** — ~60 lines
- **Rolling number counter** — tabular numerals + interpolation
- **Radial tick rings** — generate ticks in a loop, trivial SVG
- **Status LEDs** — stagger with `animation-delay: calc(var(--i) * 137ms)`
- **Data ticker** — marquee of synthetic telemetry
- **Arc gauges** — SVG `stroke-dasharray`, very well-trodden

### Time sinks — budget accordingly

- **Arc reactor shader** — expect to lose a full weekend to fresnel and noise layering. Worth
  it; it's the hero.
- **Postprocessing tuning** — bloom threshold interacts with *every* color decision. Change
  the palette, re-tune bloom. This is why palette work is Phase 6, not Phase 1.
- **DOM↔WebGL camera sync** — conceptually simple, fiddly to get pixel-right
- **Voice reliability** — Web Speech produces false positives and drops the mic silently;
  you'll build reconnect logic
- **Sound design** — sourcing good SFX takes far longer than wiring them
- **Wireframe globe with real coastlines** — GeoJSON → line geometry is a genuine rabbit hole.
  Defer.
- **Holding 60fps** with bloom + particles + 20 animating DOM panels

---

## Vibe Direction

### Boot sequence — beat sheet

| Time | Beat |
|---|---|
| 0.0s | Black. Single sub-bass swell begins. |
| 0.4s | One cyan scanline sweeps top→bottom. |
| 0.8s | `INITIALIZING` types out, monospace, centered. |
| 1.5s | Reactor core ignites — small, dim, then blooms hard. |
| 2.2s | Grid floor fades up from the horizon. |
| 2.8s–5.5s | Panels arrive **one at a time**, staggered ~180ms, each with a whoosh and a bracket-draw animation. |
| 5.5s | Readouts start populating with a rapid digit-scramble settling into real values. |
| 6.5s | `ALL SYSTEMS NOMINAL` + confirm chime. |
| 7.0s | Camera settles into its idle drift. Ambient hum takes over. |

Sequential, never simultaneous. Systems coming online *one by one* is the entire effect.

### Sound design

Synthesize UI sounds with `OscillatorNode` instead of shipping audio files:

- **Beeps** — sine, 800–1200Hz, 40ms with fast exponential decay
- **Confirm** — two-tone rising, 600→900Hz
- **Error** — square wave, 220Hz, slight detune
- **Ambient hum** — two sine oscillators at 55Hz and 55.3Hz; the beat frequency creates a slow
  organic throb
- **Whooshes** — the one category worth sourcing as real files (freesound.org)

Mute toggle persisted to localStorage, and honor `prefers-reduced-motion` by also damping
audio.

### Idle animation — the "never static" rule

- Stagger everything by a **prime-ish interval** (137ms) so composite patterns don't visibly
  loop
- Apply ±0.3% noise to real values so trailing digits flicker
- Rings rotate at **incommensurable speeds** — the overall pattern never repeats
- Poisson-scheduled micro-glitches: a random panel briefly desaturates or offsets 1px
- A full scanline pass every ~8 seconds
- Reactor "breathes" on a slow sine, slightly out of phase with the bloom intensity

### Easter eggs & personality

- Konami code → **combat mode** (red palette, alarm, threat level spikes)
- Type `sudo` → `"Nice try, sir."`
- After 5 min idle → `"Sir?"`, then the HUD dims
- Between 2–5 AM → `"Sir, you haven't slept."`
- Loud mic spike → momentary threat-level jump with an alert sweep
- Status line gets progressively sassier the longer you sit idle
- `jarvis, i am iron man` → full shutdown sequence, then reboot

### Palettes

All values live in CSS custom properties from Phase 0, so this is a one-line swap.

| Palette | Core | Background | When it fits |
|---|---|---|---|
| **Stark Cyan** *(default)* | `#00E5FF` | `#0A1929` | Classic, safest, instantly reads "tech" |
| **Amber Workshop** | `#FFB627` / `#FF7A00` | `#140D06` | Mk II garage-build energy. Easiest on the eyes for long sessions. |
| **Combat Red** | `#FF2D2D` | `#1A0505` | **A state, not a theme** — flip into it on alerts, never boot into it |
| **Clean Violet** | `#E8F4FF` + `#7B61FF` | `#050508` | Reads 2026 rather than 2008. Best choice if you want it to look modern. |

> **Bloom interaction:** saturated colors clip to white under bloom. Keep base colors near 70%
> saturation and let the bloom pass supply the intensity. This is why palette work waits until
> Phase 6 — every palette needs its own bloom threshold.

---

## Project Structure

```
HOLO-HUD/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── public/
│   ├── fonts/
│   └── audio/                    # whooshes only; beeps are synthesized
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── core/
    │   ├── clock.ts              # single rAF loop, elapsed/delta broadcast
    │   ├── camera-store.ts       # shared virtual camera (WebGL + DOM parallax)
    │   ├── stage.tsx             # fixed-aspect scaler + ResizeObserver
    │   └── tokens.ts             # palette mirrored from CSS vars → shader uniforms
    ├── telemetry/
    │   ├── registry.ts           # channel → provider mapping, fallback logic
    │   ├── types.ts              # Channel union, Provider interface
    │   ├── useTelemetry.ts       # subscription hook
    │   └── providers/
    │       ├── browser/          # audio-fft, perf, battery, network, geo, gpu
    │       ├── simulated/        # seeded noise generators
    │       └── agent/            # empty until/unless a local agent lands
    ├── scene/                    # WebGL — owns the world
    │   ├── Scene.tsx
    │   ├── ArcReactor/
    │   │   ├── index.tsx
    │   │   ├── core.frag.glsl
    │   │   └── rings.tsx
    │   ├── ParticleField.tsx
    │   ├── GridFloor.tsx
    │   ├── CameraRig.tsx         # writes to camera-store
    │   └── Effects.tsx           # bloom, aberration, grain
    ├── hud/                      # DOM — owns every glyph
    │   ├── Frame.tsx             # outer brackets and rails
    │   ├── Panel.tsx             # shared chrome + parallax binding
    │   ├── primitives/           # ArcGauge, TickRing, BarMeter, Readout, Ticker
    │   ├── modules/              # SystemVitals, Radar, Weather, Objectives, ThreatLevel
    │   └── effects/              # Scanlines, HexGrid, TypeText, Glitch
    ├── command/
    │   ├── parser.ts             # shared intent parser — the core
    │   ├── intents.ts            # intent definitions + handlers
    │   ├── CommandBar.tsx
    │   ├── voice-input.ts        # Web Speech recognition → parser
    │   └── voice-output.ts       # SpeechSynthesis
    ├── boot/
    │   ├── sequence.ts           # GSAP master timeline
    │   └── BootOverlay.tsx
    ├── audio/
    │   ├── engine.ts             # Howler init, unlock handling, mute state
    │   └── synth.ts              # OscillatorNode beeps/confirms/hum
    ├── personality/
    │   ├── status-lines.ts       # idle sass, time-aware messages
    │   └── easter-eggs.ts
    └── styles/
        ├── tokens.css            # ALL palette custom properties
        ├── palettes.css          # cyan / amber / combat / violet
        └── animations.css        # shared idle keyframes
```

---

## Execution Strategy — Sessions & Agents

### Session boundaries

**One session per phase, not one session for everything.** Each phase has a clean "done" gate,
which makes it a natural context reset point. Two rules:

- **Never share a session between Phase 0/1 and Phase 2.** Shader iteration will eat the
  entire context window; you don't want foundational decisions summarized away mid-tuning.
- **Update `PROGRESS.md` at every phase gate**, before starting the next one. That file is what
  makes a session boundary free.

### Where parallel agents actually help

Parallelism pays off when tasks have **clean file boundaries** *and* **objective completion
criteria**. Most of this project fails the second test — visual quality is a taste judgment
requiring your eye in the loop. Two places pass:

**Burst 1 — Phase 3 telemetry providers (the strong case).** Ten independent files, one shared
interface, mechanical pass/fail. Fan out to 3 agents:

| Agent | Owns |
|---|---|
| A | `providers/browser/audio-fft.ts`, `perf.ts` |
| B | `providers/browser/battery.ts`, `network.ts`, `gpu.ts`, `sysinfo.ts` |
| C | `providers/browser/geo.ts`, `weather.ts`, `providers/simulated/*` |

Give each agent: `telemetry/types.ts`, `telemetry/registry.ts`, and **one reference provider
written by hand**. Strict file ownership, no overlap. Success criterion: channel emits valid
typed data, degrades cleanly on permission denial.

**Burst 2 — Phase 6 content (the easy case).** `personality/status-lines.ts`,
`personality/easter-eggs.ts`, `audio/synth.ts`. Pure content, zero visual coupling, low risk.
Two agents.

### Where parallel agents will actively hurt

- **Phase 0** — foundations everything depends on. Must be one coherent design authored in one
  pass.
- **Arc reactor shader** — needs your eye every 30 seconds. No agent can evaluate "does this
  look like an arc reactor."
- **Bloom / postprocessing tuning** — globally coupled to every color decision in the app.
- **DOM↔WebGL camera sync** — spans both layers by definition; split ownership guarantees
  desync bugs.
- **Boot sequence** — a single GSAP timeline is inherently one unit of work.
- **Phase 1 HUD primitives** — tempting (five independent files!) but they must share one
  design language. Build one by hand first as the reference; only then consider fanning out the
  rest, and expect to restyle what comes back.

> **The honest summary:** parallelize Phase 3, optionally parallelize Phase 6 content, and do
> everything else in a single session per phase. Taste is the actual product here — a generic
> UI agent will produce generic output, which is precisely the failure mode this project exists
> to avoid.

---

## Verification

Milestone-based rather than test-suite-based — this is a visual project and the milestones are
visual.

**Per phase:** each "Done looks like" above is the gate. Don't advance past a failed gate;
every phase compounds on the previous one's foundation.

**Continuous checks:**

- `npm run dev` — HMR must stay under ~1s or shader iteration becomes miserable
- Chrome DevTools Performance panel each phase: hold **60fps with frame time under 16ms**.
  Regressions compound invisibly.
- Resize the window edge-to-edge — the stage must scale with zero reflow, and the reject screen
  must appear cleanly below breakpoint
- Force-disable each telemetry provider (registry flag) and confirm graceful degradation to
  simulated data
- After Phase 2, record 10s clips at each milestone — the best regression test for a vibe
  project is watching last week's clip next to this week's

**Before deploy:**

- Cold-load on a throttled connection; measure time-to-boot-sequence
- Verify on a machine that isn't yours — integrated GPU behavior with bloom is the main risk
- Confirm mic and geolocation permission denials degrade without breaking the HUD

---

## Deferred (explicitly out of scope for now)

- Local Node telemetry agent — the provider slot exists; fill it only if browser data proves
  unsatisfying
- Mobile / responsive layout — replaced by the in-universe reject screen
- Wireframe globe with real coastline data
- Any backend or persistence beyond localStorage
