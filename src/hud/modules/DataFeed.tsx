import { Ticker } from '@/hud/primitives/Ticker';
import { useTelemetry } from '@/telemetry/useTelemetry';

const STATIC_LINES = ['SYS.CORE :: NOMINAL', 'REACTOR :: STANDBY', 'COMMS :: ENCRYPTED LINK ACTIVE', 'DIAG :: NO FAULTS DETECTED'];

export function DataFeed() {
  const gpu = useTelemetry('sys.gpu');
  const cores = useTelemetry('sys.cores');
  const netType = useTelemetry('net.type');
  const downlink = useTelemetry('net.downlink');
  const weatherCondition = useTelemetry('weather.condition');
  const weatherTemp = useTelemetry('weather.temp');
  const lat = useTelemetry('geo.lat');
  const lon = useTelemetry('geo.lon');

  const lines = [...STATIC_LINES];

  if (gpu !== undefined && cores !== undefined) {
    lines.push(`SYS :: ${gpu.slice(0, 40)} / ${cores} CORES`);
  }
  if (netType !== undefined && downlink !== undefined) {
    lines.push(`NET :: ${netType.toUpperCase()} ${downlink.toFixed(1)}MBPS`);
  }
  if (weatherCondition !== undefined && weatherTemp !== undefined) {
    lines.push(`WEATHER :: ${weatherCondition} ${weatherTemp.toFixed(1)}°C`);
  }
  lines.push(
    lat !== undefined && lon !== undefined
      ? `NAV :: ${Math.abs(lat).toFixed(2)}${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(2)}${lon >= 0 ? 'E' : 'W'}`
      : 'NAV :: AWAITING TELEMETRY UPLINK',
  );

  return <Ticker items={lines} />;
}
