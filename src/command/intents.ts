import { threatOverrideStore } from '@/command/threat-override';
import type { Intent } from '@/command/parser';
import { objectivesStore } from '@/hud/modules/objectives-store';
import { peekChannel } from '@/telemetry/registry';

export interface HandlerResult {
  log: string;
}

function fmt(value: string | number | undefined): string {
  if (value === undefined) return '--';
  return String(value);
}

function formatDiagnostics(): string {
  const override = threatOverrideStore.getState().level;
  const threat = override ?? peekChannel('threat.level');
  const lat = peekChannel('geo.lat');
  const lon = peekChannel('geo.lon');
  const nav =
    lat === undefined || lon === undefined
      ? '--'
      : `${Math.abs(lat).toFixed(2)}${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(2)}${lon >= 0 ? 'E' : 'W'}`;

  return [
    'SYSTEMS DIAGNOSTIC',
    `FRAME  ${fmt(peekChannel('perf.fps'))} fps   JANK  ${fmt(peekChannel('perf.jank'))}`,
    `GPU    ${fmt(peekChannel('sys.gpu'))}`,
    `CORES  ${fmt(peekChannel('sys.cores'))}    HEAP  ${fmt(peekChannel('sys.heap'))} MB`,
    `POWER  ${fmt(peekChannel('power.level'))}%  LINK  ${fmt(peekChannel('net.type'))}`,
    `NAV    ${nav}`,
    `WX     ${fmt(peekChannel('weather.temp'))}C ${fmt(peekChannel('weather.condition'))}`,
    `THREAT ${fmt(threat)}`,
  ].join('\n');
}

export function handleIntent(intent: Intent): HandlerResult {
  switch (intent.type) {
    case 'diagnostics':
      return { log: formatDiagnostics() };
    case 'add_objective': {
      const text = intent.text.trim();
      if (!text) return { log: 'Add what, sir.' };
      objectivesStore.getState().add(text);
      return { log: `Objective added: ${text.toUpperCase()}.` };
    }
    case 'set_threat': {
      if (intent.level === null) {
        return { log: 'Specify NOMINAL, ELEVATED, or CRITICAL, sir.' };
      }
      threatOverrideStore.getState().set(intent.level);
      return { log: `Threat set to ${intent.level}.` };
    }
    case 'reset_threat':
      threatOverrideStore.getState().clear();
      return { log: 'Threat override cleared.' };
    case 'swap_palette':
      return { log: 'Palette protocols offline, sir. Phase six.' };
    case 'navigate':
      return { log: 'Single-viewport lock engaged, sir. Nowhere to navigate.' };
    case 'easter_sudo':
      return { log: 'Nice try, sir.' };
    case 'easter_iron_man':
      return { log: 'Not yet, sir. Boot sequence is still on the bench.' };
  }
}
