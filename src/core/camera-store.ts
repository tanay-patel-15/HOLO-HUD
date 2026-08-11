import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * The shared virtual camera — the architecture that solves HOLO-HUD's
 * central constraint (see ROADMAP.md, "The Central Constraint"). WebGL
 * owns the 3D world and reads this for its real camera; DOM panels own
 * every glyph and read the same state to apply a matching
 * translate3d/rotate parallax. Both layers drift together.
 *
 * Nothing writes to this yet in Phase 0 — the Phase 2 camera rig is the
 * first real writer. This file exists now so no panel built in Phase 1
 * has to be retrofitted to read from it later.
 */
export interface CameraState {
  position: { x: number; y: number; z: number };
  /** Euler angles, radians. */
  rotation: { x: number; y: number; z: number };
}

const INITIAL_CAMERA_STATE: CameraState = {
  position: { x: 0, y: 0, z: 10 },
  rotation: { x: 0, y: 0, z: 0 },
};

export const cameraStore = createStore<CameraState>()(
  subscribeWithSelector(() => ({
    position: { ...INITIAL_CAMERA_STATE.position },
    rotation: { ...INITIAL_CAMERA_STATE.rotation },
  })),
);

export function setCameraPose(pose: CameraState): void {
  cameraStore.setState(pose);
}

/** Reactive access. Prefer `cameraStore.getState()` inside `useFrame` callbacks. */
export function useCamera<T>(selector: (state: CameraState) => T): T {
  return useStore(cameraStore, selector);
}

/**
 * A DOM panel's parallax offset for a given depth. `depth` is how far off
 * the "screen plane" the panel should feel — 0 means no parallax, larger
 * values drift and tilt more with camera rotation. Panels call this inside
 * their own rAF/useFrame-driven transform update, not as a React style
 * prop, so it never triggers a render.
 */
export function getParallaxTransform(depth: number): string {
  const { rotation } = cameraStore.getState();
  const translateX = rotation.y * depth * 40;
  const translateY = rotation.x * depth * 40;
  const rotateY = rotation.y * depth * 6;
  const rotateX = -rotation.x * depth * 6;
  return `translate3d(${translateX}px, ${translateY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}
