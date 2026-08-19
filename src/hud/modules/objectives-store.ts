import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';

export interface Objective {
  id: string;
  text: string;
  done: boolean;
}

export const STORAGE_KEY = 'holo-hud:objectives';

export const DEFAULT_OBJECTIVES: Objective[] = [
  { id: 'calibrate-reactor', text: 'CALIBRATE ARC REACTOR OUTPUT', done: true },
  { id: 'comms-uplink', text: 'ESTABLISH SECURE COMMS UPLINK', done: true },
  { id: 'diagnostic-sweep', text: 'RUN FULL DIAGNOSTIC SWEEP', done: false },
  { id: 'sync-telemetry', text: 'SYNC TELEMETRY FEED', done: false },
  { id: 'threat-review', text: 'REVIEW THREAT ASSESSMENT', done: false },
];

function loadObjectives(): Objective[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_OBJECTIVES;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Objective[]) : DEFAULT_OBJECTIVES;
  } catch {
    return DEFAULT_OBJECTIVES;
  }
}

function persist(objectives: Objective[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(objectives));
}

function slugId(text: string): string {
  const base = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'objective';
  return `${base}-${Date.now().toString(36)}`;
}

export interface ObjectivesState {
  objectives: Objective[];
  toggle: (id: string) => void;
  add: (text: string) => void;
}

export const objectivesStore = createStore<ObjectivesState>()(
  subscribeWithSelector((set) => ({
    objectives: loadObjectives(),
    toggle(id) {
      set((state) => {
        const objectives = state.objectives.map((o) => (o.id === id ? { ...o, done: !o.done } : o));
        persist(objectives);
        return { objectives };
      });
    },
    add(text) {
      const label = text.trim().toUpperCase();
      if (!label) return;
      set((state) => {
        const objectives = [...state.objectives, { id: slugId(label), text: label, done: false }];
        persist(objectives);
        return { objectives };
      });
    },
  })),
);

export function useObjectives(): Objective[] {
  return useStore(objectivesStore, (state) => state.objectives);
}
