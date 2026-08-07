import Phaser from 'phaser';
import {
  BOOSTER_TEXTURE_HEIGHT,
  BOOSTER_TEXTURE_WIDTH,
  drawBooster,
} from './boosterAppearances';
import type { RocketShapeId } from './playerShapes';
import {
  drawAssembledRocket,
  drawCannon,
  drawEscapeUpper,
  drawLowerModule,
  drawLowerOnly,
  drawUpperModule,
  type ModuleDrawOptions,
  type RocketSkinPalette,
  ROCKET_TEXTURE_HEIGHT,
  ROCKET_TEXTURE_WIDTH,
} from './rocketAppearances';

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

function drawTwinEngines(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  cx: number,
  oy: number,
): void {
  g.fillStyle(0x555566, 1);
  g.fillEllipse(cx - 6, oy, 5, 7);
  g.fillEllipse(cx + 6, oy, 5, 7);
  g.fillStyle(p.exhaustPrimary, 1);
  g.fillEllipse(cx - 6, oy + 2, 3, 4);
  g.fillEllipse(cx + 6, oy + 2, 3, 4);
  g.fillStyle(p.exhaustSecondary, 1);
  g.fillEllipse(cx - 6, oy + 3, 1.5, 2);
  g.fillEllipse(cx + 6, oy + 3, 1.5, 2);
}

function drawCannonSlot(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  cx: number,
  cy: number,
  includeCannon: boolean,
): void {
  g.fillStyle(0x2a2a32, 1);
  g.fillCircle(cx, cy, 6);
  g.fillStyle(0x15151a, 1);
  g.fillCircle(cx, cy, 4);
  if (includeCannon) {
    drawCannon(g, p, cx - 5, cy - 7);
  }
}

function drawSeamBand(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
): void {
  g.fillStyle(shadeColor(p.hull, 0.75), 1);
  g.fillRect(ox + 11, oy, 18, 6);
  g.fillStyle(p.accent, 0.9);
  for (let i = 0; i < 7; i++) {
    g.fillRect(ox + 12 + i * 2.4, oy + 1, 1.2, 4);
  }
}

/** Mercury First — capsule nose, short cylindrical body. */
function drawMercuryUpper(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const wingsDeployed = options.wingsDeployed === true;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.3);
  const accentDim = shadeColor(p.accent, 0.7);

  if (p.outline !== undefined) {
    g.fillStyle(p.outline, 1);
    g.fillEllipse(cx, oy + 12, 22, 26);
  }

  g.fillStyle(p.hull, 1);
  g.fillEllipse(cx, oy + 12, 18, 22);
  g.fillStyle(hullLight, 1);
  g.fillEllipse(cx, oy + 11, 14, 18);
  g.fillStyle(p.accent, 1);
  g.fillEllipse(cx, oy + 10, 8, 10);

  // Heat-shield rim
  g.fillStyle(shadeColor(p.hull, 0.65), 1);
  g.fillEllipse(cx, oy + 22, 20, 6);

  g.fillStyle(0xa8e8ff, 0.95);
  g.fillRect(cx - 4, oy + 8, 8, 5);

  if (wingsDeployed) {
    g.fillStyle(accentDim, 0.85);
    g.fillTriangle(ox + 11, oy + 14, ox + 0, oy + 12, ox + 11, oy + 20);
    g.fillTriangle(ox + 29, oy + 14, ox + 40, oy + 12, ox + 29, oy + 20);
  }

  drawSeamBand(g, p, ox, oy + 22);
}

function drawMercuryLower(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const includeCannon = options.includeCannon !== false;
  const lowerWingsDeployed = options.lowerWingsDeployed !== false;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.2);
  const wingColor = shadeColor(p.accent, 0.85);

  if (p.outline !== undefined) {
    g.fillStyle(p.outline, 1);
    g.fillRoundedRect(ox + 10, oy - 1, 20, 28, 4);
  }

  g.fillStyle(p.hull, 1);
  g.fillRoundedRect(ox + 12, oy, 16, 26, 3);
  g.fillStyle(hullLight, 1);
  g.fillRoundedRect(ox + 14, oy + 2, 12, 22, 2);
  g.fillStyle(p.accent, 0.85);
  g.fillRect(ox + 16, oy + 6, 8, 14);

  if (lowerWingsDeployed) {
    g.fillStyle(wingColor, 0.95);
    g.fillTriangle(ox + 12, oy + 16, ox + 1, oy + 28, ox + 12, oy + 26);
    g.fillTriangle(ox + 28, oy + 16, ox + 39, oy + 28, ox + 28, oy + 26);
  }

  drawTwinEngines(g, p, cx, oy + 30);
  drawCannonSlot(g, p, cx, oy + 8, includeCannon);
}

