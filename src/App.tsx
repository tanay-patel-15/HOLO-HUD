import { useStartClock } from '@/core/clock';
import { Stage } from '@/core/stage';
import { Frame } from '@/hud/Frame';
import { Panel } from '@/hud/Panel';
import { EdgeTicks } from '@/hud/effects/EdgeTicks';
import { HexGrid } from '@/hud/effects/HexGrid';
import { Scanlines } from '@/hud/effects/Scanlines';
import { ArcGauge } from '@/hud/primitives/ArcGauge';
import { BarMeter } from '@/hud/primitives/BarMeter';
import { Readout } from '@/hud/primitives/Readout';
import { TickRing } from '@/hud/primitives/TickRing';
import { Ticker } from '@/hud/primitives/Ticker';
import { useTelemetry } from '@/telemetry/useTelemetry';

const DATA_FEED = [
  'SYS.CORE :: NOMINAL',
  'REACTOR :: STANDBY',
  'COMMS :: ENCRYPTED LINK ACTIVE',
  'DIAG :: NO FAULTS DETECTED',
  'NAV :: AWAITING TELEMETRY UPLINK',
];

/**
 * Phase 1: static HUD chrome, no telemetry wiring except the FPS readout
 * (kept from Phase 0 to prove the clock/telemetry pipeline still works
 * inside the real layout). Every other value here is a placeholder —
 * Phase 3 replaces them with live channels.
 */
export default function App() {
  useStartClock();

  return (
    <Stage>
      <div className="relative flex h-full w-full flex-col justify-between p-12">
        <Frame />
        <EdgeTicks position="top" />
        <EdgeTicks position="bottom" />
        <HexGrid />
        <Scanlines />

        <Panel title="SYSTEM STATUS" sweepDelay={0}>
          <div className="flex items-center justify-between gap-10">
            <Readout label="CALLSIGN" value="MARK-I" />
            <Readout label="DATE" value="2026.08.11" />
            <Readout label="UPTIME" value="T+ 04:12:33" />
            <LiveFpsReadout />
            <Readout label="LINK" value="STABLE" align="right" />
          </div>
        </Panel>

        <div className="flex flex-1 items-center justify-between gap-12 py-6">
          <div className="flex w-80 flex-col gap-6">
            <Panel title="VITALS" sweepDelay={1.2}>
              <div className="flex items-center justify-around">
                <ArcGauge value={72} label="O2 SAT" unit="%" size={128} />
                <ArcGauge value={58} label="HEART" unit="bpm" size={104} />
              </div>
            </Panel>
            <Panel title="POWER CORE" sweepDelay={2.4}>
              <div className="flex flex-col gap-3">
                <BarMeter value={86} label="OUTPUT" />
                <Readout label="RESERVE" value={86} unit="%" />
              </div>
            </Panel>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <TickRing size={540} faint spin />
          </div>

          <div className="flex w-80 flex-col gap-6">
            <Panel title="TELEMETRY" sweepDelay={0.6}>
              <div className="flex flex-col gap-2.5">
                <Readout label="LAT" value="40.7128 N" />
                <Readout label="LON" value="74.0060 W" />
                <Readout label="ALT" value={212} unit="m" />
              </div>
            </Panel>
            <Panel title="PROXIMITY" sweepDelay={1.8}>
              <div className="flex items-center gap-5">
                <TickRing size={96} majorCount={8} minorPerMajor={2} />
                <Readout label="CONTACTS" value="00" />
              </div>
            </Panel>
          </div>
        </div>

        <Panel title="DATA FEED" sweepDelay={3}>
          <Ticker items={DATA_FEED} />
        </Panel>
      </div>
    </Stage>
  );
}

function LiveFpsReadout() {
  const fps = useTelemetry('perf.fps');
  return <Readout label="FRAME" value={fps ?? '--'} unit="fps" />;
}
