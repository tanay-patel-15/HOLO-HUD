import { Readout } from '@/hud/primitives/Readout';
import { TickRing } from '@/hud/primitives/TickRing';

/**
 * No real "contacts" data source exists (ROADMAP's radar module still has
 * this as an open question — geo + weather + synthetic contacts is the
 * current plan, not yet built). A static "00" here is a legitimate empty
 * scan result, not a placeholder standing in for missing telemetry.
 */
export function Radar() {
  return (
    <div className="flex items-center gap-5">
      <TickRing size={96} majorCount={8} minorPerMajor={2} />
      <Readout label="CONTACTS" value="00" />
    </div>
  );
}
