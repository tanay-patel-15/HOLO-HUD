import { BarMeter } from '@/hud/primitives/BarMeter';
import { Readout } from '@/hud/primitives/Readout';
import { useTelemetry } from '@/telemetry/useTelemetry';

export function PowerCore() {
  const level = useTelemetry('power.level');
  const charging = useTelemetry('power.charging');

  return (
    <div className="flex flex-col gap-3">
      <BarMeter value={level ?? 0} label="OUTPUT" />
      <Readout label="STATUS" value={charging === undefined ? '--' : charging ? 'CHARGING' : 'ON BATTERY'} />
    </div>
  );
}
