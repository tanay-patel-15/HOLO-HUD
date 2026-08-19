import type { TelemetryProvider } from '@/telemetry/types';

// A recognizable, obviously-synthetic fixed coordinate (Stark Tower, NYC)
// used when the geolocation permission prompt is denied — isAvailable()
// only proves the API exists, not that the prompt will be granted, so this
// provider is responsible for degrading itself rather than sitting at
// `undefined` forever (see types.ts's TelemetryProvider doc comment).
const FALLBACK_LAT = 40.7484;
const FALLBACK_LON = -73.9857;
const FALLBACK_JITTER = 0.0005;
const FALLBACK_EMIT_INTERVAL_MS = 5000;

function createGeoProvider(
  select: (position: GeolocationPosition) => number,
  fallbackBase: number,
): TelemetryProvider<number> {
  return {
    isAvailable() {
      return typeof navigator !== 'undefined' && 'geolocation' in navigator;
    },

    subscribe(emit) {
      let fallbackId: ReturnType<typeof setInterval> | null = null;

      const startFallback = () => {
        if (fallbackId !== null) return;
        fallbackId = setInterval(() => {
          emit(fallbackBase + (Math.random() * 2 - 1) * FALLBACK_JITTER);
        }, FALLBACK_EMIT_INTERVAL_MS);
      };

      // isAvailable() only proves the API exists — watchPosition's first
      // callback (success or denial) can take an arbitrary amount of time
      // depending on how quickly the user answers the permission prompt,
      // so this emits the fallback value immediately too, exactly like
      // audio-fft.ts does for the same reason: a channel must never sit at
      // `undefined` while a provider waits on a permission decision.
      emit(fallbackBase);

      const watchId = navigator.geolocation.watchPosition(
        (position) => emit(select(position)),
        () => startFallback(),
        { enableHighAccuracy: false, maximumAge: 30000 },
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
        if (fallbackId !== null) clearInterval(fallbackId);
      };
    },
  };
}

export const browserGeoLatProvider = createGeoProvider((position) => position.coords.latitude, FALLBACK_LAT);
export const browserGeoLonProvider = createGeoProvider((position) => position.coords.longitude, FALLBACK_LON);
