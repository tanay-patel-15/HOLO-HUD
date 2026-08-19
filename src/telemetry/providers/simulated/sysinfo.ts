import type { TelemetryProvider } from '@/telemetry/types';

const FAKE_GPU = 'ANGLE (Apple, Apple M2, OpenGL 4.1)';
const CORES = 8;
const MEMORY_GB = 8;
const BASE_HEAP_MB = 120;
const HEAP_JITTER_MB = 15;
const EMIT_INTERVAL_MS = 1000;

export const simulatedGpuProvider: TelemetryProvider<string> = {
  isAvailable() {
    return true;
  },
  subscribe(emit) {
    emit(FAKE_GPU);
    return () => {};
  },
};

export const simulatedCoresProvider: TelemetryProvider<number> = {
  isAvailable() {
    return true;
  },
  subscribe(emit) {
    emit(CORES);
    return () => {};
  },
};

// Unlike gpu/cores/memory, heap usage plausibly moves during a session, so
// it's the one sys.* channel that jitters on an interval.
export const simulatedHeapProvider: TelemetryProvider<number> = {
  isAvailable() {
    return true;
  },
  subscribe(emit) {
    emit(BASE_HEAP_MB);
    const id = setInterval(() => {
      const jitter = (Math.random() * 2 - 1) * HEAP_JITTER_MB;
      emit(Math.round(BASE_HEAP_MB + jitter));
    }, EMIT_INTERVAL_MS);
    return () => clearInterval(id);
  },
};

export const simulatedMemoryProvider: TelemetryProvider<number> = {
  isAvailable() {
    return true;
  },
  subscribe(emit) {
    emit(MEMORY_GB);
    return () => {};
  },
};
