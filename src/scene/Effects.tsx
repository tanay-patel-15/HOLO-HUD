import { Bloom, ChromaticAberration, EffectComposer, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';

const ABERRATION_OFFSET = new Vector2(0.0006, 0.0006);

/**
 * Bloom supplies the perceived intensity of the reactor glow — base colors
 * stay near 70% saturation (styles/tokens.css) precisely so bloom has room
 * to push them toward white without clipping flat (CLAUDE.md aesthetic
 * guardrails). Chromatic aberration and grain stay subtle: this is a HUD,
 * not a found-footage filter.
 */
export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.7}
        luminanceThreshold={0.35}
        luminanceSmoothing={0.25}
        radius={0.6}
        mipmapBlur
      />
      <ChromaticAberration offset={ABERRATION_OFFSET} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.035} />
    </EffectComposer>
  );
}
