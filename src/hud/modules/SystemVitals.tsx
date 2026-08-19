import { ArcGauge } from '@/hud/primitives/ArcGauge';
import { useTelemetry } from '@/telemetry/useTelemetry';

/**
 * Heap usage has no natural browser-given ceiling, so it's normalized
 * against a fixed nominal max purely for the gauge's 0–100 display range —
 * not a claim about how much memory is actually available.
 */
const HEAP_CEILING_MB = 300;
const JANK_PENALTY_PER_FRAME = 12;

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function SystemVitals() {
  const heapMb = useTelemetry('sys.heap');
  const jank = useTelemetry('perf.jank');

  const memPct = heapMb === undefined ? 0 : clamp((heapMb / HEAP_CEILING_MB) * 100);
  const stability = jank === undefined ? 100 : clamp(100 - jank * JANK_PENALTY_PER_FRAME);

  return (
    <div className="flex items-center justify-around">
      <ArcGauge value={memPct} label="MEM" unit="%" size={128} />
      <ArcGauge value={stability} label="STABLE" unit="%" size={104} />
    </div>
  );
}
