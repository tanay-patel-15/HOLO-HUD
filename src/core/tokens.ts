/**
 * Reads the active palette out of the CSS custom properties defined in
 * styles/tokens.css, so WebGL shader uniforms (Phase 2+) and CSS stay
 * driven by one source of truth (CLAUDE.md #3).
 *
 * CSS is authoritative — this is a read, not a duplicate definition. Call
 * readTokens() once a palette is active in the DOM (after mount) and again
 * whenever the palette changes.
 */

export interface HudTokens {
  core: string;
  coreDim: string;
  coreBright: string;
  bg: string;
  bgDeep: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  warn: string;
  danger: string;
  ok: string;
}

const TOKEN_VARS = {
  core: '--hud-core',
  coreDim: '--hud-core-dim',
  coreBright: '--hud-core-bright',
  bg: '--hud-bg',
  bgDeep: '--hud-bg-deep',
  surface: '--hud-surface',
  surfaceRaised: '--hud-surface-raised',
  text: '--hud-text',
  warn: '--hud-warn',
  danger: '--hud-danger',
  ok: '--hud-ok',
} as const satisfies Record<keyof HudTokens, string>;

export function readTokens(root: HTMLElement = document.documentElement): HudTokens {
  const style = getComputedStyle(root);
  const read = (key: keyof HudTokens) => style.getPropertyValue(TOKEN_VARS[key]).trim();

  return {
    core: read('core'),
    coreDim: read('coreDim'),
    coreBright: read('coreBright'),
    bg: read('bg'),
    bgDeep: read('bgDeep'),
    surface: read('surface'),
    surfaceRaised: read('surfaceRaised'),
    text: read('text'),
    warn: read('warn'),
    danger: read('danger'),
    ok: read('ok'),
  };
}