/** Gemini the Twin — longer cabin, twin hatches. */
function drawGeminiUpper(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const wingsDeployed = options.wingsDeployed === true;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.3);
  const accentDim = shadeColor(p.accent, 0.7);

  if (p.outline !== undefined) {
    g.fillStyle(p.outline, 1);
    g.fillRoundedRect(ox + 9, oy - 1, 22, 26, 6);
  }

  g.fillStyle(p.hull, 1);
  g.fillRoundedRect(ox + 11, oy, 18, 24, 5);
  g.fillStyle(hullLight, 1);
  g.fillRoundedRect(ox + 13, oy + 2, 14, 20, 4);
  g.fillStyle(p.accent, 1);
  g.fillRect(ox + 15, oy + 4, 10, 16);

  // Twin hatches
  g.fillStyle(0xa8e8ff, 0.95);
  g.fillRoundedRect(cx - 8, oy + 6, 6, 8, 1);
  g.fillRoundedRect(cx + 2, oy + 6, 6, 8, 1);
  g.fillStyle(shadeColor(p.accent, 0.5), 0.8);
  g.fillRect(cx - 1, oy + 5, 2, 14);

  if (wingsDeployed) {
    g.fillStyle(accentDim, 0.85);
    g.fillTriangle(ox + 11, oy + 12, ox + 0, oy + 10, ox + 11, oy + 18);
    g.fillTriangle(ox + 29, oy + 12, ox + 40, oy + 10, ox + 29, oy + 18);
  }

  drawSeamBand(g, p, ox, oy + 22);
}

function drawGeminiLower(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const includeCannon = options.includeCannon !== false;
  const lowerWingsDeployed = options.lowerWingsDeployed !== false;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.2);
  const wingColor = shadeColor(p.accent, 0.85);

  g.fillStyle(p.hull, 1);
  g.fillRoundedRect(ox + 11, oy, 18, 26, 2);
  g.fillStyle(hullLight, 1);
  g.fillRect(ox + 13, oy + 2, 14, 22);
  g.fillStyle(p.accent, 1);
  g.fillRect(ox + 15, oy + 4, 10, 18);
  // Adapter ring detail
  g.fillStyle(shadeColor(p.hull, 0.7), 1);
  g.fillRect(ox + 10, oy + 1, 20, 3);

  if (lowerWingsDeployed) {
    g.fillStyle(wingColor, 0.95);
    g.fillTriangle(ox + 11, oy + 14, ox + 0, oy + 26, ox + 11, oy + 24);
    g.fillTriangle(ox + 29, oy + 14, ox + 40, oy + 26, ox + 29, oy + 24);
    g.fillStyle(p.accent, 0.45);
    g.fillRect(ox + 2, oy + 22, 8, 2);
    g.fillRect(ox + 30, oy + 22, 8, 2);
  }

  drawTwinEngines(g, p, cx, oy + 30);
  drawCannonSlot(g, p, cx, oy + 8, includeCannon);
}

