import Phaser from 'phaser';

export type RocketSkinAppearanceId =
  | 'classic'
  | 'crimson'
  | 'emerald'
  | 'solar'
  | 'violet'
  | 'arctic'
  | 'neon'
  | 'amber'
  | 'sapphire'
  | 'obsidian'
  | 'electricRainbow';

export const RAINBOW_CYCLE_COLORS = [
  0xff2244,
  0xff8800,
  0xffee00,
  0x44ff66,
  0x00eeff,
  0x4488ff,
  0xaa44ff,
  0xff66cc,
] as const;

/** @deprecated Use RAINBOW_CYCLE_COLORS */
export const RAINBOW_EXHAUST_COLORS = RAINBOW_CYCLE_COLORS;

export const RAINBOW_CYCLE_MS = 2400;

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

export function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  return (
    (lerpChannel(ar, br, t) << 16)
    | (lerpChannel(ag, bg, t) << 8)
    | lerpChannel(ab, bb, t)
  );
}

function shadeColor(hex: number, factor: number): number {
  const r = Math.min(255, Math.round(((hex >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.round(((hex >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.round((hex & 0xff) * factor));
  return (r << 16) | (g << 8) | b;
}

function brightenColor(hex: number, factor: number): number {
  const r = Math.min(255, Math.round(((hex >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.round(((hex >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.round((hex & 0xff) * factor));
  return (r << 16) | (g << 8) | b;
}

export function getRainbowCyclePhase(timeMs: number): number {
  const len = RAINBOW_CYCLE_COLORS.length;
  return ((timeMs % RAINBOW_CYCLE_MS) / RAINBOW_CYCLE_MS) * len;
}

export function sampleRainbowColor(phase: number): number {
  const len = RAINBOW_CYCLE_COLORS.length;
  const wrapped = ((phase % len) + len) % len;
  const i0 = Math.floor(wrapped) % len;
  const i1 = (i0 + 1) % len;
  const frac = wrapped - Math.floor(wrapped);
  return lerpColor(RAINBOW_CYCLE_COLORS[i0], RAINBOW_CYCLE_COLORS[i1], frac);
}

export interface RocketSkinPalette {
  hull: number;
  accent: number;
  exhaustPrimary: number;
  exhaustSecondary: number;
  outline?: number;
  exhaustRainbow?: readonly number[];
}

const PALETTES: Record<RocketSkinAppearanceId, RocketSkinPalette> = {
  classic: {
    hull: 0x1a1f3a,
    accent: 0x00d4ff,
    exhaustPrimary: 0xff6b35,
    exhaustSecondary: 0xffcc00,
  },
  crimson: {
    hull: 0x3a1018,
    accent: 0xff4466,
    exhaustPrimary: 0xff6b35,
    exhaustSecondary: 0xffcc00,
  },
  emerald: {
    hull: 0x0f2a1a,
    accent: 0x33dd77,
    exhaustPrimary: 0x22aa55,
    exhaustSecondary: 0x88ffaa,
  },
  solar: {
    hull: 0x2a2208,
    accent: 0xffcc00,
    exhaustPrimary: 0xff9900,
    exhaustSecondary: 0xffee66,
  },
  violet: {
    hull: 0x1a1030,
    accent: 0xaa66ff,
    exhaustPrimary: 0x8844cc,
    exhaustSecondary: 0xdd99ff,
  },
  arctic: {
    hull: 0x1a2838,
    accent: 0xaaddff,
    exhaustPrimary: 0x66bbee,
    exhaustSecondary: 0xeeffff,
  },
  neon: {
    hull: 0x18082a,
    accent: 0xff44cc,
    exhaustPrimary: 0x00ffcc,
    exhaustSecondary: 0xff66dd,
  },
  amber: {
    hull: 0xff7700,
    accent: 0xffaa33,
    exhaustPrimary: 0x9933ff,
    exhaustSecondary: 0xcc66ff,
  },
  sapphire: {
    hull: 0x0a2060,
    accent: 0x2266cc,
    exhaustPrimary: 0x66ccff,
    exhaustSecondary: 0xffcc44,
  },
  obsidian: {
    hull: 0x0a0a0a,
    accent: 0x222222,
    exhaustPrimary: 0x22cc44,
    exhaustSecondary: 0x66ff88,
    outline: 0xffffff,
  },
  electricRainbow: {
    hull: 0x120818,
    accent: 0xff66cc,
    exhaustPrimary: 0xff2244,
    exhaustSecondary: 0xffee00,
    exhaustRainbow: RAINBOW_EXHAUST_COLORS,
  },
};

export function getRocketSkinPalette(appearanceId: RocketSkinAppearanceId): RocketSkinPalette {
  return PALETTES[appearanceId];
}

export function getThrusterTints(appearanceId: RocketSkinAppearanceId): number[] {
  const p = getRocketSkinPalette(appearanceId);
  if (p.exhaustRainbow) {
    return [...p.exhaustRainbow];
  }
  return [p.exhaustPrimary, p.exhaustSecondary, p.exhaustPrimary];
}

/** Generated player rocket texture size (see BootScene). */
export const ROCKET_TEXTURE_WIDTH = 32;
export const ROCKET_TEXTURE_HEIGHT = 52;

/** Engine nozzle center in texture space. */
export const ROCKET_ENGINE_X = ROCKET_TEXTURE_WIDTH / 2;
export const ROCKET_ENGINE_Y = 52;

/** Offset from sprite origin (center) to engine nozzle in pixels. */
export const ROCKET_ENGINE_OFFSET_Y = ROCKET_ENGINE_Y - ROCKET_TEXTURE_HEIGHT / 2;

export function drawElectricRainbowRocket(
  g: Phaser.GameObjects.Graphics,
  bodyColor: number,
  engineColor: number,
  originX = 0,
  originY = 0,
): void {
  const hull = shadeColor(bodyColor, 0.38);
  const accent = bodyColor;
  const exhaustPrimary = engineColor;
  const exhaustSecondary = brightenColor(engineColor, 1.28);

  g.fillStyle(hull, 1);
  g.fillTriangle(originX + 16, originY + 0, originX + 0, originY + 40, originX + 32, originY + 40);
  g.fillStyle(accent, 1);
  g.fillTriangle(originX + 16, originY + 8, originX + 6, originY + 36, originX + 26, originY + 36);
  g.fillStyle(exhaustPrimary, 1);
  g.fillTriangle(originX + 10, originY + 40, originX + 16, originY + 52, originX + 22, originY + 40);
  g.fillStyle(exhaustSecondary, 1);
  g.fillTriangle(originX + 13, originY + 42, originX + 16, originY + 50, originX + 19, originY + 42);
}

export function drawRocketSkin(
  g: Phaser.GameObjects.Graphics,
  appearanceId: RocketSkinAppearanceId,
): void {
  if (appearanceId === 'electricRainbow') {
    drawElectricRainbowRocket(g, RAINBOW_CYCLE_COLORS[0], RAINBOW_CYCLE_COLORS[0]);
    return;
  }

  const p = getRocketSkinPalette(appearanceId);

  if (p.outline !== undefined) {
    g.fillStyle(p.outline, 1);
    g.fillTriangle(16, -2, -2, 42, 34, 42);
  }

  g.fillStyle(p.hull, 1);
  g.fillTriangle(16, 0, 0, 40, 32, 40);
  g.fillStyle(p.accent, 1);
  g.fillTriangle(16, 8, 6, 36, 26, 36);
  g.fillStyle(p.exhaustPrimary, 1);
  g.fillTriangle(10, 40, 16, 52, 22, 40);
  g.fillStyle(p.exhaustSecondary, 1);
  g.fillTriangle(13, 42, 16, 50, 19, 42);
}
