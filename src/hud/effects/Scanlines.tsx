/**
 * Static CRT scanline texture. Deliberately not animated — the per-panel
 * scan sweep (Panel.tsx) and any full-stage sweep (Phase 6 idle
 * animation) are the moving elements; layering motion here too would
 * compete with them rather than read as one coherent effect.
 */
export function Scanlines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-50 opacity-[0.06]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(to bottom, var(--hud-core) 0px, var(--hud-core) 1px, transparent 1px, transparent 3px)',
      }}
    />
  );
}
