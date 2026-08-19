import type { TelemetryProvider } from '@/telemetry/types';

// Cached across isAvailable()/subscribe() so the capability probe only
// creates one throwaway WebGL context instead of one per call — the value
// is static for the life of the page anyway.
let cachedRenderer: string | null | undefined;

function readUnmaskedRenderer(): string | null {
  if (cachedRenderer !== undefined) return cachedRenderer;

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  const ext = gl?.getExtension('WEBGL_debug_renderer_info');
  const renderer = ext ? gl!.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;

  cachedRenderer = typeof renderer === 'string' ? renderer : null;
  return cachedRenderer;
}

export const browserGpuProvider: TelemetryProvider<string> = {
  isAvailable() {
    return readUnmaskedRenderer() !== null;
  },

  subscribe(emit) {
    const renderer = readUnmaskedRenderer();
    if (renderer) emit(renderer);
    return () => {};
  },
};
