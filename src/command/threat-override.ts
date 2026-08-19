import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ChannelMap } from '@/telemetry/types';

export type ThreatLevel = ChannelMap['threat.level'];

export interface ThreatOverrideState {
  level: ThreatLevel | null;
  set: (level: ThreatLevel) => void;
  clear: () => void;
}

/**
 * Session-only command override for the THREAT readout. Not a telemetry
 * channel — derived `threat.ts` is unchanged. `null` means "use derived".
 */
export const threatOverrideStore = createStore<ThreatOverrideState>()(
  subscribeWithSelector((set) => ({
    level: null,
    set(level) {
      set({ level });
    },
    clear() {
      set({ level: null });
    },
  })),
);

export function useThreatOverride(): ThreatLevel | null {
  return useStore(threatOverrideStore, (state) => state.level);
}
