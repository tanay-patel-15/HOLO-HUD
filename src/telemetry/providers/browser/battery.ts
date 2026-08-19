import type { TelemetryProvider } from '@/telemetry/types';

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

function getBatteryNavigator(): NavigatorWithBattery {
  return navigator as NavigatorWithBattery;
}

export const browserBatteryLevelProvider: TelemetryProvider<number> = {
  isAvailable() {
    return typeof getBatteryNavigator().getBattery === 'function';
  },

  subscribe(emit) {
    let cancelled = false;
    let battery: BatteryManager | null = null;

    const handleChange = () => {
      if (battery) emit(Math.round(battery.level * 100));
    };

    getBatteryNavigator()
      .getBattery!()
      .then((manager) => {
        if (cancelled) return;
        battery = manager;
        handleChange();
        // Event-driven, not polled: BatteryManager fires levelchange itself,
        // so a setInterval here would just re-read an unchanged value most
        // of the time.
        manager.addEventListener('levelchange', handleChange);
      });

    return () => {
      cancelled = true;
      battery?.removeEventListener('levelchange', handleChange);
    };
  },
};

export const browserBatteryChargingProvider: TelemetryProvider<boolean> = {
  isAvailable() {
    return typeof getBatteryNavigator().getBattery === 'function';
  },

  subscribe(emit) {
    let cancelled = false;
    let battery: BatteryManager | null = null;

    const handleChange = () => {
      if (battery) emit(battery.charging);
    };

    getBatteryNavigator()
      .getBattery!()
      .then((manager) => {
        if (cancelled) return;
        battery = manager;
        handleChange();
        manager.addEventListener('chargingchange', handleChange);
      });

    return () => {
      cancelled = true;
      battery?.removeEventListener('chargingchange', handleChange);
    };
  },
};
