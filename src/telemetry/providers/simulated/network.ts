import type { TelemetryProvider } from '@/telemetry/types';

const NETWORK_TYPE = '4g';
const BASE_DOWNLINK_MBPS = 45;
const DOWNLINK_JITTER_MBPS = 8;
const EMIT_INTERVAL_MS = 1500;

export const simulatedNetworkTypeProvider: TelemetryProvider<string> = {
  isAvailable() {
    return true;
  },
  subscribe(emit) {
    emit(NETWORK_TYPE);
    return () => {};
  },
};

export const simulatedNetworkDownlinkProvider: TelemetryProvider<number> = {
  isAvailable() {
    return true;
  },
  subscribe(emit) {
    emit(BASE_DOWNLINK_MBPS);
    const id = setInterval(() => {
      const jitter = (Math.random() * 2 - 1) * DOWNLINK_JITTER_MBPS;
      emit(Math.round((BASE_DOWNLINK_MBPS + jitter) * 10) / 10);
    }, EMIT_INTERVAL_MS);
    return () => clearInterval(id);
  },
};
