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
  | 'obsidian';

export interface RocketSkinPalette {
  hull: number;
  accent: number;
  exhaustPrimary: number;
  exhaustSecondary: number;
  outline?: number;
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
};

export function getRocketSkinPalette(appearanceId: RocketSkinAppearanceId): RocketSkinPalette {
  return PALETTES[appearanceId];
}

export function getThrusterTints(appearanceId: RocketSkinAppearanceId): number[] {
  const p = getRocketSkinPalette(appearanceId);
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

export function drawRocketSkin(
  g: Phaser.GameObjects.Graphics,
  appearanceId: RocketSkinAppearanceId,
): void {
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
