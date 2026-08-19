import { Readout } from '@/hud/primitives/Readout';
import { useTelemetry } from '@/telemetry/useTelemetry';

function formatCoord(value: number | undefined, positiveSuffix: string, negativeSuffix: string): string {
  if (value === undefined) return '--';
  return `${Math.abs(value).toFixed(4)} ${value >= 0 ? positiveSuffix : negativeSuffix}`;
}

export function Telemetry() {
  const lat = useTelemetry('geo.lat');
  const lon = useTelemetry('geo.lon');

  return (
    <>
      <Readout label="LAT" value={formatCoord(lat, 'N', 'S')} />
      <Readout label="LON" value={formatCoord(lon, 'E', 'W')} />
    </>
  );
}
