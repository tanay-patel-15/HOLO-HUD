import { Stage } from '@/core/stage';
import { useStartClock } from '@/core/clock';
import { useTelemetry } from '@/telemetry/useTelemetry';

/**
 * Phase 0 gate: a black 16:9 box that scales correctly on resize, one
 * live readout ticking at 60fps off a real telemetry channel, and the
 * reject screen below the minimum viewport. Everything here gets replaced
 * by real HUD chrome in Phase 1 — this is scaffolding, not design.
 */
export default function App() {
  useStartClock();

  return (
    <Stage>
      <div className="flex h-full w-full items-center justify-center">
        <FpsReadout />
      </div>
    </Stage>
  );
}

function FpsReadout() {
  const fps = useTelemetry('perf.fps');

  return (
    <div className="flex flex-col items-center gap-2 text-hud-core">
      <span className="text-xs tracking-[0.3em] text-hud-text-dim">SYSTEM FRAMERATE</span>
      <span data-readout className="text-6xl" style={{ textShadow: 'var(--hud-glow-md)' }}>
        {fps ?? '--'}
      </span>
    </div>
  );
}