/** LOK Craftblast — orbital module + descent cone cues. */
function drawLokUpper(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const wingsDeployed = options.wingsDeployed === true;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.25);
  const accentDim = shadeColor(p.accent, 0.7);

  // Descent cone
  g.fillStyle(p.hull, 1);
  g.fillTriangle(cx, oy, ox + 8, oy + 16, ox + 32, oy + 16);
  g.fillStyle(hullLight, 1);
  g.fillTriangle(cx, oy + 2, ox + 11, oy + 15, ox + 29, oy + 15);

  // Orbital module cylinder
  g.fillStyle(p.hull, 1);
  g.fillRect(ox + 12, oy + 14, 16, 10);
  g.fillStyle(p.accent, 1);
  g.fillRect(ox + 14, oy + 15, 12, 7);

  g.fillStyle(0xa8e8ff, 0.9);
  g.fillCircle(cx, oy + 8, 3);

  // Periscope / antenna stub
  g.fillStyle(0x888899, 1);
  g.fillRect(cx + 6, oy + 4, 2, 8);

  if (wingsDeployed) {
    g.fillStyle(accentDim, 0.85);
    g.fillTriangle(ox + 12, oy + 14, ox + 1, oy + 11, ox + 12, oy + 20);
    g.fillTriangle(ox + 28, oy + 14, ox + 39, oy + 11, ox + 28, oy + 20);
  }

  drawSeamBand(g, p, ox, oy + 22);
}

function drawLokLower(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const includeCannon = options.includeCannon !== false;
  const lowerWingsDeployed = options.lowerWingsDeployed !== false;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.2);
  const wingColor = shadeColor(p.accent, 0.85);

  // Service module lattice
  g.fillStyle(p.hull, 1);
  g.fillRect(ox + 11, oy, 18, 26);
  g.fillStyle(hullLight, 1);
  g.fillRect(ox + 13, oy + 2, 14, 22);
  g.fillStyle(shadeColor(p.accent, 0.8), 1);
  for (let i = 0; i < 4; i++) {
    g.fillRect(ox + 14, oy + 4 + i * 5, 12, 2);
  }

  if (lowerWingsDeployed) {
    g.fillStyle(wingColor, 0.95);
    g.fillTriangle(ox + 11, oy + 12, ox + 0, oy + 22, ox + 11, oy + 24);
    g.fillTriangle(ox + 29, oy + 12, ox + 40, oy + 22, ox + 29, oy + 24);
    // Solar panel strips
    g.fillStyle(0x2244aa, 0.7);
    g.fillRect(ox + 0, oy + 18, 10, 3);
    g.fillRect(ox + 30, oy + 18, 10, 3);
  }

  drawTwinEngines(g, p, cx, oy + 30);
  drawCannonSlot(g, p, cx, oy + 8, includeCannon);
}

/** Apollo Commander — CSM + LM fused fighter. */
function drawApolloUpper(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const wingsDeployed = options.wingsDeployed === true;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.3);
  const accentDim = shadeColor(p.accent, 0.7);

  // CSM cone
  g.fillStyle(p.hull, 1);
  g.fillTriangle(cx, oy, ox + 9, oy + 14, ox + 31, oy + 14);
  g.fillStyle(hullLight, 1);
  g.fillTriangle(cx, oy + 2, ox + 12, oy + 13, ox + 28, oy + 13);

  // Docking tunnel / LM ascent
  g.fillStyle(p.accent, 1);
  g.fillRect(ox + 15, oy + 12, 10, 12);
  g.fillStyle(hullLight, 1);
  g.fillRect(ox + 16, oy + 13, 8, 8);

  g.fillStyle(0xa8e8ff, 0.95);
  g.fillRect(cx - 5, oy + 5, 3, 4);
  g.fillRect(cx + 2, oy + 5, 3, 4);

  if (wingsDeployed) {
    g.fillStyle(accentDim, 0.85);
    g.fillTriangle(ox + 15, oy + 14, ox + 2, oy + 12, ox + 15, oy + 20);
    g.fillTriangle(ox + 25, oy + 14, ox + 38, oy + 12, ox + 25, oy + 20);
  }

  drawSeamBand(g, p, ox, oy + 22);
}

