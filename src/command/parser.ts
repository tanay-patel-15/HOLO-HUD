import type { ChannelMap } from '@/telemetry/types';

export type ThreatLevel = ChannelMap['threat.level'];

export type Intent =
  | { type: 'diagnostics' }
  | { type: 'add_objective'; text: string }
  | { type: 'set_threat'; level: ThreatLevel | null }
  | { type: 'reset_threat' }
  | { type: 'swap_palette' }
  | { type: 'navigate'; target?: string }
  | { type: 'easter_sudo' }
  | { type: 'easter_iron_man' };

export const AUTOCOMPLETE_HINTS = [
  'run diagnostics',
  'add objective ',
  'set threat ',
  'reset threat',
  'swap palette',
  'navigate',
] as const;

const JARVIS_PREFIX = /^jarvis,?\s+/;
const ADD_OBJECTIVE = /^add objective:?\s*(.*)$/;
const SET_THREAT = /^set threat(?:\s+level)?(?:\s+to)?(?:\s+(.*))?$/;
const NAVIGATE = /^navigate(?:\s+(.*))?$/;

function parseThreatLevel(raw: string | undefined): ThreatLevel | null {
  if (!raw) return null;
  const token = raw.trim().toUpperCase();
  if (token === 'NOMINAL' || token === 'ELEVATED' || token === 'CRITICAL') return token;
  return null;
}

/**
 * Pure string → intent. Does not know about React, the mic, or TTS.
 * Optional `JARVIS,` / `jarvis` prefix is flavor, stripped before matching.
 */
export function parse(text: string): Intent | null {
  let s = text.trim().toLowerCase();
  s = s.replace(JARVIS_PREFIX, '');
  if (!s) return null;

  if (s === 'sudo') return { type: 'easter_sudo' };
  if (s === 'i am iron man') return { type: 'easter_iron_man' };

  if (s === 'reset threat' || s === 'clear threat') return { type: 'reset_threat' };

  if (s === 'run diagnostics' || s === 'diagnostics' || s === 'run diagnostic') {
    return { type: 'diagnostics' };
  }

  const add = s.match(ADD_OBJECTIVE);
  if (add) return { type: 'add_objective', text: (add[1] ?? '').trim() };

  const threat = s.match(SET_THREAT);
  if (threat) return { type: 'set_threat', level: parseThreatLevel(threat[1]) };

  if (s === 'swap palette' || s === 'change palette' || s === 'switch palette') {
    return { type: 'swap_palette' };
  }

  const nav = s.match(NAVIGATE);
  if (nav) {
    const target = (nav[1] ?? '').trim();
    return target ? { type: 'navigate', target } : { type: 'navigate' };
  }

  return null;
}

export function ghostHint(draft: string): string {
  const lower = draft.toLowerCase();
  if (!lower) return '';
  const match = AUTOCOMPLETE_HINTS.find((hint) => hint.startsWith(lower) && hint.length > lower.length);
  return match ? match.slice(draft.length) : '';
}
