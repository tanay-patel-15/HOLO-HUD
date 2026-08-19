import type { TelemetryProvider } from '@/telemetry/types';

interface NetworkInformation extends EventTarget {
  effectiveType: string;
  downlink: number;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

function getConnection(): NetworkInformation | undefined {
  return (navigator as NavigatorWithConnection).connection;
}

export const browserNetworkTypeProvider: TelemetryProvider<string> = {
  isAvailable() {
    return 'connection' in navigator;
  },

  subscribe(emit) {
    const connection = getConnection();
    if (!connection) return () => {};

    // NetworkInformation fires 'change' itself — no polling needed.
    const handleChange = () => emit(connection.effectiveType);
    handleChange();
    connection.addEventListener('change', handleChange);
    return () => connection.removeEventListener('change', handleChange);
  },
};

export const browserNetworkDownlinkProvider: TelemetryProvider<number> = {
  isAvailable() {
    return 'connection' in navigator;
  },

  subscribe(emit) {
    const connection = getConnection();
    if (!connection) return () => {};

    const handleChange = () => emit(connection.downlink);
    handleChange();
    connection.addEventListener('change', handleChange);
    return () => connection.removeEventListener('change', handleChange);
  },
};
