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
export const ROCKET_TEXTURE_WIDTH = 40;
export const ROCKET_TEXTURE_HEIGHT = 64;

/** Escape-upper module texture (wings deployed). */
export const ROCKET_ESCAPE_TEXTURE_WIDTH = 48;
export const ROCKET_ESCAPE_TEXTURE_HEIGHT = 32;

/** Lower combat module texture. */
export const ROCKET_LOWER_TEXTURE_WIDTH = 48;
export const ROCKET_LOWER_TEXTURE_HEIGHT = 40;

/** Shared cannon texture (points toward -Y / screen-up when rotation is 0). */
export const ROCKET_CANNON_TEXTURE_KEY = 'rocket-cannon';
export const ROCKET_CANNON_TEXTURE_WIDTH = 10;
export const ROCKET_CANNON_TEXTURE_HEIGHT = 14;

/** Engine nozzle center in full-ship texture space. */
export const ROCKET_ENGINE_X = ROCKET_TEXTURE_WIDTH / 2;
export const ROCKET_ENGINE_Y = 60;

/** Offset from sprite origin (center) to rear engines in pixels. */
export const ROCKET_ENGINE_OFFSET_Y = ROCKET_ENGINE_Y - ROCKET_TEXTURE_HEIGHT / 2;

/**
 * Cannon slot center in full-ship texture space.
 * Local offset from sprite origin: (0, ROCKET_CANNON_OFFSET_Y).
 */
export const ROCKET_CANNON_SLOT_X = ROCKET_TEXTURE_WIDTH / 2;
export const ROCKET_CANNON_SLOT_Y = 34;
export const ROCKET_CANNON_OFFSET_Y = ROCKET_CANNON_SLOT_Y - ROCKET_TEXTURE_HEIGHT / 2;

/** Muzzle tip above the cannon slot (ship-local, before counter-rotation). */
export const ROCKET_CANNON_MUZZLE_OFFSET_Y = ROCKET_CANNON_OFFSET_Y - 8;

/** Upper-module center Y in full-ship texture (for escape spawn). */
export const ROCKET_UPPER_CENTER_Y = 14;
export const ROCKET_UPPER_OFFSET_Y = ROCKET_UPPER_CENTER_Y - ROCKET_TEXTURE_HEIGHT / 2;

/** Lower-module center Y in full-ship texture (for explosion spawn). */
export const ROCKET_LOWER_CENTER_Y = 46;
export const ROCKET_LOWER_OFFSET_Y = ROCKET_LOWER_CENTER_Y - ROCKET_TEXTURE_HEIGHT / 2;

export function escapeUpperTextureKey(skinTextureKey: string): string {
  return `${skinTextureKey}-escape`;
}

export function lowerModuleTextureKey(skinTextureKey: string): string {
  return `${skinTextureKey}-lower`;
}

export interface ModuleDrawOptions {
  wingsDeployed?: boolean;
  /** Combat lower-module wings. Defaults to true (gameplay). Launch cutscene uses false until separation. */
  lowerWingsDeployed?: boolean;
  /** When false, skip the baked cannon (runtime uses a counter-rotated sprite). */
  includeCannon?: boolean;
}

function paletteFromColors(
  hull: number,
  accent: number,
  exhaustPrimary: number,
  exhaustSecondary: number,
  outline?: number,
): RocketSkinPalette {
  return { hull, accent, exhaustPrimary, exhaustSecondary, outline };
}

/**
 * Crewed upper escape module.
 * Drawn in local coords where (0,0) is top-left of a 40×28 region (or wider when wings out).
 * `ox`/`oy` shift the draw origin in the target graphics/texture.
 */
