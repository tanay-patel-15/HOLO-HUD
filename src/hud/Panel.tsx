import type { ReactNode } from 'react';
import { useParallax } from '@/hud/useParallax';

interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  /** Staggers the scan sweep so panels don't all animate in lockstep. */
  sweepDelay?: number;
  /** How far off the screen plane this panel feels — see useParallax. */
  depth?: number;
}

const CHAMFER = 14;

/**
 * The signature chrome: clip-path-cut corners instead of border-radius.
 * Angular reads as targeting/instrument-panel; rounded reads as generic
 * dashboard card — this is the one deliberate risk Phase 1 takes (see
 * PROGRESS.md). Bound to the shared camera via useParallax so it drifts in
 * sync with the WebGL scene behind it (ROADMAP's "DOM owns every glyph"
 * architecture, wired up in Phase 2).
 */
export function Panel({ title, children, className = '', sweepDelay = 0, depth = 1 }: PanelProps) {
  const parallaxRef = useParallax<HTMLDivElement>(depth);

  return (
    <div
      ref={parallaxRef}
      className={`relative border border-hud-border bg-hud-surface/70 ${className}`}
      style={{
        clipPath: `polygon(${CHAMFER}px 0, 100% 0, 100% calc(100% - ${CHAMFER}px), calc(100% - ${CHAMFER}px) 100%, 0 100%, 0 ${CHAMFER}px)`,
        willChange: 'transform',
      }}
    >
      {/* corner tick brackets on the two uncut (sharp) corners */}
      <span className="pointer-events-none absolute -top-[3px] -right-[3px] h-3.5 w-3.5 border-t border-r border-hud-core-bright" />
      <span className="pointer-events-none absolute -bottom-[3px] -left-[3px] h-3.5 w-3.5 border-b border-l border-hud-core-bright" />

      <div
        aria-hidden
        className="animate-hud-scan-sweep pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-hud-core/20 to-transparent"
        style={{ animationDelay: `${sweepDelay}s` }}
      />

      <div className="relative flex flex-col gap-3 px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-hud-display text-[11px] font-medium tracking-[0.3em] text-hud-text-dim">
            {title}
          </h3>
          <div className="h-px w-full bg-hud-border" />
        </div>
        {children}
      </div>
    </div>
  );
}
