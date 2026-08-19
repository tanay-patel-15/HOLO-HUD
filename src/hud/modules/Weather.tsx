import { Readout } from '@/hud/primitives/Readout';
import { useTelemetry } from '@/telemetry/useTelemetry';

export function Weather() {
  const temp = useTelemetry('weather.temp');

  return <Readout label="TEMP" value={temp === undefined ? '--' : temp.toFixed(1)} unit="°C" />;
}
