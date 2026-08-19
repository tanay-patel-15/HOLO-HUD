import { derivedThreatProvider } from './derived/threat';
import { browserAudioFftProvider } from './providers/browser/audio-fft';
import { browserBatteryChargingProvider, browserBatteryLevelProvider } from './providers/browser/battery';
import { browserGeoLatProvider, browserGeoLonProvider } from './providers/browser/geo';
import { browserGpuProvider } from './providers/browser/gpu';
import { browserNetworkDownlinkProvider, browserNetworkTypeProvider } from './providers/browser/network';
import { browserJankProvider, browserPerfProvider } from './providers/browser/perf';
import { browserCoresProvider, browserHeapProvider, browserMemoryProvider } from './providers/browser/sysinfo';
import { browserWeatherConditionProvider, browserWeatherTempProvider } from './providers/browser/weather';
import { simulatedAudioFftProvider } from './providers/simulated/audio';
import { simulatedBatteryChargingProvider, simulatedBatteryLevelProvider } from './providers/simulated/battery';
import { simulatedGeoLatProvider, simulatedGeoLonProvider } from './providers/simulated/geo';
import { simulatedNetworkDownlinkProvider, simulatedNetworkTypeProvider } from './providers/simulated/network';
import { simulatedJankProvider, simulatedPerfProvider } from './providers/simulated/perf';
import {
  simulatedCoresProvider,
  simulatedGpuProvider,
  simulatedHeapProvider,
  simulatedMemoryProvider,
} from './providers/simulated/sysinfo';
import { simulatedWeatherConditionProvider, simulatedWeatherTempProvider } from './providers/simulated/weather';
import type { Channel, ChannelMap, TelemetryProvider, Unsubscribe } from './types';

interface RegistryEntry<K extends Channel> {
  primary: TelemetryProvider<ChannelMap[K]>;
  fallback: TelemetryProvider<ChannelMap[K]>;
}

/**
 * Every channel in ChannelMap must have an entry here — the mapped type
 * makes that a compile error, not a runtime surprise, if a Phase 3
 * provider adds a channel and forgets to register it.
 */
type Registry = { [K in Channel]: RegistryEntry<K> };

const registry: Registry = {
  'perf.fps': { primary: browserPerfProvider, fallback: simulatedPerfProvider },
  'perf.jank': { primary: browserJankProvider, fallback: simulatedJankProvider },
  'audio.fft': { primary: browserAudioFftProvider, fallback: simulatedAudioFftProvider },
  'sys.gpu': { primary: browserGpuProvider, fallback: simulatedGpuProvider },
  'sys.cores': { primary: browserCoresProvider, fallback: simulatedCoresProvider },
  'sys.heap': { primary: browserHeapProvider, fallback: simulatedHeapProvider },
  'sys.memory': { primary: browserMemoryProvider, fallback: simulatedMemoryProvider },
  'power.level': { primary: browserBatteryLevelProvider, fallback: simulatedBatteryLevelProvider },
  'power.charging': { primary: browserBatteryChargingProvider, fallback: simulatedBatteryChargingProvider },
  'net.type': { primary: browserNetworkTypeProvider, fallback: simulatedNetworkTypeProvider },
  'net.downlink': { primary: browserNetworkDownlinkProvider, fallback: simulatedNetworkDownlinkProvider },
  'geo.lat': { primary: browserGeoLatProvider, fallback: simulatedGeoLatProvider },
  'geo.lon': { primary: browserGeoLonProvider, fallback: simulatedGeoLonProvider },
  'weather.temp': { primary: browserWeatherTempProvider, fallback: simulatedWeatherTempProvider },
  'weather.condition': { primary: browserWeatherConditionProvider, fallback: simulatedWeatherConditionProvider },
  // Composes other channels (each already real-or-simulated) rather than a
  // raw browser API, so it's always available by construction — see
  // derived/threat.ts.
  'threat.level': { primary: derivedThreatProvider, fallback: derivedThreatProvider },
};

/**
 * Subscribes to a channel, transparently using the primary provider when
 * it's available in this environment and falling back otherwise — the
 * caller never sees the difference (CLAUDE.md #4).
 */
export function subscribeChannel<K extends Channel>(
  channel: K,
  emit: (value: ChannelMap[K]) => void,
): Unsubscribe {
  const entry = registry[channel];
  const provider = entry.primary.isAvailable() ? entry.primary : entry.fallback;
  return provider.subscribe(emit);
}