function drawApolloLower(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const includeCannon = options.includeCannon !== false;
  const lowerWingsDeployed = options.lowerWingsDeployed !== false;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.15);
  const wingColor = shadeColor(p.accent, 0.85);

  // LM descent stage boxiness
  g.fillStyle(p.hull, 1);
  g.fillRect(ox + 9, oy, 22, 26);
  g.fillStyle(hullLight, 1);
  g.fillRect(ox + 11, oy + 2, 18, 22);
  g.fillStyle(p.accent, 1);
  g.fillRect(ox + 14, oy + 5, 12, 16);
  // Gold foil stripes
  g.fillStyle(0xd4a017, 0.55);
  g.fillRect(ox + 10, oy + 8, 20, 2);
  g.fillRect(ox + 10, oy + 14, 20, 2);

  if (lowerWingsDeployed) {
    g.fillStyle(wingColor, 0.95);
    // Landing-leg-like wings
    g.fillTriangle(ox + 9, oy + 10, ox - 1, oy + 28, ox + 9, oy + 24);
    g.fillTriangle(ox + 31, oy + 10, ox + 41, oy + 28, ox + 31, oy + 24);
    g.fillStyle(0x888899, 1);
    g.fillRect(ox + 1, oy + 26, 4, 3);
    g.fillRect(ox + 35, oy + 26, 4, 3);
  }

  drawTwinEngines(g, p, cx, oy + 30);
  drawCannonSlot(g, p, cx, oy + 8, includeCannon);
}

/** Falcon Dragon — saucer freighter + Crew Dragon nose. */
function drawFalconUpper(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const wingsDeployed = options.wingsDeployed === true;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.25);
  const accentDim = shadeColor(p.accent, 0.7);

  // Dragon capsule nose
  g.fillStyle(p.hull, 1);
  g.fillEllipse(cx, oy + 8, 16, 14);
  g.fillStyle(hullLight, 1);
  g.fillEllipse(cx, oy + 7, 12, 10);
  g.fillStyle(0xa8e8ff, 0.95);
  g.fillEllipse(cx, oy + 6, 7, 5);

  // Mandible / freighter cheeks
  g.fillStyle(p.accent, 1);
  g.fillTriangle(ox + 8, oy + 12, ox + 14, oy + 20, ox + 14, oy + 14);
  g.fillTriangle(ox + 32, oy + 12, ox + 26, oy + 20, ox + 26, oy + 14);
  g.fillStyle(p.hull, 1);
  g.fillRect(ox + 12, oy + 14, 16, 10);

  if (wingsDeployed) {
    g.fillStyle(accentDim, 0.9);
    g.fillEllipse(ox + 6, oy + 16, 10, 6);
    g.fillEllipse(ox + 34, oy + 16, 10, 6);
  }

  drawSeamBand(g, p, ox, oy + 22);
}

function drawFalconLower(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const includeCannon = options.includeCannon !== false;
  const lowerWingsDeployed = options.lowerWingsDeployed !== false;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.2);
  const wingColor = shadeColor(p.accent, 0.85);

  // Chunky saucer body
  g.fillStyle(p.hull, 1);
  g.fillEllipse(cx, oy + 14, 28, 24);
  g.fillStyle(hullLight, 1);
  g.fillEllipse(cx, oy + 13, 22, 18);
  g.fillStyle(p.accent, 0.9);
  g.fillEllipse(cx, oy + 12, 12, 12);
  // Sensor dish
  g.fillStyle(0x8899aa, 0.9);
  g.fillCircle(ox + 10, oy + 8, 4);
  g.fillStyle(0x556677, 1);
  g.fillCircle(ox + 10, oy + 8, 2);

  if (lowerWingsDeployed) {
    g.fillStyle(wingColor, 0.95);
    g.fillTriangle(ox + 6, oy + 14, ox - 2, oy + 28, ox + 10, oy + 24);
    g.fillTriangle(ox + 34, oy + 14, ox + 42, oy + 28, ox + 30, oy + 24);
  }

  drawTwinEngines(g, p, cx, oy + 30);
  drawCannonSlot(g, p, cx, oy + 8, includeCannon);
}

