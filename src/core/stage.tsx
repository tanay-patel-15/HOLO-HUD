import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * The HUD is designed at a single fixed resolution and scaled as a unit —
 * never reflowed — to fit whatever window it's opened in (ROADMAP.md,
 * "End state": fixed-aspect canvas). Below MIN_VIEWPORT_*, we don't attempt
 * a responsive layout at all; we show an in-universe reject screen instead.
 */
export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

const MIN_VIEWPORT_WIDTH = 1024;
const MIN_VIEWPORT_HEIGHT = 600;

interface StageMetrics {
  scale: number;
  fits: boolean;
}

function computeMetrics(width: number, height: number): StageMetrics {
  return {
    scale: Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT),
    fits: width >= MIN_VIEWPORT_WIDTH && height >= MIN_VIEWPORT_HEIGHT,
  };
}

function useStageMetrics(containerRef: React.RefObject<HTMLDivElement | null>): StageMetrics {
  const [metrics, setMetrics] = useState<StageMetrics>(() =>
    computeMetrics(window.innerWidth, window.innerHeight),
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setMetrics(computeMetrics(width, height));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [containerRef]);

  return metrics;
}

export function Stage({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scale, fits } = useStageMetrics(containerRef);

  return (
    <div ref={containerRef} className="fixed inset-0 flex items-center justify-center bg-black">
      {fits ? (
        <div
          data-hud-stage
          className="relative shrink-0 overflow-hidden bg-hud-bg-deep"
          style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      ) : (
        <MobileReject />
      )}
    </div>
  );
}

function MobileReject() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-hud-bg-deep px-8 text-center font-hud-mono text-hud-core">
      <div className="h-px w-32 bg-hud-core/60" />
      <p className="text-sm tracking-[0.3em] text-hud-text-dim">TERMINAL CLASS INSUFFICIENT</p>
      <p className="text-lg tracking-[0.15em]">DESKTOP INTERFACE REQUIRED</p>
      <p className="max-w-xs text-xs text-hud-text-faint">
        This unit requires a display no smaller than {MIN_VIEWPORT_WIDTH}&times;
        {MIN_VIEWPORT_HEIGHT}. Reconnect from a compatible terminal.
      </p>
      <div className="h-px w-32 bg-hud-core/60" />
    </div>
  );
}
