interface EdgeTicksProps {
  position: 'top' | 'bottom';
}

const TICK_COUNT = 46;

/**
 * Fills the band between the two corner brackets with detail instead of
 * leaving it empty — turns an accidental gap into a composed one.
 */
export function EdgeTicks({ position }: EdgeTicksProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-24 z-30 flex items-center justify-between opacity-40 ${
        position === 'top' ? 'top-7' : 'bottom-7'
      }`}
    >
      {Array.from({ length: TICK_COUNT }, (_, i) => (
        <span key={i} className={`w-px bg-hud-border-bright ${i % 5 === 0 ? 'h-2.5' : 'h-1'}`} />
      ))}
    </div>
  );
}
