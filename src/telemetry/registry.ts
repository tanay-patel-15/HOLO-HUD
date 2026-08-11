import { browserPerfProvider } from './providers/browser/perf';
import { simulatedPerfProvider } from './providers/simulated/perf';
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
