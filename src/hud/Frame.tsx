import { useEffect, useRef } from 'react';
import { cameraStore, getParallaxTransform } from '@/core/camera-store';

const ARM = 48;
/** The outermost frame drifts least — it's the "closest to the glass" layer. */
const FRAME_DEPTH = 0.35;

const CORNERS = [
  { position: 'top-6 left-6', rotate: 0 },
  { position: 'top-6 right-6', rotate: 90 },
  { position: 'bottom-6 right-6', rotate: 180 },
  { position: 'bottom-6 left-6', rotate: 270 },
];

/** The outer viewfinder frame — four corner brackets spanning the stage. */
export function Frame() {
  return (
    <>
      {CORNERS.map(({ position, rotate }) => (
        <CornerBracket key={rotate} position={position} rotate={rotate} />
      ))}
    </>
  );
}

function CornerBracket({ position, rotate }: { position: string; rotate: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Each bracket needs its own static per-corner rotation composed with the
  // shared camera-driven parallax offset, so this reads camera-store
  // directly (core/camera-store.ts) instead of the plain useParallax hook,
  // which only ever writes a bare transform.
  useEffect(() => {
    const node = svgRef.current;
    if (!node) return;
    const apply = () => {
      node.style.transform = `rotate(${rotate}deg) ${getParallaxTransform(FRAME_DEPTH)}`;
    };
    apply();
    return cameraStore.subscribe((s) => s.rotation, apply);
  }, [rotate]);

  return (
    <svg
      ref={svgRef}
      aria-hidden
      width={ARM}
      height={ARM}
      className={`pointer-events-none absolute z-40 ${position}`}
    >
      <path
        d={`M ${ARM} 14 L 14 14 L 14 ${ARM}`}
        fill="none"
        strokeWidth={2}
        className="stroke-hud-core"
        style={{ filter: 'drop-shadow(var(--hud-glow-sm))' }}
      />
    </svg>
  );
}
