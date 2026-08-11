import { advance, Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useMemo } from 'react';
import { clockStore } from '@/core/clock';
import { readTokens } from '@/core/tokens';
import { ArcReactor } from '@/scene/ArcReactor';
import { CameraRig } from '@/scene/CameraRig';
import { Effects } from '@/scene/Effects';
import { GridFloor } from '@/scene/GridFloor';
import { LightShafts } from '@/scene/LightShafts';
import { ParticleField } from '@/scene/ParticleField';

function SceneContents() {
  return (
    <>
      <CameraRig />
      <ArcReactor />
      <GridFloor />
      <LightShafts />
      <ParticleField />
      <Effects />
    </>
  );
}

/**
 * WebGL owns the world (ROADMAP's "Central Constraint"). Mounted as a
 * plain absolutely-positioned layer behind the DOM chrome in App.tsx — the
 * DOM stays responsible for every glyph, this canvas never renders text.
 */
export function SceneCanvas() {
  const tokens = useMemo(() => readTokens(), []);

  // Drives the R3F render loop from core/clock.ts's single rAF instead of
  // letting Canvas spin up its own (CLAUDE.md #2: one rAF loop, ever).
  // Canvas below is mounted with frameloop="never", which disables R3F's
  // internal loop entirely; every clock tick calls the top-level `advance`
  // export (not the `useThree`-scoped one — see note below), so every
  // useFrame in the scene fires in lockstep with the same loop that drives
  // telemetry and DOM parallax.
  //
  // This subscription deliberately lives here, in a normal DOM-rendered
  // component, rather than in a component mounted *inside* <Canvas>.
  // React's passive effects (useEffect) never flush for components in
  // R3F's custom-reconciler subtree in this setup — confirmed by a direct
  // test (a useEffect writing document.title from inside Canvas never
  // ran, while the identical effect in a normal component did) — so any
  // useEffect-based driver placed inside Canvas silently never starts.
  // The top-level `advance(timestamp)` export sidesteps this entirely: it
  // iterates every registered R3F root itself, so it can be called from
  // ordinary, reliably-effecting DOM-side code instead.
  //
  // `timestamp` feeds directly into `state.clock.elapsedTime` (a
  // THREE.Clock, measured in seconds) to derive each frame's delta, so
  // this must be seconds — matching clockStore's `elapsed` — not
  // milliseconds. Passing milliseconds corrupts every subscriber's delta
  // by 1000x, including @react-three/postprocessing's EffectComposer.
  useEffect(() => {
    return clockStore.subscribe(
      (state) => state.elapsed,
      (elapsed) => advance(elapsed),
    );
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        frameloop="never"
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 0, 10], fov: 45, near: 0.1, far: 100 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[tokens.bgDeep]} />
        <Suspense fallback={null}>
          <SceneContents />
        </Suspense>
      </Canvas>
    </div>
  );
}