/** Space Shuttle — orbiter + X/Y-wing motifs. */
function drawShuttleUpper(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const wingsDeployed = options.wingsDeployed === true;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.3);
  const accentDim = shadeColor(p.accent, 0.7);

  // Orbiter nose
  g.fillStyle(p.hull, 1);
  g.fillTriangle(cx, oy, ox + 12, oy + 16, ox + 28, oy + 16);
  g.fillStyle(hullLight, 1);
  g.fillTriangle(cx, oy + 2, ox + 14, oy + 15, ox + 26, oy + 15);
  g.fillStyle(0xffffff, 0.35);
  g.fillTriangle(cx, oy + 3, ox + 16, oy + 12, ox + 24, oy + 12);

  g.fillStyle(p.accent, 1);
  g.fillRect(ox + 14, oy + 14, 12, 10);
  g.fillStyle(0xa8e8ff, 0.95);
  g.fillRect(cx - 4, oy + 6, 8, 4);

  if (wingsDeployed) {
    // X-wing style split foils
    g.fillStyle(accentDim, 0.9);
    g.fillTriangle(ox + 14, oy + 14, ox + 2, oy + 8, ox + 14, oy + 18);
    g.fillTriangle(ox + 14, oy + 16, ox + 2, oy + 22, ox + 14, oy + 20);
    g.fillTriangle(ox + 26, oy + 14, ox + 38, oy + 8, ox + 26, oy + 18);
    g.fillTriangle(ox + 26, oy + 16, ox + 38, oy + 22, ox + 26, oy + 20);
  }

  drawSeamBand(g, p, ox, oy + 22);
}

function drawShuttleLower(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const includeCannon = options.includeCannon !== false;
  const lowerWingsDeployed = options.lowerWingsDeployed !== false;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.2);
  const wingColor = shadeColor(p.accent, 0.85);

  // Cargo bay fuselage
  g.fillStyle(p.hull, 1);
  g.fillRect(ox + 12, oy, 16, 26);
  g.fillStyle(hullLight, 1);
  g.fillRect(ox + 13, oy + 1, 14, 24);
  g.fillStyle(shadeColor(p.hull, 0.7), 1);
  g.fillRect(ox + 14, oy + 3, 12, 2);
  g.fillRect(ox + 14, oy + 8, 12, 2);
  g.fillRect(ox + 14, oy + 13, 12, 2);
  g.fillStyle(p.accent, 1);
  g.fillRect(ox + 16, oy + 16, 8, 8);

  if (lowerWingsDeployed) {
    // Delta + Y-wing engine pods
    g.fillStyle(wingColor, 0.95);
    g.fillTriangle(ox + 12, oy + 10, ox - 2, oy + 28, ox + 12, oy + 24);
    g.fillTriangle(ox + 28, oy + 10, ox + 42, oy + 28, ox + 28, oy + 24);
    g.fillStyle(0x555566, 1);
    g.fillEllipse(ox + 4, oy + 26, 5, 6);
    g.fillEllipse(ox + 36, oy + 26, 5, 6);
    g.fillStyle(p.exhaustPrimary, 0.9);
    g.fillEllipse(ox + 4, oy + 28, 3, 3);
    g.fillEllipse(ox + 36, oy + 30, 3, 3);
  }

  drawTwinEngines(g, p, cx, oy + 30);
  drawCannonSlot(g, p, cx, oy + 8, includeCannon);
}

/** Orion Orionis — MPCV capsule + pulse-unit plate. */
function drawOrionUpper(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const wingsDeployed = options.wingsDeployed === true;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.3);
  const accentDim = shadeColor(p.accent, 0.7);

  g.fillStyle(p.hull, 1);
  g.fillEllipse(cx, oy + 12, 20, 22);
  g.fillStyle(hullLight, 1);
  g.fillEllipse(cx, oy + 11, 16, 18);
  g.fillStyle(p.accent, 1);
  g.fillEllipse(cx, oy + 10, 10, 12);

  // Heat shield
  g.fillStyle(shadeColor(p.hull, 0.55), 1);
  g.fillEllipse(cx, oy + 22, 22, 5);

  g.fillStyle(0xa8e8ff, 0.95);
  g.fillRect(cx - 6, oy + 7, 4, 5);
  g.fillRect(cx + 2, oy + 7, 4, 5);

  if (wingsDeployed) {
    g.fillStyle(accentDim, 0.85);
    g.fillTriangle(ox + 10, oy + 14, ox - 1, oy + 12, ox + 10, oy + 20);
    g.fillTriangle(ox + 30, oy + 14, ox + 41, oy + 12, ox + 30, oy + 20);
  }

  drawSeamBand(g, p, ox, oy + 22);
}

