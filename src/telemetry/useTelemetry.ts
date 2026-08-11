import { useEffect, useState } from 'react';
import { subscribeChannel } from './registry';
import type { Channel, ChannelMap } from './types';

/**
 * The only sanctioned way for a component to read telemetry (CLAUDE.md
 * #4) — never call a browser API directly from a component. Returns
 * `undefined` only before the channel's first emission; providers are
 * required to emit immediately on subscribe, so this window is one frame,
 * not an empty/broken state to design around.
 */
export function useTelemetry<K extends Channel>(channel: K): ChannelMap[K] | undefined {
  const [value, setValue] = useState<ChannelMap[K] | undefined>(undefined);

  useEffect(() => {
    return subscribeChannel(channel, setValue);
  }, [channel]);

  return value;
}
