import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clockStore } from '@/core/clock';
import { readTokens } from '@/core/tokens';
import '@/scene/shaders';
import type { ArcCoreMaterial } from '@/scene/shaders';

const dummy = new THREE.Object3D();

interface RingSpec {
  radius: number;
  tube: number;
  /** rad/s — kept mutually irrational-ish so the ring pattern never repeats (CLAUDE.md aesthetic guardrails). */
  speed: number;
  opacity: number;
}

const RINGS: RingSpec[] = [
  { radius: 1.55, tube: 0.012, speed: 0.11, opacity: 0.55 },
  { radius: 1.85, tube: 0.008, speed: -0.087, opacity: 0.35 },
  { radius: 2.2, tube: 0.006, speed: 0.063, opacity: 0.22 },
];

const SPOKE_COUNT = 24;
const SPOKE_RADIUS = 1.7;
const PARTICLE_COUNT = 90;

/**
 * The arc reactor: three independently-spinning rings, a segmented spoke
 * ring (the "layered rings" from the ROADMAP spec), a fresnel/noise shader
 * core, and a swarm of instanced motes orbiting at varying radius/height.
 * Everything here animates via useFrame reading clockStore.getState()
 * directly — never a React re-render, never GSAP touching a Three object
 * (CLAUDE.md #1/#2).
 */
export function ArcReactor() {
  const tokens = useMemo(() => readTokens(), []);
  const coreColor = useMemo(() => new THREE.Color(tokens.core), [tokens.core]);
  const brightColor = useMemo(() => new THREE.Color(tokens.coreBright), [tokens.coreBright]);
  const dimColor = useMemo(() => new THREE.Color(tokens.coreDim), [tokens.coreDim]);

  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const spokeRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const coreMatRef = useRef<InstanceType<typeof ArcCoreMaterial>>(null);

  const particleSeeds = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, () => ({
        radius: 1.3 + Math.random() * 1.6,
        speed: (Math.random() - 0.5) * 0.6,
        phase: Math.random() * Math.PI * 2,
        height: (Math.random() - 0.5) * 0.9,
        bobSpeed: 0.4 + Math.random() * 0.6,
        scale: 0.012 + Math.random() * 0.02,
      })),
    [],
  );

  // Spoke placement is static — set once, then the whole InstancedMesh
  // rotates as a unit per-frame below (cheaper than rewriting per-instance
  // matrices every tick for something that only needs rigid rotation).
  // useLayoutEffect, not useEffect: components mounted inside <Canvas>
  // never get their passive effects (useEffect) flushed in this R3F/React
  // 19 setup (confirmed directly — see scene/Scene.tsx's comment), so a
  // plain useEffect here would silently leave every spoke instance at the
  // identity matrix, collapsed at the origin. useFrame's own internal
  // subscription (which demonstrably does run) relies on
  // useIsomorphicLayoutEffect, not useEffect — that's the reliable one.
  useLayoutEffect(() => {
    const mesh = spokeRef.current;
    if (!mesh) return;
    for (let i = 0; i < SPOKE_COUNT; i++) {
      const angle = (i / SPOKE_COUNT) * Math.PI * 2;
      dummy.position.set(Math.cos(angle) * SPOKE_RADIUS, Math.sin(angle) * SPOKE_RADIUS, 0);
      dummy.rotation.set(0, 0, angle);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(() => {
    const { elapsed } = clockStore.getState();

    ringRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.rotation.z = elapsed * RINGS[i].speed;
    });

    if (spokeRef.current) {
      spokeRef.current.rotation.z = -elapsed * 0.045;
    }

    if (coreMatRef.current) {
      coreMatRef.current.uTime = elapsed;
    }

    if (particlesRef.current) {
      particleSeeds.forEach((seed, i) => {
        const angle = seed.phase + elapsed * seed.speed;
        const x = Math.cos(angle) * seed.radius;
        const y = seed.height + Math.sin(elapsed * seed.bobSpeed + seed.phase) * 0.12;
        const z = Math.sin(angle) * seed.radius;
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(seed.scale);
        dummy.updateMatrix();
        particlesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      particlesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {RINGS.map((ring, i) => (
        <mesh
          key={i}
          ref={(m) => {
            ringRefs.current[i] = m;
          }}
        >
          <torusGeometry args={[ring.radius, ring.tube, 12, 96]} />
          <meshBasicMaterial
            color={i === 0 ? coreColor : dimColor}
            transparent
            opacity={ring.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      <instancedMesh ref={spokeRef} args={[undefined, undefined, SPOKE_COUNT]} frustumCulled={false}>
        <boxGeometry args={[0.06, 0.012, 0.012]} />
        <meshBasicMaterial
          color={dimColor}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      <mesh>
        <sphereGeometry args={[1.05, 64, 64]} />
        <arcCoreMaterial
          ref={coreMatRef}
          uColor={coreColor}
          uColorBright={brightColor}
          uIntensity={1.1}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      <instancedMesh ref={particlesRef} args={[undefined, undefined, PARTICLE_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color={brightColor}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}
