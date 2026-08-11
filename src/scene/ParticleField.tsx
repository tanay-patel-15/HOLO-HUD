import { Sparkles } from '@react-three/drei';
import { useMemo } from 'react';
import { readTokens } from '@/core/tokens';

/**
 * Ambient background dust filling the volume around the reactor — depth
 * cueing more than a focal element, so this leans on drei's Sparkles
 * (GPU point sprites, built-in gentle drift) instead of a hand-rolled
 * InstancedMesh like ArcReactor's motes get, which need per-instance
 * orbital control Sparkles doesn't expose.
 */
export function ParticleField() {
  const tokens = useMemo(() => readTokens(), []);

  return (
    <Sparkles
      count={220}
      scale={[16, 8, 16]}
      size={1.4}
      speed={0.15}
      opacity={0.35}
      color={tokens.coreDim}
      noise={1}
    />
  );
}
