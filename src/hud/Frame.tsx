const ARM = 48;

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
  return (
    <svg
      aria-hidden
      width={ARM}
      height={ARM}
      className={`pointer-events-none absolute z-40 ${position}`}
      style={{ transform: `rotate(${rotate}deg)` }}
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