function drawOrionLower(
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  const includeCannon = options.includeCannon !== false;
  const lowerWingsDeployed = options.lowerWingsDeployed !== false;
  const cx = ox + 20;
  const hullLight = brightenColor(p.hull, 1.15);
  const wingColor = shadeColor(p.accent, 0.85);

  // Heavy pulse plate
  g.fillStyle(shadeColor(p.hull, 0.8), 1);
  g.fillRect(ox + 6, oy + 18, 28, 10);
  g.fillStyle(p.hull, 1);
  g.fillRect(ox + 10, oy, 20, 22);
  g.fillStyle(hullLight, 1);
  g.fillRect(ox + 12, oy + 2, 16, 18);
  g.fillStyle(p.accent, 1);
  g.fillRect(ox + 14, oy + 4, 12, 14);

  // Pulse charge cells
  g.fillStyle(p.exhaustPrimary, 0.75);
  for (let i = 0; i < 5; i++) {
    g.fillRect(ox + 8 + i * 5, oy + 20, 3, 6);
  }

  if (lowerWingsDeployed) {
    g.fillStyle(wingColor, 0.95);
    g.fillTriangle(ox + 10, oy + 12, ox - 2, oy + 28, ox + 10, oy + 24);
    g.fillTriangle(ox + 30, oy + 12, ox + 42, oy + 28, ox + 30, oy + 24);
  }

  drawTwinEngines(g, p, cx, oy + 30);
  drawCannonSlot(g, p, cx, oy + 8, includeCannon);
}

export function drawShapeUpper(
  shapeId: RocketShapeId,
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  switch (shapeId) {
    case 'mercuryFirst':
      drawMercuryUpper(g, p, ox, oy, options);
      return;
    case 'geminiTwin':
      drawGeminiUpper(g, p, ox, oy, options);
      return;
    case 'lokCraftblast':
      drawLokUpper(g, p, ox, oy, options);
      return;
    case 'apolloCommander':
      drawApolloUpper(g, p, ox, oy, options);
      return;
    case 'falconDragon':
      drawFalconUpper(g, p, ox, oy, options);
      return;
    case 'spaceShuttle':
      drawShuttleUpper(g, p, ox, oy, options);
      return;
    case 'orionOrionis':
      drawOrionUpper(g, p, ox, oy, options);
      return;
    case 'starBlaster':
    default:
      drawUpperModule(g, p, ox, oy, options);
  }
}

export function drawShapeLower(
  shapeId: RocketShapeId,
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  ox: number,
  oy: number,
  options: ModuleDrawOptions = {},
): void {
  switch (shapeId) {
    case 'mercuryFirst':
      drawMercuryLower(g, p, ox, oy, options);
      return;
    case 'geminiTwin':
      drawGeminiLower(g, p, ox, oy, options);
      return;
    case 'lokCraftblast':
      drawLokLower(g, p, ox, oy, options);
      return;
    case 'apolloCommander':
      drawApolloLower(g, p, ox, oy, options);
      return;
    case 'falconDragon':
      drawFalconLower(g, p, ox, oy, options);
      return;
    case 'spaceShuttle':
      drawShuttleLower(g, p, ox, oy, options);
      return;
    case 'orionOrionis':
      drawOrionLower(g, p, ox, oy, options);
      return;
    case 'starBlaster':
    default:
      drawLowerModule(g, p, ox, oy, options);
  }
}

export function drawShapeAssembled(
  shapeId: RocketShapeId,
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  originX = 0,
  originY = 0,
  options: ModuleDrawOptions = {},
): void {
  const includeCannon = options.includeCannon === true;
  const lowerWingsDeployed = options.lowerWingsDeployed !== false;
  const wingsDeployed = options.wingsDeployed === true;

  if (shapeId === 'starBlaster') {
    drawAssembledRocket(g, p, originX, originY, {
      includeCannon,
      lowerWingsDeployed,
      wingsDeployed,
    });
    return;
  }

  drawShapeUpper(shapeId, g, p, originX, originY, { wingsDeployed });
  drawShapeLower(shapeId, g, p, originX, originY + 28, { includeCannon, lowerWingsDeployed });
}

