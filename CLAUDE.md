# HOLO-HUD

Tony Stark / JARVIS-style holographic HUD. Browser-based, WebGL-heavy, voice-driven.
Desktop-only by design.

**Read `PROGRESS.md` first** for current state. **`ROADMAP.md`** has the full plan, phase
gates, and rationale.

## Stack

Vite 7 · React 19 · TypeScript · Tailwind v4 · React Three Fiber (+ drei, postprocessing) ·
GSAP · Zustand · Howler.js · Web Speech API

## Hard rules

These are non-negotiable. Each one exists because violating it causes an expensive,
hard-to-diagnose failure.

**1. Never cross the animation streams.**
WebGL animates inside `useFrame`. DOM animates via GSAP or CSS. GSAP must *never* tween a
Three.js object directly — it desyncs from the render loop and produces jitter that takes hours
to trace.

**2. One rAF loop, ever.**
`src/core/clock.ts` owns the only `requestAnimationFrame` loop and broadcasts elapsed/delta.
Never add a second one. Multiple loops drift apart and everything subtly desynchronizes.

**3. All palette values live in `src/styles/tokens.css`** as CSS custom properties, mirrored
into shader uniforms via `src/core/tokens.ts`. Never hardcode a color anywhere else. Theme
swapping depends entirely on this.

**4. Telemetry is consumed only via `useTelemetry(channel)`.**
Never call a browser API (`navigator.*`, `performance.*`, `getUserMedia`) directly from a
component. Providers live in `src/telemetry/providers/`. This is what keeps modules testable
and lets unavailable channels fall back to simulated data instead of rendering `undefined`.

**5. Every numeric readout uses `font-variant-numeric: tabular-nums`.**
Without it, digits change width as values tick and panels visibly jitter.

**6. WebGL owns the world; the DOM owns every glyph.**
No text inside the WebGL scene. Both layers read `src/core/camera-store.ts` so DOM panels
parallax in sync with the 3D camera drift. This is the architecture that makes flat panels read
as suspended in 3D space while staying crisply legible.

## Performance

Hold 60fps with frame time under 16ms. Check the Chrome DevTools Performance panel at every
phase gate — regressions compound invisibly, and by the time it feels slow you've got five
overlapping causes.

State that updates per-frame must not trigger React renders. Read it in `useFrame` via refs or
Zustand's non-reactive `getState()`, not through a hook that re-renders.

## Aesthetic guardrails

- Nothing is ever fully static. If an element has no reason to move, give it a slow idle
  animation.
- Stagger with prime-ish intervals (`137ms`) so composite patterns don't visibly loop.
- Under bloom, saturated colors clip to white. Keep base colors near 70% saturation and let
  bloom supply the intensity.
- Sequential, never simultaneous — systems coming online one at a time is the entire effect.

## Scope boundaries

Explicitly out of scope: mobile/responsive layout (there's an in-universe reject screen
instead), any backend, persistence beyond localStorage, and the local Node telemetry agent
(the provider slot exists but stays empty unless browser data proves insufficient).
