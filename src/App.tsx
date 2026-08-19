import { useClock, useStartClock } from '@/core/clock';
import { Stage } from '@/core/stage';
import { Frame } from '@/hud/Frame';
import { Panel } from '@/hud/Panel';
import { EdgeTicks } from '@/hud/effects/EdgeTicks';
import { HexGrid } from '@/hud/effects/HexGrid';
import { Scanlines } from '@/hud/effects/Scanlines';
import { Readout } from '@/hud/primitives/Readout';
import { DataFeed } from '@/hud/modules/DataFeed';
import { PowerCore } from '@/hud/modules/PowerCore';
import { Radar } from '@/hud/modules/Radar';
import { SystemVitals } from '@/hud/modules/SystemVitals';
import { Telemetry } from '@/hud/modules/Telemetry';
import { ThreatLevel } from '@/hud/modules/ThreatLevel';
import { Weather } from '@/hud/modules/Weather';
import { SceneCanvas } from '@/scene/Scene';
import { useTelemetry } from '@/telemetry/useTelemetry';

/**
 * Phase 3: every panel now reads a live telemetry channel via
 * `hud/modules/` instead of Phase 1's hardcoded placeholder values —
 * CALLSIGN stays a static identity label (there's no sensor for a
 * callsign), everything else in SYSTEM STATUS and every panel below it is
 * real (or, absent a real API, the registry's simulated fallback —
 * CLAUDE.md #4, the component never knows which).
 */
export default function App() {
  useStartClock();

  return (
    <Stage>
      <SceneCanvas />
      <div className="relative z-10 flex h-full w-full flex-col justify-between p-12">
        <Frame />
        <EdgeTicks position="top" />
        <EdgeTicks position="bottom" />
        <HexGrid />
        <Scanlines />

        <Panel title="SYSTEM STATUS" sweepDelay={0} depth={0.7}>
          <div className="flex items-center justify-between gap-10">
            <Readout label="CALLSIGN" value="MARK-I" />
            <LiveUptimeReadout />
            <LiveFpsReadout />
            <LiveLinkReadout />
          </div>
        </Panel>

        <div className="flex flex-1 items-center justify-between gap-12 py-6">
          <div className="flex w-80 flex-col gap-6">
            <Panel title="VITALS" sweepDelay={1.2} depth={1.4}>
              <SystemVitals />
            </Panel>
            <Panel title="POWER CORE" sweepDelay={2.4} depth={1.4}>
              <PowerCore />
            </Panel>
          </div>

          {/* Deliberately empty — the arc reactor renders here in WebGL,
              behind this transparent gap, framed by the panels around it. */}
          <div className="flex-1" />

          <div className="flex w-80 flex-col gap-6">
            <Panel title="TELEMETRY" sweepDelay={0.6} depth={1.4}>
              <div className="flex flex-col gap-2.5">
                <Telemetry />
                <Weather />
              </div>
            </Panel>
            <Panel title="PROXIMITY" sweepDelay={1.8} depth={1.4}>
              <div className="flex flex-col gap-3">
                <Radar />
                <ThreatLevel />
              </div>
            </Panel>
          </div>
        </div>

        <Panel title="DATA FEED" sweepDelay={3} depth={0.7}>
          <DataFeed />
        </Panel>
      </div>
    </Stage>
  );
}

function LiveFpsReadout() {
  const fps = useTelemetry('perf.fps');
  return <Readout label="FRAME" value={fps ?? '--'} unit="fps" />;
}

function LiveLinkReadout() {
  const netType = useTelemetry('net.type');
  return <Readout label="LINK" value={netType?.toUpperCase() ?? '--'} align="right" />;
}

function formatUptime(elapsedSeconds: number): string {
  const total = Math.floor(elapsedSeconds);
  const hh = String(Math.floor(total / 3600)).padStart(2, '0');
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `T+ ${hh}:${mm}:${ss}`;
}

function LiveUptimeReadout() {
  const elapsed = useClock((state) => Math.floor(state.elapsed));
  return <Readout label="UPTIME" value={formatUptime(elapsed)} />;
}
