interface BarMeterProps {
  value: number; // 0-100
  segments?: number;
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

export function BarMeter({ value, segments = 14, orientation = 'horizontal', label }: BarMeterProps) {
  const lit = Math.round((Math.min(100, Math.max(0, value)) / 100) * segments);
  const isVertical = orientation === 'vertical';

  return (
    <div className={`flex flex-col gap-1.5 ${isVertical ? 'items-center' : ''}`}>
      <div className={`flex gap-[3px] ${isVertical ? 'h-24 w-3 flex-col-reverse' : 'h-3 w-full flex-row'}`}>
        {Array.from({ length: segments }, (_, i) => {
          const active = i < lit;
          return (
            <div
              key={i}
              className={`flex-1 rounded-[1px] ${active ? 'bg-hud-core' : 'bg-hud-surface-raised'}`}
              style={active ? { boxShadow: 'var(--hud-glow-sm)' } : undefined}
            />
          );
        })}
      </div>
      {label && <span className="text-[10px] tracking-[0.25em] text-hud-text-dim">{label}</span>}
    </div>
  );
}
