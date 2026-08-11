/**
 * Every telemetry channel HOLO-HUD knows about, and the value type it
 * emits. Extend this map when a Phase 3 provider adds a new channel —
 * `perf.fps` is the only entry for now; it's the Phase 0 gate's live
 * readout and the reference other providers copy.
 */
export interface ChannelMap {
  'perf.fps': number;
}

export type Channel = keyof ChannelMap;

export type Unsubscribe = () => void;

/**
 * A single data source for one channel. The registry (registry.ts) always
 * pairs a provider with a fallback, so a component reading a channel never
 * has to know or care whether the number on screen is real or simulated —
 * see CLAUDE.md #4 and ROADMAP.md's provider-abstraction design.
 */
export interface TelemetryProvider<T> {
  /** Checked once, synchronously, before subscribing — e.g. a permission or browser API check. */
  isAvailable(): boolean;
  /**
   * Start emitting values. Must call `emit` at least once as soon as a
   * value is known. Returns a cleanup function called when the last
   * subscriber for this channel unsubscribes.
   */
  subscribe(emit: (value: T) => void): Unsubscribe;
}
