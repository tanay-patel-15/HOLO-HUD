import type { TelemetryProvider } from '@/telemetry/types';

const START_LEVEL = 76;
const DISCHARGE_PER_TICK = 0.05;
const LEVEL_JITTER = 0.3;
const EMIT_INTERVAL_MS = 2000;
const CHARGE_FLIP_CHANCE = 0.02;

export const simulatedBatteryLevelProvider: TelemetryProvider<number> = {
  isAvailable() {
    return true;
  },
  subscribe(emit) {
    let level = START_LEVEL;
    emit(Math.round(level));
    const id = setInterval(() => {
      const jitter = (Math.random() * 2 - 1) * LEVEL_JITTER;
      level = Math.min(100, Math.max(0, level - DISCHARGE_PER_TICK + jitter));
      emit(Math.round(level));
    }, EMIT_INTERVAL_MS);
    return () => clearInterval(id);
  },
};

export const simulatedBatteryChargingProvider: TelemetryProvider<boolean> = {
  isAvailable() {
    return true;
  },
  subscribe(emit) {
    let charging = false;
    emit(charging);
    const id = setInterval(() => {
      if (Math.random() < CHARGE_FLIP_CHANCE) {
        charging = !charging;
        emit(charging);
      }
    }, EMIT_INTERVAL_MS);
    return () => clearInterval(id);
  },
};
