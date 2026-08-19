import { clockStore } from '@/core/clock';
import type { TelemetryProvider } from '@/telemetry/types';

/**
 * FPS derived from the central clock's frame deltas — not a second rAF
 * loop (CLAUDE.md #2). This is the Phase 0 reference provider: the
 * pattern every Phase 3 provider should copy is "check availability once,
 * emit immediately, clean up on unsubscribe."
 */
const SMOOTHING = 0.9;

export const browserPerfProvider: TelemetryProvider<number> = {
  isAvailable() {
    return typeof requestAnimationFrame === 'function';
  },

  subscribe(emit) {
    let smoothedFps: number | null = null;

    return clockStore.subscribe(
      (state) => state.delta,
      (delta) => {
        if (delta <= 0) return;
        const instantFps = 1 / delta;
        smoothedFps =
          smoothedFps === null ? instantFps : smoothedFps * SMOOTHING + instantFps * (1 - SMOOTHING);
        emit(Math.round(smoothedFps));
      },
    );
  },
};

const JANK_WINDOW_MS = 1000;
const FRAME_BUDGET_MS = 16.67;

export const browserJankProvider: TelemetryProvider<number> = {
  isAvailable() {
    return typeof requestAnimationFrame === 'function';
  },

  subscribe(emit) {
    const overBudgetFrameTimestamps: number[] = [];
    let elapsedMs = 0;

    return clockStore.subscribe(
      (state) => state.delta,
      (delta) => {
        if (delta <= 0) return;
        const deltaMs = delta * 1000;
        elapsedMs += deltaMs;
        if (deltaMs > FRAME_BUDGET_MS) overBudgetFrameTimestamps.push(elapsedMs);

        const windowStart = elapsedMs - JANK_WINDOW_MS;
        while (overBudgetFrameTimestamps.length > 0 && overBudgetFrameTimestamps[0] < windowStart) {
          overBudgetFrameTimestamps.shift();
        }

        emit(overBudgetFrameTimestamps.length);
      },
    );
  },
};
