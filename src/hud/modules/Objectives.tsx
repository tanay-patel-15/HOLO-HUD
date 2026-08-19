import { useEffect, useState } from 'react';

interface Objective {
  id: string;
  text: string;
  done: boolean;
}

const STORAGE_KEY = 'holo-hud:objectives';

const DEFAULT_OBJECTIVES: Objective[] = [
  { id: 'calibrate-reactor', text: 'CALIBRATE ARC REACTOR OUTPUT', done: true },
  { id: 'comms-uplink', text: 'ESTABLISH SECURE COMMS UPLINK', done: true },
  { id: 'diagnostic-sweep', text: 'RUN FULL DIAGNOSTIC SWEEP', done: false },
  { id: 'sync-telemetry', text: 'SYNC TELEMETRY FEED', done: false },
  { id: 'threat-review', text: 'REVIEW THREAT ASSESSMENT', done: false },
];

/**
 * Not a telemetry channel — ROADMAP lists mission objectives separately
 * from the channel table, and localStorage is the sanctioned persistence
 * mechanism (see ROADMAP's scope: "persistence beyond localStorage" is
 * explicitly out of scope, implying localStorage itself is in). Adding new
 * objectives is Phase 4 scope (the command bar's "add objective" command)
 * — this is view + toggle-complete only.
 */
function loadObjectives(): Objective[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_OBJECTIVES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_OBJECTIVES;
  } catch {
    return DEFAULT_OBJECTIVES;
  }
}

export function Objectives() {
  const [objectives, setObjectives] = useState<Objective[]>(loadObjectives);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(objectives));
  }, [objectives]);

  const completedCount = objectives.filter((o) => o.done).length;

  function toggle(id: string) {
    setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, done: !o.done } : o)));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[0.25em] text-hud-text-dim">STATUS</span>
        <span data-readout className="text-xs text-hud-text-dim">
          {completedCount}/{objectives.length} COMPLETE
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {objectives.map((o) => (
          <button key={o.id} type="button" onClick={() => toggle(o.id)} className="flex items-center gap-2.5 text-left">
            <span
              className={`h-3 w-3 shrink-0 border ${o.done ? 'border-hud-core bg-hud-core' : 'border-hud-border bg-transparent'}`}
              style={o.done ? { boxShadow: 'var(--hud-glow-sm)' } : undefined}
            />
            <span className={`text-xs tracking-wide ${o.done ? 'text-hud-text-dim line-through' : 'text-hud-text'}`}>
              {o.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
