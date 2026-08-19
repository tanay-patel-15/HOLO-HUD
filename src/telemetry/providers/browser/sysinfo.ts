import type { TelemetryProvider } from '@/telemetry/types';

interface PerformanceWithMemory extends Performance {
  memory?: { usedJSHeapSize: number };
}

interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number;
}

const HEAP_POLL_INTERVAL_MS = 3000;

export const browserCoresProvider: TelemetryProvider<number> = {
  isAvailable() {
    return true;
  },

  subscribe(emit) {
    emit(navigator.hardwareConcurrency);
    return () => {};
  },
};

export const browserHeapProvider: TelemetryProvider<number> = {
  isAvailable() {
    return typeof (performance as PerformanceWithMemory).memory?.usedJSHeapSize === 'number';
  },

  subscribe(emit) {
    const readHeapMb = () => (performance as PerformanceWithMemory).memory!.usedJSHeapSize / 1e6;
    emit(readHeapMb());
    const id = setInterval(() => emit(readHeapMb()), HEAP_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  },
};

export const browserMemoryProvider: TelemetryProvider<number> = {
  isAvailable() {
    return typeof (navigator as NavigatorWithDeviceMemory).deviceMemory === 'number';
  },

  subscribe(emit) {
    emit((navigator as NavigatorWithDeviceMemory).deviceMemory!);
    return () => {};
  },
};
