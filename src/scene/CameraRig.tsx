import { useFrame } from '@react-three/fiber';
import { clockStore } from '@/core/clock';
import { setCameraPose } from '@/core/camera-store';

/**
 * The first writer to core/camera-store.ts (Phase 0 left it inert on
 * purpose — see that file's header). Drifts the real R3F camera slowly on
 * incommensurable-frequency sines/cosines, always looking at the reactor at
 * the origin, then republishes the resulting pose so DOM panels can apply a
 * matching parallax transform via getParallaxTransform() (hud/useParallax.ts).
 *
 * Reads clockStore.getState() directly rather than a reactive selector —
 * this runs inside useFrame, which is itself driven by the single rAF loop
 * in core/clock.ts via scene/Scene.tsx's manual `advance()` call, so it
 * never triggers a React render (CLAUDE.md's per-frame-state rule).
 */
export function CameraRig() {
  useFrame((state) => {
    const { elapsed } = clockStore.getState();

    const x = Math.sin(elapsed * 0.083) * 1.1;
    const y = Math.cos(elapsed * 0.061) * 0.65;
    const z = 10 + Math.sin(elapsed * 0.047) * 0.5;

    state.camera.position.set(x, y, z);
    state.camera.lookAt(0, 0, 0);

    const { rotation } = state.camera;
    setCameraPose({
      position: { x, y, z },
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
    });
  });

  return null;
}
