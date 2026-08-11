import { useEffect, useRef } from 'react';
import { cameraStore, getParallaxTransform } from '@/core/camera-store';

/**
 * Binds a DOM node's transform to the shared virtual camera
 * (core/camera-store.ts) without ever causing a React re-render — the
 * subscription callback mutates `node.style.transform` directly, same
 * non-reactive-store pattern telemetry/providers/browser/perf.ts uses for
 * the clock. `depth` controls how far off the screen plane the panel
 * feels: 0 is inert, larger values drift/tilt more with camera rotation.
 *
 * cameraStore only updates once per frame from scene/CameraRig.tsx's
 * useFrame, which is itself driven by the single shared rAF in
 * core/clock.ts — so this is not a second animation loop, just a listener
 * on state that loop already produces.
 */
export function useParallax<T extends HTMLElement>(depth: number) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    node.style.transform = getParallaxTransform(depth);

    return cameraStore.subscribe(
      (state) => state.rotation,
      () => {
        node.style.transform = getParallaxTransform(depth);
      },
    );
  }, [depth]);

  return ref;
}
