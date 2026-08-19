import type { TelemetryProvider } from '@/telemetry/types';

const BIN_COUNT = 32;
const EMIT_INTERVAL_MS = 50;
const SMOOTHING = 0.7;

function nextFrame(previous: number[] | null): number[] {
  const frame = new Array<number>(BIN_COUNT);
  for (let i = 0; i < BIN_COUNT; i++) {
    const target = Math.random();
    const prev = previous?.[i] ?? target;
    frame[i] = prev * SMOOTHING + target * (1 - SMOOTHING);
  }
  return frame;
}

export const simulatedAudioFftProvider: TelemetryProvider<number[]> = {
  isAvailable() {
    return true;
  },

  subscribe(emit) {
    let frame = nextFrame(null);
    emit(frame);
    const id = setInterval(() => {
      frame = nextFrame(frame);
      emit(frame);
    }, EMIT_INTERVAL_MS);
    return () => clearInterval(id);
  },
};
