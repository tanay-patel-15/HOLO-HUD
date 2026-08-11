import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Ashima/McEwan classic 3D simplex noise — public-domain GLSL, used here for
 * the reactor core's "energy churn" and inlined (not a texture) so it can be
 * evaluated per-fragment on the sphere's normal and scroll smoothly over
 * time without UV seams.
 */
const SIMPLEX_NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
  vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

/**
 * The reactor core: fresnel rim + two noise octaves scrolling at different
 * rates (the "layered noise" from ROADMAP's Phase 2 spec) modulated by a
 * slow sine breathing envelope. Additive-blended, unlit — it supplies its
 * own light via bloom rather than reacting to scene lights.
 */
export const ArcCoreMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#00e5ff'),
    uColorBright: new THREE.Color('#ffffff'),
    uIntensity: 1,
  },
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uColorBright;
    uniform float uIntensity;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    ${SIMPLEX_NOISE_GLSL}

    void main() {
      vec3 viewDir = normalize(vViewPosition);
      // Steep falloff (pow 4) so only a thin limb actually brightens —
      // fresnel at a lower power lights up half the visible disc, which
      // read as a flat grey ball instead of a glowing rim (CLAUDE.md
      // aesthetic guardrails: bloom supplies intensity, the shader must
      // not pre-whiten most of the surface itself).
      float fresnel = pow(1.0 - clamp(dot(vNormal, viewDir), 0.0, 1.0), 4.0);

      float n1 = snoise(vNormal * 2.4 + vec3(0.0, 0.0, uTime * 0.15));
      float n2 = snoise(vNormal * 5.2 - vec3(0.0, 0.0, uTime * 0.37)) * 0.5;
      float noise = (n1 + n2) * 0.5 + 0.5;

      float breathe = 0.72 + 0.28 * sin(uTime * 0.9);
      float core = smoothstep(0.55, 0.85, noise) * breathe;

      // Body stays a scaled version of uColor (hue preserved, just
      // dimmer/brighter with the noise churn) instead of blending toward
      // white — only the rim mix pulls toward uColorBright.
      vec3 body = uColor * (0.32 + core * 0.4);
      vec3 color = mix(body, uColorBright, fresnel);
      float alpha = clamp(0.5 + core * 0.25 + fresnel * 0.85, 0.0, 1.0) * uIntensity;

      gl_FragColor = vec4(color, alpha);
    }
  `,
);

/**
 * A single volumetric light-shaft plane: soft horizontal edges, fades to
 * nothing toward the top. Several of these fanned around Y and additively
 * blended approximate a volumetric cone without a real light-scattering pass.
 */
export const ShaftMaterial = shaderMaterial(
  { uColor: new THREE.Color('#00e5ff'), uOpacity: 0.12 },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
      float edge = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
      float vertical = smoothstep(1.0, 0.1, vUv.y);
      gl_FragColor = vec4(uColor, edge * vertical * uOpacity);
    }
  `,
);

extend({ ArcCoreMaterial, ShaftMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    arcCoreMaterial: import('@react-three/fiber').ThreeElement<typeof ArcCoreMaterial>;
    shaftMaterial: import('@react-three/fiber').ThreeElement<typeof ShaftMaterial>;
  }
}