export function drawShapeEscapeUpper(
  shapeId: RocketShapeId,
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  originX = 4,
  originY = 2,
): void {
  if (shapeId === 'starBlaster') {
    drawEscapeUpper(g, p, originX, originY);
    return;
  }
  drawShapeUpper(shapeId, g, p, originX, originY, { wingsDeployed: true });
}

export function drawShapeLowerOnly(
  shapeId: RocketShapeId,
  g: Phaser.GameObjects.Graphics,
  p: RocketSkinPalette,
  originX = 4,
  originY = 2,
): void {
  if (shapeId === 'starBlaster') {
    drawLowerOnly(g, p, originX, originY);
    return;
  }
  drawShapeLower(shapeId, g, p, originX, originY, { includeCannon: false, lowerWingsDeployed: true });
}

/** Stack preview: 1 = packed, 2 = booster+ship split, 3 = three-way split. */
export type StackPreviewIteration = 1 | 2 | 3;

export const STACK_PREVIEW_OVERLAP_PX = 24;
export const STACK_PREVIEW_SEP_GAP = 14;
export const STACK_PREVIEW_SHIP_SPLIT_GAP = 10;

export interface StackPreviewOptions {
  iteration: StackPreviewIteration;
  shapeId: RocketShapeId;
  palette: RocketSkinPalette;
  includeCannon?: boolean;
}

/**
 * Draw launch-stack preview centered at (cx, cy).
 * Booster is always the default unskinned booster.
 */
export function drawLaunchStackPreview(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  options: StackPreviewOptions,
): void {
  const { iteration, shapeId, palette } = options;
  const includeCannon = options.includeCannon !== false;
  const shipW = ROCKET_TEXTURE_WIDTH;
  const shipH = ROCKET_TEXTURE_HEIGHT;
  const boosterW = BOOSTER_TEXTURE_WIDTH;
  const boosterH = BOOSTER_TEXTURE_HEIGHT;

  const boosterDeployed = iteration >= 2;
  const lowerWings = iteration >= 2;
  const upperWings = iteration >= 3;

  if (iteration === 1) {
    const stackH = shipH + boosterH - STACK_PREVIEW_OVERLAP_PX;
    const top = cy - stackH / 2;
    const shipOx = cx - shipW / 2;
    const shipOy = top;
    const boosterOx = cx - boosterW / 2;
    const boosterOy = top + shipH - STACK_PREVIEW_OVERLAP_PX;

    drawShapeAssembled(shapeId, g, palette, shipOx, shipOy, {
      includeCannon,
      lowerWingsDeployed: false,
      wingsDeployed: false,
    });
    drawBooster(g, boosterOx, boosterOy, { deployed: false });
    return;
  }

  if (iteration === 2) {
    const gap = STACK_PREVIEW_SEP_GAP;
    const stackH = shipH + gap + boosterH;
    const top = cy - stackH / 2;
    const shipOx = cx - shipW / 2;
    const shipOy = top;
    const boosterOx = cx - boosterW / 2;
    const boosterOy = top + shipH + gap;

    drawShapeAssembled(shapeId, g, palette, shipOx, shipOy, {
      includeCannon,
      lowerWingsDeployed: lowerWings,
      wingsDeployed: false,
    });
    drawBooster(g, boosterOx, boosterOy, { deployed: boosterDeployed });
    return;
  }

  // Iteration 3: upper + lower + booster
  const upperH = 28;
  const lowerH = 36;
  const gapShip = STACK_PREVIEW_SHIP_SPLIT_GAP;
  const gapBooster = STACK_PREVIEW_SEP_GAP;
  const stackH = upperH + gapShip + lowerH + gapBooster + boosterH;
  const top = cy - stackH / 2;
  const shipOx = cx - shipW / 2;
  const upperOy = top;
  const lowerOy = top + upperH + gapShip;
  const boosterOx = cx - boosterW / 2;
  const boosterOy = lowerOy + lowerH + gapBooster;

  drawShapeUpper(shapeId, g, palette, shipOx, upperOy, { wingsDeployed: upperWings });
  drawShapeLower(shapeId, g, palette, shipOx, lowerOy, {
    includeCannon,
    lowerWingsDeployed: lowerWings,
  });
  drawBooster(g, boosterOx, boosterOy, { deployed: true });
}
