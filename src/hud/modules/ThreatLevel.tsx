import { Readout } from '@/hud/primitives/Readout';
import { useTelemetry } from '@/telemetry/useTelemetry';
import type { ChannelMap } from '@/telemetry/types';

const LEVEL_CLASS: Record<ChannelMap['threat.level'], string> = {
  NOMINAL: 'text-hud-ok',
  ELEVATED: 'text-hud-warn',
  CRITICAL: 'text-hud-danger',
};

export function ThreatLevel() {
  const level = useTelemetry('threat.level');

  return <Readout label="THREAT" value={level ?? '--'} valueClassName={level ? LEVEL_CLASS[level] : undefined} />;
}
