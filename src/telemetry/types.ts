/**
 * Every telemetry channel HOLO-HUD knows about, and the value type it
 * emits. `perf.fps` was Phase 0's gate readout and the reference other
 * providers copy; the rest were added in Phase 3 to back the live HUD
 * modules (ROADMAP's channel table).
 */
export interface ChannelMap {
  'perf.fps': number;
  /** Frames in the last ~1s that exceeded the 16.67ms/60fps budget. */
  'perf.jank': number;
  /** Normalized (0–1) frequency-bin magnitudes, fixed length — audio.fft's own AUDIO_FFT_BINS. */
  'audio.fft': number[];
  /** WEBGL_debug_renderer_info renderer string, e.g. "ANGLE (Apple, Apple M2, OpenGL 4.1)". */
  'sys.gpu': string;
  /** navigator.hardwareConcurrency. */
  'sys.cores': number;
  /** Used JS heap, MB (performance.memory — Chrome only). */
  'sys.heap': number;
  /** navigator.deviceMemory, GB — coarse, Chrome only. */
  'sys.memory': number;
  /** Battery level, 0–100. */
  'power.level': number;
  'power.charging': boolean;
  /** navigator.connection.effectiveType, e.g. '4g', '3g', 'wifi'. */
  'net.type': string;
  /** navigator.connection.downlink, Mbps. */
  'net.downlink': number;
  'geo.lat': number;
  'geo.lon': number;
  /** Degrees Celsius. */
  'weather.temp': number;
  /** Short human label derived from the source's weather code, e.g. "CLEAR", "RAIN". */
  'weather.condition': string;
  /** Derived metric (not a raw source) — see telemetry/derived/threat.ts. */
  'threat.level': 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
}

export type Channel = keyof ChannelMap;

export type Unsubscribe = () => void;

/**
 * A single data source for one channel. The registry (registry.ts) always
 * pairs a provider with a fallback, so a component reading a channel never
 * has to know or care whether the number on screen is real or simulated —
 * see CLAUDE.md #4 and ROADMAP.md's provider-abstraction design.
 *
 * `isAvailable()` is a synchronous *capability* check (does the browser
 * expose this API at all) — it cannot know whether a permission prompt
 * (geolocation, getUserMedia) will actually be granted. Providers backed
 * by a permission-gated API are responsible for degrading gracefully
 * *themselves* on denial (typically by emitting the same kind of synthetic
 * values their simulated counterpart would) rather than just going silent
 * — see providers/browser/geo.ts and audio-fft.ts for the pattern.
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
