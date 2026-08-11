interface TickerProps {
  items: string[];
}

/**
 * Two identical copies of the content side by side, animated from 0% to
 * -50% translateX — the loop point lands exactly on the seam between the
 * copies, so it reads as continuous rather than resetting.
 */
export function Ticker({ items }: TickerProps) {
  const content = items.join('   //   ');

  return (
    <div className="relative w-full overflow-hidden">
      <div className="animate-hud-ticker flex w-max whitespace-nowrap">
        <span data-readout className="pr-8 text-xs text-hud-text-dim">
          {content}
        </span>
        <span data-readout aria-hidden className="pr-8 text-xs text-hud-text-dim">
          {content}
        </span>
      </div>
    </div>
  );
}
