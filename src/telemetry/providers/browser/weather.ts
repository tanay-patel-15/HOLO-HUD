import type { TelemetryProvider } from '@/telemetry/types';

const FALLBACK_LAT = 40.7484;
const FALLBACK_LON = -73.9857;
const POSITION_TIMEOUT_MS = 8000;
const POLL_INTERVAL_MS = 60_000;

const FALLBACK_TEMP = 18;
const FALLBACK_CONDITION = 'CLEAR';

type WeatherListener = (temp: number, condition: string) => void;

const listeners = new Set<WeatherListener>();
let pollId: ReturnType<typeof setInterval> | null = null;
let lastTemp: number | null = null;
let lastCondition: string | null = null;

function conditionFromWeatherCode(code: number): string {
  if (code === 0) return 'CLEAR';
  if (code <= 3) return 'CLOUDY';
  if (code === 45 || code === 48) return 'FOG';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'RAIN';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'SNOW';
  if (code >= 95) return 'STORM';
  return 'CLEAR';
}

function resolveCoords(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      resolve({ lat: FALLBACK_LAT, lon: FALLBACK_LON });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => resolve({ lat: FALLBACK_LAT, lon: FALLBACK_LON }),
      { timeout: POSITION_TIMEOUT_MS, maximumAge: 60 * 60 * 1000 },
    );
  });
}

async function pollOnce() {
  try {
    const { lat, lon } = await resolveCoords();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
    const response = await fetch(url);
    if (!response.ok) return;
    const data = await response.json();
    const temp = data?.current?.temperature_2m;
    const code = data?.current?.weather_code;
    if (typeof temp !== 'number' || typeof code !== 'number') return;
    const condition = conditionFromWeatherCode(code);
    lastTemp = temp;
    lastCondition = condition;
    listeners.forEach((listener) => listener(temp, condition));
  } catch {
    // Fetch failed — keep emitting the last good value (or the static
    // fallback if we never got one) rather than going silent.
  }
}

function ensurePolling() {
  if (pollId !== null) return;
  void pollOnce();
  pollId = setInterval(() => void pollOnce(), POLL_INTERVAL_MS);
}

function subscribeWeather(listener: WeatherListener): () => void {
  listeners.add(listener);
  ensurePolling();
  listener(lastTemp ?? FALLBACK_TEMP, lastCondition ?? FALLBACK_CONDITION);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && pollId !== null) {
      clearInterval(pollId);
      pollId = null;
    }
  };
}

export const browserWeatherTempProvider: TelemetryProvider<number> = {
  isAvailable() {
    return typeof fetch === 'function';
  },
  subscribe(emit) {
    return subscribeWeather((temp) => emit(temp));
  },
};

export const browserWeatherConditionProvider: TelemetryProvider<string> = {
  isAvailable() {
    return typeof fetch === 'function';
  },
  subscribe(emit) {
    return subscribeWeather((_temp, condition) => emit(condition));
  },
};
