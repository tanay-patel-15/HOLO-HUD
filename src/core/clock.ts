import { useEffect } from 'react';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * The single global animation loop (CLAUDE.md #2: one rAF loop, ever).
 * Everything that needs per-frame timing — telemetry providers, the future
 * WebGL scene, idle animation math — reads from this instead of calling
 * requestAnimationFrame itself. Multiple independent loops drift apart and
 * desynchronize the whole HUD; a single broadcast clock can't.
 */
export interface ClockState {
  /** Seconds since the clock started. */
  elapsed: number;
  /** Seconds since the previous frame. */
  delta: number;
  frame: number;
}

export const clockStore = createStore<ClockState>()(
  subscribeWithSelector(() => ({
    elapsed: 0,
    delta: 0,
    frame: 0,
  })),
);

let rafId: number | null = null;
let startTime: number | null = null;
let previousTime: number | null = null;

function tick(time: number): void {
  if (startTime === null) startTime = time;
  const previous = previousTime ?? time;

  const delta = (time - previous) / 1000;
  const elapsed = (time - startTime) / 1000;
  previousTime = time;

  clockStore.setState((state) => ({ elapsed, delta, frame: state.frame + 1 }));

  rafId = requestAnimationFrame(tick);
}

/**
 * Starts the loop. Idempotent, so a StrictMode double-effect or an
 * accidental second call never spawns a competing rAF.
 */
export function startClock(): void {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(tick);
}

export function stopClock(): void {
  if (rafId === null) return;
  cancelAnimationFrame(rafId);
  rafId = null;
  startTime = null;
  previousTime = null;
}

/**
 * Mount once at the app root. Non-reactive consumers (WebGL, telemetry
 * providers) should read `clockStore.getState()` or `clockStore.subscribe`
 * directly rather than this hook — see CLAUDE.md's note on not triggering
 * React renders from per-frame state.
 */
export function useStartClock(): void {
  useEffect(() => {
    startClock();
    return () => stopClock();
  }, []);
}

/**
 * Reactive access for the rare component that should re-render on every
 * tick (a debug FPS overlay, a live readout). Selecting `elapsed` or
 * `delta` here means "re-render this component 60 times a second" —
 * intentional for a readout, wrong for almost anything else.
 */
export function useClock<T>(selector: (state: ClockState) => T): T {
  return useStore(clockStore, selector);
}
