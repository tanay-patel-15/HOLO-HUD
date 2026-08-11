interface TickRingProps {
  size?: number;
  majorCount?: number;
  minorPerMajor?: number;
  /** Large, dim, unlabeled — used as the Phase 2 reactor's placeholder mark. */
  faint?: boolean;
  spin?: boolean;
  label?: string;
  sublabel?: string;
}

export function TickRing({
  size = 200,
  majorCount = 12,
  minorPerMajor = 3,
  faint = false,
  spin = false,
  label,
  sublabel,
}: TickRingProps) {
  const center = size / 2;
  const outerR = size / 2 - 2;
  const totalTicks = majorCount * minorPerMajor;

  const ticks = Array.from({ length: totalTicks }, (_, i) => {
    const isMajor = i % minorPerMajor === 0;
    const angle = (i / totalTicks) * 360;
    const rad = (angle * Math.PI) / 180;
    const len = isMajor ? outerR * 0.12 : outerR * 0.06;
    const x1 = center + outerR * Math.sin(rad);
    const y1 = center - outerR * Math.cos(rad);
    const x2 = center + (outerR - len) * Math.sin(rad);
    const y2 = center - (outerR - len) * Math.cos(rad);
    return { x1, y1, x2, y2, isMajor, key: i };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className={spin ? 'animate-hud-slow-spin' : undefined}
        style={{ transformOrigin: '50% 50%' }}
      >
        <circle
          cx={center}
          cy={center}
          r={outerR}
          fill="none"
          strokeWidth={1}
          className={faint ? 'stroke-hud-border' : 'stroke-hud-border-bright'}
        />
        {ticks.map((t) => (
          <line
            key={t.key}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            strokeWidth={t.isMajor ? 1.5 : 1}
            className={faint ? 'stroke-hud-text-faint' : t.isMajor ? 'stroke-hud-core' : 'stroke-hud-border-bright'}
          />
        ))}
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          {label && <span className="text-xs tracking-[0.2em] text-hud-text-dim">{label}</span>}
          {sublabel && (
            <span data-readout className="text-lg text-hud-text">
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
