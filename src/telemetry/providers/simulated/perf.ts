import type { TelemetryProvider } from '@/telemetry/types';

/**
 * Fallback for `perf.fps`. Deliberately does not depend on
 * requestAnimationFrame — that's the exact capability its primary
 * provider needs, so a fallback that shared the dependency wouldn't be a
 * fallback. In practice rAF is universal and this path is close to dead
 * code; it exists as the reference "always available" simulated provider
 * Phase 3 channels copy for their own fallbacks.
 */
const BASE_FPS = 60;
const JITTER = 2;
const EMIT_INTERVAL_MS = 250;

export const simulatedPerfProvider: TelemetryProvider<number> = {
  isAvailable() {
    return true;
  },

  subscribe(emit) {
    emit(BASE_FPS);
    const id = setInterval(() => {
      const jitter = (Math.random() * 2 - 1) * JITTER;
      emit(Math.round(BASE_FPS + jitter));
    }, EMIT_INTERVAL_MS);
    return () => clearInterval(id);
  },
};

const BASE_JANK = 0;
const JANK_CHANCE = 0.15;
const MAX_JANK_FRAMES = 3;

export const simulatedJankProvider: TelemetryProvider<number> = {
  isAvailable() {
    return true;
  },

  subscribe(emit) {
    emit(BASE_JANK);
    const id = setInterval(() => {
      const jank = Math.random() < JANK_CHANCE ? Math.ceil(Math.random() * MAX_JANK_FRAMES) : 0;
      emit(jank);
    }, EMIT_INTERVAL_MS);
    return () => clearInterval(id);
  },
};
