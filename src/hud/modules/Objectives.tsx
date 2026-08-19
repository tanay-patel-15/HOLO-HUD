import { objectivesStore, useObjectives } from '@/hud/modules/objectives-store';

/**
 * View + toggle-complete for mission objectives. The list lives in
 * `objectives-store.ts` so Phase 4's `add objective` command can write it
 * without reaching into this component. Persistence key is still
 * `holo-hud:objectives`.
 */
export function Objectives() {
  const objectives = useObjectives();
  const completedCount = objectives.filter((o) => o.done).length;

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
          <button
            key={o.id}
            type="button"
            onClick={() => objectivesStore.getState().toggle(o.id)}
            className="flex items-center gap-2.5 text-left"
          >
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
