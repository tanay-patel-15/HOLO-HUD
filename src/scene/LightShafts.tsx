import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clockStore } from '@/core/clock';
import { readTokens } from '@/core/tokens';
import '@/scene/shaders';

const SHAFT_COUNT = 6;
const SHAFT_RADIUS = 0.6;

/**
 * Cheap volumetric light shafts: additive-blended planes with a
 * shader-painted soft edge + top fade (scene/shaders.ts's ShaftMaterial),
 * fanned around the reactor and rotating as a unit. Not a real
 * light-scattering pass — that's overkill for a HUD backdrop — but reads
 * convincingly under bloom.
 */
export function LightShafts() {
  const tokens = useMemo(() => readTokens(), []);
  const color = useMemo(() => new THREE.Color(tokens.coreDim), [tokens.coreDim]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const { elapsed } = clockStore.getState();
    groupRef.current.rotation.y = elapsed * 0.023;
  });

  const shafts = useMemo(
    () =>
      Array.from({ length: SHAFT_COUNT }, (_, i) => (i / SHAFT_COUNT) * Math.PI * 2),
    [],
  );

  return (
    <group ref={groupRef} position={[0, -2.2, 0]}>
      {shafts.map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * SHAFT_RADIUS, 3, Math.sin(angle) * SHAFT_RADIUS]}
          rotation={[0, -angle, 0]}
        >
          <planeGeometry args={[0.9, 6]} />
          <shaftMaterial
            uColor={color}
            uOpacity={0.1}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
