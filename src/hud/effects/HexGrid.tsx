const HEX_R = 34; // circumradius
const HEX_W = Math.sqrt(3) * HEX_R;
const HEX_H = 2 * HEX_R;
const TILE_W = HEX_W * 1.15;
const TILE_H = HEX_H;

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
}

const HEX_PATTERN_POINTS = hexPoints(TILE_W / 2, TILE_H / 2, HEX_R);

/**
 * Evenly spaced (not honeycomb-tessellated — the gap between hexagons
 * is intentional, kept simple since this only needs to read as texture
 * at ~5% opacity, not survive close inspection).
 */
export function HexGrid() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]">
      <defs>
        <pattern id="hud-hex" width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
          <polygon
            points={HEX_PATTERN_POINTS}
            fill="none"
            strokeWidth={1}
            className="stroke-hud-core"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hud-hex)" />
    </svg>
  );
}
