import { subscribeChannel } from '@/telemetry/registry';
import type { ChannelMap, TelemetryProvider, Unsubscribe } from '@/telemetry/types';

/**
 * "Threat level" — real inputs, absurd output (ROADMAP's Phase 3 spec).
 * Low battery + high jank + a late hour nudges the HUD toward ELEVATED/
 * CRITICAL. Composes already-abstracted channels (each already has its own
 * primary/fallback pair in the registry) rather than reading a browser API
 * directly, so this provider is always available by construction — see
 * `isAvailable()` below.
 */
const JANK_THRESHOLD = 4;
const LOW_BATTERY_THRESHOLD = 20;
const LATE_HOUR_START = 2;
const LATE_HOUR_END = 5;
const HOUR_RECHECK_MS = 60_000;

function isLateHour(): boolean {
  const hour = new Date().getHours();
  return hour >= LATE_HOUR_START && hour < LATE_HOUR_END;
}

function computeLevel(jank: number, batteryLevel: number, lateHour: boolean): ChannelMap['threat.level'] {
  const flags = [jank > JANK_THRESHOLD, batteryLevel < LOW_BATTERY_THRESHOLD, lateHour];
  const score = flags.filter(Boolean).length;
  if (score >= 3) return 'CRITICAL';
  if (score >= 2) return 'ELEVATED';
  return 'NOMINAL';
}

/**
 * Registered as both primary and fallback in registry.ts — its inputs are
 * themselves channels with their own fallback behavior, so this provider
 * never has a "real API unavailable" case of its own to fall back from.
 */
export const derivedThreatProvider: TelemetryProvider<ChannelMap['threat.level']> = {
  isAvailable() {
    return true;
  },

  subscribe(emit) {
    let jank = 0;
    let batteryLevel = 100;
    let lateHour = isLateHour();

    const recompute = () => emit(computeLevel(jank, batteryLevel, lateHour));

    const unsubJank = subscribeChannel('perf.jank', (value) => {
      jank = value;
      recompute();
    });
    const unsubBattery = subscribeChannel('power.level', (value) => {
      batteryLevel = value;
      recompute();
    });

    recompute();

    const hourInterval = setInterval(() => {
      lateHour = isLateHour();
      recompute();
    }, HOUR_RECHECK_MS);

    const cleanup: Unsubscribe = () => {
      unsubJank();
      unsubBattery();
      clearInterval(hourInterval);
    };
    return cleanup;
  },
};
