interface ArcGaugeProps {
  value: number; // 0-100
  label: string;
  size?: number;
  unit?: string;
}

const STROKE_WIDTH = 6;

export function ArcGauge({ value, label, size = 120, unit }: ArcGaugeProps) {
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            className="stroke-hud-surface-raised"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="stroke-hud-core transition-[stroke-dashoffset] duration-700 ease-out"
            style={{ filter: 'drop-shadow(var(--hud-glow-sm))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span data-readout className="text-2xl text-hud-text">
            {Math.round(value)}
            {unit && <span className="text-xs text-hud-text-dim">{unit}</span>}
          </span>
        </div>
      </div>
      <span className="text-[10px] tracking-[0.25em] text-hud-text-dim">{label}</span>
    </div>
  );
}