export function drawUpperModule(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const wingsDeployed = options.wingsDeployed === true;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.35);
  const accentDim = shadeColor(p.accent, 0.7);

  if (p.outline !== undefined) {
    g.fillStyle(p.outline, 1);
    g.fillTriangle(cx, oy - 1, ox + 9, oy + 16, ox + 31, oy + 16);
  }

  // Cockpit nose
  g.fillStyle(p.hull, 1);
  g.fillTriangle(cx, oy, ox + 10, oy + 14, ox + 30, oy + 14);

  // Upper body
  g.fillStyle(hullLight, 1);
  g.fillRect(ox + 12, oy + 12, 16, 10);
  g.fillStyle(p.accent, 1);
  g.fillRect(ox + 14, oy + 13, 12, 7);

  // Cockpit windows
  g.fillStyle(0xa8e8ff, 0.95);
  g.fillRect(cx - 7, oy + 6, 3, 4);
  g.fillRect(cx - 1.5, oy + 5, 3, 4);
  g.fillRect(cx + 4, oy + 6, 3, 4);

  // Retractable wings (escape only)
  if (wingsDeployed) {
    g.fillStyle(accentDim, 0.85);
    g.fillTriangle(ox + 12, oy + 12, ox + 1, oy + 10, ox + 12, oy + 18);
    g.fillTriangle(ox + 28, oy + 12, ox + 39, oy + 10, ox + 28, oy + 18);
    g.fillStyle(p.accent, 0.55);
    g.fillTriangle(ox + 12, oy + 13, ox + 4, oy + 11, ox + 12, oy + 17);
    g.fillTriangle(ox + 28, oy + 13, ox + 36, oy + 11, ox + 28, oy + 17);
  }

  // Hidden engines stripe band at the seam
  g.fillStyle(shadeColor(p.hull, 0.75), 1);
  g.fillRect(ox + 11, oy + 22, 18, 6);
  g.fillStyle(p.accent, 0.9);
  for (let i = 0; i < 7; i++) {
    g.fillRect(ox + 12 + i * 2.4, oy + 23, 1.2, 4);
  }
}

/**
 * Combat lower module: body, large wings, twin rear engines, cannon slot.
 * Drawn in a ~40×36 region starting at (ox, oy).
 */
export function drawLowerModule(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const includeCannon = options.includeCannon !== false;
  const lowerWingsDeployed = options.lowerWingsDeployed !== false;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.25);
  const wingColor = shadeColor(p.accent, 0.85);

  if (p.outline !== undefined) {
    g.fillStyle(p.outline, 1);
    g.fillRect(ox + 9, oy - 1, 22, 28);
  }

  // Main body
  g.fillStyle(p.hull, 1);
  g.fillRect(ox + 11, oy, 18, 26);
  g.fillStyle(hullLight, 1);
  g.fillRect(ox + 13, oy + 2, 14, 22);
  g.fillStyle(p.accent, 1);
  g.fillRect(ox + 15, oy + 4, 10, 18);

  // Large rear wings (retracted during launch until booster separation)
  if (lowerWingsDeployed) {
    g.fillStyle(wingColor, 0.95);
    g.fillTriangle(ox + 11, oy + 14, ox + 0, oy + 28, ox + 11, oy + 26);
    g.fillTriangle(ox + 29, oy + 14, ox + 40, oy + 28, ox + 29, oy + 26);
    g.fillStyle(p.accent, 0.5);
    g.fillTriangle(ox + 11, oy + 16, ox + 3, oy + 27, ox + 11, oy + 24);
    g.fillTriangle(ox + 29, oy + 16, ox + 37, oy + 27, ox + 29, oy + 24);
  }

  // Twin rear engine nozzles
  g.fillStyle(0x555566, 1);
  g.fillEllipse(cx - 6, oy + 30, 5, 7);
  g.fillEllipse(cx + 6, oy + 30, 5, 7);
  g.fillStyle(p.exhaustPrimary, 1);
  g.fillEllipse(cx - 6, oy + 32, 3, 4);
  g.fillEllipse(cx + 6, oy + 32, 3, 4);
  g.fillStyle(p.exhaustSecondary, 1);
  g.fillEllipse(cx - 6, oy + 33, 1.5, 2);
  g.fillEllipse(cx + 6, oy + 33, 1.5, 2);

  // Cannon slot (dark circle)
  g.fillStyle(0x2a2a32, 1);
  g.fillCircle(cx, oy + 8, 6);
  g.fillStyle(0x15151a, 1);
  g.fillCircle(cx, oy + 8, 4);

  if (includeCannon) {
    drawCannon(g, p, cx - 5, oy + 1);
  }
}

