import type { TelemetryProvider } from '@/telemetry/types';

const CONDITIONS = ['CLEAR', 'CLOUDY', 'RAIN', 'SNOW', 'STORM', 'FOG'] as const;
const BASE_TEMP_C = 18;
const TEMP_JITTER_C = 1.5;
const EMIT_INTERVAL_MS = 4000;
const CONDITION_CHANGE_CHANCE = 0.05;

export const simulatedWeatherTempProvider: TelemetryProvider<number> = {
  isAvailable() {
    return true;
  },
  subscribe(emit) {
    emit(BASE_TEMP_C);
    const id = setInterval(() => {
      const jitter = (Math.random() * 2 - 1) * TEMP_JITTER_C;
      emit(Math.round((BASE_TEMP_C + jitter) * 10) / 10);
    }, EMIT_INTERVAL_MS);
    return () => clearInterval(id);
  },
};

export const simulatedWeatherConditionProvider: TelemetryProvider<string> = {
  isAvailable() {
    return true;
  },
  subscribe(emit) {
    let index = 0;
    emit(CONDITIONS[index]);
    const id = setInterval(() => {
      if (Math.random() < CONDITION_CHANGE_CHANCE) {
        index = (index + 1) % CONDITIONS.length;
        emit(CONDITIONS[index]);
      }
    }, EMIT_INTERVAL_MS);
    return () => clearInterval(id);
  },
};
