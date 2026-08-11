interface ReadoutProps {
  label: string;
  value: string | number;
  unit?: string;
  align?: 'left' | 'right';
}

export function Readout({ label, value, unit, align = 'left' }: ReadoutProps) {
  return (
    <div
      className={`flex flex-col gap-0.5 ${align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
    >
      <span className="text-[10px] tracking-[0.25em] text-hud-text-dim">{label}</span>
      <span data-readout className="text-sm text-hud-text">
        {value}
        {unit && <span className="ml-1 text-xs text-hud-text-dim">{unit}</span>}
      </span>
    </div>
  );
}