/** Small cannon barrel pointing toward -Y (up in texture / screen-up at rotation 0). */
export function drawCannon(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
): void {
  g.fillStyle(0x3a3a48, 1);
  g.fillRoundedRect(ox + 2, oy + 4, 6, 8, 1);
  g.fillStyle(shadeColor(p.accent, 0.6), 1);
  g.fillRect(ox + 3, oy + 1, 4, 8);
  g.fillStyle(0xc8d0e0, 1);
  g.fillRect(ox + 3.5, oy, 3, 4);
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(ox + 4, oy, 2, 2);
}

export function drawAssembledRocket(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  originX = 0,
  originY = 0,
  options: ModuleDrawOptions = {},
): void {
  const includeCannon = options.includeCannon === true;
  const lowerWingsDeployed = options.lowerWingsDeployed !== false;
  drawUpperModule(g, p, originX, originY, { wingsDeployed: false });
  drawLowerModule(g, p, originX, originY + 28, { includeCannon, lowerWingsDeployed });
}

export function drawEscapeUpper(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  originX = 4,
  originY = 2,
): void {
  drawUpperModule(g, p, originX, originY, { wingsDeployed: true });
}

export function drawLowerOnly(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  originX = 4,
  originY = 2,
): void {
  drawLowerModule(g, p, originX, originY, { includeCannon: false });
}

export function drawElectricRainbowRocket(
  g: Phaser.GameObjects.Graphics,
  bodyColor: number,
  engineColor: number,
  originX = 0,
  originY = 0,
  options: ModuleDrawOptions = {},
): void {
  const p = paletteFromColors(
    shadeColor(bodyColor, 0.38),
    bodyColor,
    engineColor,
    brightenColor(engineColor, 1.28),
  );
  drawAssembledRocket(g, p, originX, originY, {
    includeCannon: options.includeCannon === true,
    lowerWingsDeployed: options.lowerWingsDeployed,
  });
}

export function drawRocketSkin(
  g: Phaser.GameObjects.Graphics,
  appearanceId: RocketSkinAppearanceId,
  options: ModuleDrawOptions = {},
): void {
  if (appearanceId === 'electricRainbow') {
    drawElectricRainbowRocket(
      g,
      RAINBOW_CYCLE_COLORS[0],
      RAINBOW_CYCLE_COLORS[0],
      0,
      0,
      options,
    );
    return;
  }

  const p = getRocketSkinPalette(appearanceId);
  drawAssembledRocket(g, p, 0, 0, {
    includeCannon: options.includeCannon === true,
    lowerWingsDeployed: options.lowerWingsDeployed,
  });
}

export function drawEscapeUpperSkin(
  g: Phaser.GameObjects.Graphics,
  appearanceId: RocketSkinAppearanceId,
): void {
  if (appearanceId === 'electricRainbow') {
    const p = paletteFromColors(
      shadeColor(RAINBOW_CYCLE_COLORS[0], 0.38),
      RAINBOW_CYCLE_COLORS[0],
      RAINBOW_CYCLE_COLORS[0],
      brightenColor(RAINBOW_CYCLE_COLORS[0], 1.28),
    );
    drawEscapeUpper(g, p);
    return;
  }
  drawEscapeUpper(g, getRocketSkinPalette(appearanceId));
}

export function drawLowerModuleSkin(
  g: Phaser.GameObjects.Graphics,
  appearanceId: RocketSkinAppearanceId,
): void {
  if (appearanceId === 'electricRainbow') {
    const p = paletteFromColors(
      shadeColor(RAINBOW_CYCLE_COLORS[0], 0.38),
      RAINBOW_CYCLE_COLORS[0],
      RAINBOW_CYCLE_COLORS[0],
      brightenColor(RAINBOW_CYCLE_COLORS[0], 1.28),
    );
    drawLowerOnly(g, p);
    return;
  }
  drawLowerOnly(g, getRocketSkinPalette(appearanceId));
}

export function drawCannonTexture(g: Phaser.GameObjects.Graphics): void {
  drawCannon(g, getRocketSkinPalette('classic'), 0, 0);
}
