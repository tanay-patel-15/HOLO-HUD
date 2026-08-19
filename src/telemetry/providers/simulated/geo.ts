import type { TelemetryProvider } from '@/telemetry/types';

const BASE_LAT = 40.7484;
const BASE_LON = -73.9857;
const JITTER = 0.0003;
const EMIT_INTERVAL_MS = 5000;

export const simulatedGeoLatProvider: TelemetryProvider<number> = {
  isAvailable() {
    return true;
  },
  subscribe(emit) {
    emit(BASE_LAT);
    const id = setInterval(() => {
      emit(BASE_LAT + (Math.random() * 2 - 1) * JITTER);
    }, EMIT_INTERVAL_MS);
    return () => clearInterval(id);
  },
};

export const simulatedGeoLonProvider: TelemetryProvider<number> = {
  isAvailable() {
    return true;
  },
  subscribe(emit) {
    emit(BASE_LON);
    const id = setInterval(() => {
      emit(BASE_LON + (Math.random() * 2 - 1) * JITTER);
    }, EMIT_INTERVAL_MS);
    return () => clearInterval(id);
  },
};
