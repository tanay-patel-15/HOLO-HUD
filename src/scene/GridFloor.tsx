import { Grid } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import { clockStore } from '@/core/clock';
import { readTokens } from '@/core/tokens';

/**
 * A Tron-style perspective floor beneath the reactor. Uses drei's Grid
 * helper rather than a hand-rolled shader — ROADMAP explicitly calls out
 * drei's helpers as the time-saver R3F buys over vanilla Three, and a grid
 * is exactly the well-trodden case that applies to.
 */
export function GridFloor() {
  const tokens = useMemo(() => readTokens(), []);
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const { elapsed } = clockStore.getState();
    // Never fully static (CLAUDE.md aesthetic guardrails): an almost
    // imperceptible drift so the floor still reads as "alive."
    groupRef.current.rotation.y = Math.sin(elapsed * 0.015) * 0.04;
  });

  return (
    <group ref={groupRef} position={[0, -2.3, 0]}>
      <Grid
        args={[60, 60]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor={tokens.coreDim}
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor={tokens.core}
        fadeDistance={26}
        fadeStrength={1.4}
        infiniteGrid
        followCamera={false}
      />
    </group>
  );
}
