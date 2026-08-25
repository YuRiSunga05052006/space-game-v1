import Phaser from 'phaser';
import type { BackgroundTheme } from '../world1/backgrounds';

export interface StoryBackgroundLayers {
  sky: Phaser.GameObjects.Graphics;
  planet: Phaser.GameObjects.Graphics;
}

const BELT_ASTEROID_COUNTS = {
  beltEntry: 7,
  vesta: 10,
  pallas: 16,
  ceres: 24,
  beltFinale: 55,
} as const;

type CraterSpec = { ox: number; oy: number; size: number };

type AsteroidPalette = {
  base: number;
  mid: number;
  dark: number;
  highlight: number;
};

const ROCKY_ASTEROID_PALETTE: AsteroidPalette = {
  base: 0x554433,
  mid: 0x665544,
  dark: 0x3a2c22,
  highlight: 0x887766,
};

const ICY_ASTEROID_PALETTE: AsteroidPalette = {
  base: 0x778899,
  mid: 0x99aabb,
  dark: 0x556677,
  highlight: 0xcceeff,
};

const ICY_FIELD_COUNT = 55;
const OORT_COMET_COUNT = 10;

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function closeupCenter(
  theme: BackgroundTheme,
  width: number,
  height: number,
): { px: number; py: number; r: number } {
  return {
    px: width * theme.planetX,
    py: height * 0.4,
    r: theme.planetSize / 2,
  };
}

function drawCloseupBody(
  g: Phaser.GameObjects.Graphics,
  px: number,
  py: number,
  r: number,
  color: number,
  glowPad = 12,
): void {
  g.fillStyle(color, 0.28);
  g.fillCircle(px, py, r + glowPad);
  g.fillStyle(color, 0.92);
  g.fillCircle(px, py, r);
  g.fillStyle(0xffffff, 0.12);
  g.fillCircle(px - r * 0.28, py - r * 0.3, r * 0.32);
}

function drawCraters(
  g: Phaser.GameObjects.Graphics,
  px: number,
  py: number,
  r: number,
  craters: CraterSpec[],
  color: number,
  alpha: number,
): void {
  g.fillStyle(color, alpha);
  for (const crater of craters) {
    g.fillCircle(px + crater.ox * r, py + crater.oy * r, r * crater.size);
  }
}

function drawSun(g: Phaser.GameObjects.Graphics, x: number, y: number, coreR: number): void {
  g.fillStyle(0xffaa22, 0.22);
  g.fillCircle(x, y, coreR * 2.2);
  g.fillStyle(0xffcc44, 0.4);
  g.fillCircle(x, y, coreR * 1.55);
  g.fillStyle(0xffee88, 0.95);
  g.fillCircle(x, y, coreR);
  g.fillStyle(0xffffff, 0.65);
  g.fillCircle(x - coreR * 0.18, y - coreR * 0.18, coreR * 0.32);

  g.lineStyle(2, 0xffdd66, 0.55);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.lineBetween(
      x + Math.cos(a) * (coreR + 6),
      y + Math.sin(a) * (coreR + 6),
      x + Math.cos(a) * (coreR * 2),
      y + Math.sin(a) * (coreR * 2),
    );
  }
}

function drawBgAsteroid(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  rng: () => number,
  palette: AsteroidPalette = ROCKY_ASTEROID_PALETTE,
): void {
  const ox = (rng() - 0.5) * size * 0.5;
  const oy = (rng() - 0.5) * size * 0.5;
  g.fillStyle(palette.base, 0.5);
  g.fillCircle(x, y, size);
  g.fillStyle(palette.mid, 0.38);
  g.fillCircle(x + size * 0.35 + ox, y - size * 0.22 + oy, size * 0.55);
  g.fillStyle(palette.dark, 0.32);
  g.fillCircle(x - size * 0.22, y + size * 0.18, size * 0.38);
  g.fillStyle(palette.highlight, 0.22);
  g.fillCircle(x - size * 0.18, y - size * 0.2, size * 0.22);
}

function drawBackgroundAsteroidField(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  count: number,
  seed: number,
  bounds?: { xMin: number; xMax: number; yMin: number; yMax: number },
  palette: AsteroidPalette = ROCKY_ASTEROID_PALETTE,
): void {
  const rng = seededRandom(seed);
  const xMin = (bounds?.xMin ?? 0) * width;
  const xMax = (bounds?.xMax ?? 1) * width;
  const yMin = (bounds?.yMin ?? 0) * height;
  const yMax = (bounds?.yMax ?? 1) * height;

  for (let i = 0; i < count; i++) {
    const x = xMin + rng() * (xMax - xMin);
    const y = yMin + rng() * (yMax - yMin);
    const size = 4 + rng() * 10;
    drawBgAsteroid(g, x, y, size, rng, palette);
  }
}

function drawSatelliteMoon(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  irregular = false,
): void {
  if (irregular) {
    g.fillStyle(color, 0.95);
    g.fillEllipse(x, y, size * 2.2, size * 1.35);
    g.fillCircle(x + size * 0.28, y - size * 0.1, size * 0.5);
    g.fillStyle(0xffffff, 0.14);
    g.fillCircle(x - size * 0.22, y - size * 0.18, size * 0.22);
    return;
  }
  g.fillStyle(color, 0.95);
  g.fillCircle(x, y, size);
  g.fillStyle(0xffffff, 0.2);
  g.fillCircle(x - size * 0.25, y - size * 0.25, size * 0.35);
}

function strokeEllipseHalf(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  front: boolean,
): void {
  const start = front ? 0 : Math.PI;
  const end = front ? Math.PI : Math.PI * 2;
  const segs = 28;
  g.beginPath();
  for (let i = 0; i <= segs; i++) {
    const t = start + (end - start) * (i / segs);
    const x = cx + Math.cos(t) * rx;
    const y = cy + Math.sin(t) * ry;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.strokePath();
}

function drawSaturnRings(
  g: Phaser.GameObjects.Graphics,
  px: number,
  py: number,
  r: number,
  front: boolean,
): void {
  const rings = [
    { rx: r * 1.88, ry: r * 0.44, width: 5, color: 0xc8a060, alpha: 0.42 },
    { rx: r * 1.64, ry: r * 0.38, width: 7, color: 0xddcc99, alpha: 0.5 },
    { rx: r * 1.4, ry: r * 0.32, width: 3, color: 0xaa8866, alpha: 0.32 },
  ];
  for (const ring of rings) {
    g.lineStyle(ring.width, ring.color, ring.alpha);
    strokeEllipseHalf(g, px, py, ring.rx, ring.ry, front);
  }
}

function drawBackgroundComet(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  length: number,
  angle: number,
  scale: number,
): void {
  const tx = x + Math.cos(angle) * length;
  const ty = y + Math.sin(angle) * length;
  const px = -Math.sin(angle);
  const py = Math.cos(angle);
  const core = 4.5 * scale;

  g.fillStyle(0x4466aa, 0.28);
  g.fillTriangle(x + px * core * 1.6, y + py * core * 1.6, x - px * core * 1.6, y - py * core * 1.6, tx, ty);
  g.fillStyle(0x88aaff, 0.2);
  g.fillTriangle(
    x + px * core * 0.9,
    y + py * core * 0.9,
    x - px * core * 0.9,
    y - py * core * 0.9,
    x + Math.cos(angle) * length * 0.55,
    y + Math.sin(angle) * length * 0.55,
  );
  g.fillStyle(0xaaccff, 0.95);
  g.fillCircle(x, y, core);
  g.fillStyle(0xffffff, 0.65);
  g.fillCircle(x - core * 0.28, y - core * 0.28, core * 0.38);
}

function drawBackgroundCometField(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  count: number,
  seed: number,
): void {
  const rng = seededRandom(seed);
  for (let i = 0; i < count; i++) {
    const x = rng() * width;
    const y = rng() * height;
    const length = 28 + rng() * 52;
    const angle = rng() * Math.PI * 2;
    drawBackgroundComet(g, x, y, length, angle, 0.7 + rng() * 0.55);
  }
}

function drawNewHorizons(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  scale: number,
): void {
  const s = scale;

  g.lineStyle(2 * s, 0x888899, 0.9);
  g.lineBetween(cx + 14 * s, cy + 2 * s, cx + 40 * s, cy + 10 * s);
  g.fillStyle(0x666677, 0.95);
  g.fillRect(cx + 36 * s, cy + 6 * s, 14 * s, 9 * s);
  g.fillStyle(0x888899, 0.5);
  g.fillRect(cx + 38 * s, cy + 8 * s, 10 * s, 2 * s);
  g.fillRect(cx + 38 * s, cy + 11 * s, 10 * s, 2 * s);

  g.fillStyle(0x222228, 0.95);
  g.fillRoundedRect(cx - 14 * s, cy - 10 * s, 30 * s, 22 * s, 3 * s);
  g.fillStyle(0x445566, 0.55);
  g.fillRect(cx - 10 * s, cy - 6 * s, 10 * s, 14 * s);
  g.fillStyle(0x8899aa, 0.35);
  g.fillRect(cx + 4 * s, cy - 4 * s, 8 * s, 8 * s);

  g.lineStyle(1.5 * s, 0x999aaa, 0.9);
  g.lineBetween(cx, cy - 10 * s, cx - 2 * s, cy - 14 * s);
  g.fillStyle(0xc8d0d8, 0.92);
  g.fillCircle(cx - 2 * s, cy - 24 * s, 12 * s);
  g.fillStyle(0x334455, 0.45);
  g.fillCircle(cx - 2 * s, cy - 24 * s, 8 * s);
  g.lineStyle(1.5 * s, 0xeeeeff, 0.7);
  g.strokeCircle(cx - 2 * s, cy - 24 * s, 12 * s);
}

function drawEarthHorizon(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
  const earthR = width * 1.15;
  const earthCx = width * 0.5;
  const earthCy = height + earthR * 0.58;

  g.fillStyle(0x1a4080, 0.35);
  g.fillCircle(earthCx, earthCy, earthR + 24);

  g.fillStyle(0x1e5a9a, 0.95);
  g.fillCircle(earthCx, earthCy, earthR);

  g.fillStyle(0x2a8a55, 0.75);
  g.fillEllipse(earthCx - 55, earthCy - earthR * 0.52, 130, 75);
  g.fillStyle(0x3aa060, 0.55);
  g.fillEllipse(earthCx + 30, earthCy - earthR * 0.48, 90, 55);

  g.fillStyle(0x88ccff, 0.18);
  g.fillCircle(earthCx - earthR * 0.2, earthCy - earthR * 0.62, earthR * 0.35);

  g.lineStyle(4, 0xaaddff, 0.4);
  g.strokeCircle(earthCx, earthCy, earthR);
  g.lineStyle(2, 0xccffff, 0.2);
  g.strokeCircle(earthCx, earthCy, earthR + 10);
}

function drawSolarArray(
  g: Phaser.GameObjects.Graphics,
  startX: number,
  y: number,
  scale: number,
  panels: number,
  flip: boolean,
): void {
  const dir = flip ? -1 : 1;
  const mastLen = 42 * scale;

  g.lineStyle(2 * scale, 0xbbbbbb, 0.95);
  g.lineBetween(startX, y, startX + dir * mastLen, y);

  for (let i = 0; i < panels; i++) {
    const panelX = startX + dir * (8 + i * 16) * scale;
    g.fillStyle(0x888888, 0.95);
    g.fillRect(panelX - 7 * scale, y - 30 * scale, 14 * scale, 60 * scale);
    g.fillStyle(0x3a5a8a, 0.9);
    g.fillRect(panelX - 5 * scale, y - 27 * scale, 10 * scale, 54 * scale);
    g.fillStyle(0xd4a843, 0.8);
    g.fillRect(panelX - 4 * scale, y - 25 * scale, 8 * scale, 50 * scale);
    g.lineStyle(1, 0xeeeeee, 0.5);
    g.strokeRect(panelX - 5 * scale, y - 27 * scale, 10 * scale, 54 * scale);
  }
}

function drawIssStation(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  scale: number,
): void {
  const s = scale;

  drawSolarArray(g, cx - 88 * s, cy, s, 4, true);
  drawSolarArray(g, cx + 88 * s, cy, s, 4, false);

  g.fillStyle(0x9a9aaa, 0.95);
  g.fillRect(cx - 82 * s, cy - 3 * s, 164 * s, 6 * s);
  g.lineStyle(1, 0xcccccc, 0.7);
  g.strokeRect(cx - 82 * s, cy - 3 * s, 164 * s, 6 * s);

  g.fillStyle(0xd8d8e8, 1);
  g.fillRoundedRect(cx - 72 * s, cy - 14 * s, 38 * s, 28 * s, 5 * s);
  g.fillStyle(0xc0c0d0, 0.8);
  g.fillRect(cx - 68 * s, cy - 10 * s, 8 * s, 20 * s);

  g.fillStyle(0xe0e0ec, 1);
  g.fillRoundedRect(cx - 24 * s, cy - 16 * s, 32 * s, 32 * s, 6 * s);
  g.fillStyle(0x6688aa, 0.45);
  g.fillCircle(cx - 8 * s, cy - 2 * s, 5 * s);

  g.fillStyle(0xdcdce8, 1);
  g.fillRoundedRect(cx + 12 * s, cy - 11 * s, 52 * s, 22 * s, 4 * s);
  g.fillStyle(0xb0b0c0, 0.6);
  g.fillRect(cx + 18 * s, cy - 7 * s, 38 * s, 4 * s);
  g.fillRect(cx + 18 * s, cy + 1 * s, 38 * s, 4 * s);

  g.fillStyle(0xa8c8e8, 0.75);
  g.fillCircle(cx + 2 * s, cy - 20 * s, 9 * s);
  g.lineStyle(1, 0xddddff, 0.8);
  g.strokeCircle(cx + 2 * s, cy - 20 * s, 9 * s);

  g.fillStyle(0xccccdd, 1);
  g.fillRoundedRect(cx + 68 * s, cy - 12 * s, 28 * s, 24 * s, 4 * s);

  g.lineStyle(2 * s, 0x888899, 0.8);
  g.lineBetween(cx - 30 * s, cy + 14 * s, cx - 10 * s, cy + 28 * s);
  g.fillStyle(0xaaaaaa, 0.9);
  g.fillCircle(cx - 10 * s, cy + 28 * s, 3 * s);
}

function drawIssBackground(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
): void {
  drawEarthHorizon(g, width, height);

  const cx = width * 0.5;
  const cy = height * 0.3;
  const scale = width / 390;

  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(cx, cy, 200 * scale, 40 * scale);

  drawIssStation(g, cx, cy, scale);
}

function drawCeres(g: Phaser.GameObjects.Graphics, px: number, py: number, r: number): void {
  g.fillStyle(0x778899, 0.25);
  g.fillCircle(px, py, r + 12);
  g.fillStyle(0x778899, 0.92);
  g.fillCircle(px, py, r);

  g.fillStyle(0x5a6670, 0.45);
  g.fillCircle(px - r * 0.35, py + r * 0.15, r * 0.18);
  g.fillCircle(px + r * 0.25, py - r * 0.2, r * 0.12);
  g.fillCircle(px + r * 0.05, py + r * 0.35, r * 0.09);

  g.fillStyle(0xffffff, 0.1);
  g.fillCircle(px - r * 0.28, py - r * 0.3, r * 0.22);
}

function drawDawnSolarWing(
  g: Phaser.GameObjects.Graphics,
  startX: number,
  y: number,
  scale: number,
  flip: boolean,
): void {
  const dir = flip ? -1 : 1;
  const mastLen = 58 * scale;

  g.lineStyle(2 * scale, 0x999999, 0.9);
  g.lineBetween(startX, y, startX + dir * mastLen, y);

  for (let i = 0; i < 5; i++) {
    const panelX = startX + dir * (6 + i * 11) * scale;
    g.fillStyle(0x777777, 0.95);
    g.fillRect(panelX - 5 * scale, y - 22 * scale, 10 * scale, 44 * scale);
    g.fillStyle(0x3a5a8a, 0.88);
    g.fillRect(panelX - 4 * scale, y - 20 * scale, 8 * scale, 40 * scale);
    g.fillStyle(0xd4a843, 0.75);
    g.fillRect(panelX - 3 * scale, y - 18 * scale, 6 * scale, 36 * scale);
    g.lineStyle(1, 0xdddddd, 0.45);
    g.strokeRect(panelX - 4 * scale, y - 20 * scale, 8 * scale, 40 * scale);
  }
}

function drawDawnSpacecraft(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  scale: number,
): void {
  const s = scale;

  drawDawnSolarWing(g, cx - 52 * s, cy, s, true);
  drawDawnSolarWing(g, cx + 52 * s, cy, s, false);

  g.fillStyle(0x8899aa, 0.95);
  g.fillRect(cx - 48 * s, cy - 2.5 * s, 96 * s, 5 * s);
  g.lineStyle(1, 0xbbbbcc, 0.7);
  g.strokeRect(cx - 48 * s, cy - 2.5 * s, 96 * s, 5 * s);

  g.fillStyle(0xaabbcc, 1);
  g.fillRoundedRect(cx - 14 * s, cy - 12 * s, 28 * s, 24 * s, 4 * s);
  g.fillStyle(0x778899, 0.55);
  g.fillRect(cx - 10 * s, cy - 8 * s, 6 * s, 16 * s);
  g.fillRect(cx + 2 * s, cy - 8 * s, 6 * s, 16 * s);

  g.fillStyle(0x6688aa, 0.9);
  g.fillRect(cx - 52 * s, cy - 3 * s, 6 * s, 6 * s);
  g.fillRect(cx + 46 * s, cy - 3 * s, 6 * s, 6 * s);

  g.fillStyle(0x88aacc, 0.85);
  g.fillCircle(cx, cy - 18 * s, 7 * s);
  g.lineStyle(1.5 * s, 0xccddee, 0.75);
  g.strokeCircle(cx, cy - 18 * s, 7 * s);

  g.fillStyle(0x99bbdd, 0.6);
  g.fillCircle(cx + 22 * s, cy + 2 * s, 3 * s);
  g.fillStyle(0xaaddff, 0.35);
  g.fillEllipse(cx + 30 * s, cy + 2 * s, 10 * s, 4 * s);
}

function drawDawnBackground(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
): void {
  const ceresR = width * 0.22;
  const ceresX = width * 0.78;
  const ceresY = height * 0.42;
  drawCeres(g, ceresX, ceresY, ceresR);

  const cx = width * 0.38;
  const cy = height * 0.28;
  const scale = width / 390;

  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(cx, cy, 180 * scale, 32 * scale);

  drawDawnSpacecraft(g, cx, cy, scale);
}

function drawIoCloseup(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  drawCloseupBody(g, x, y, r, 0xff8844, 8);
  g.fillStyle(0xcc4422, 0.5);
  g.fillCircle(x - r * 0.22, y + r * 0.12, r * 0.16);
  g.fillCircle(x + r * 0.28, y - r * 0.18, r * 0.12);
  g.fillStyle(0xffcc44, 0.35);
  g.fillEllipse(x + r * 0.08, y + r * 0.28, r * 0.42, r * 0.22);
  g.fillStyle(0xaa3311, 0.4);
  g.fillCircle(x - r * 0.08, y - r * 0.32, r * 0.09);
}

function drawEuropaCloseup(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  drawCloseupBody(g, x, y, r, 0xc8e8f8, 8);
  g.lineStyle(1.2, 0x6688aa, 0.5);
  g.lineBetween(x - r * 0.55, y - r * 0.2, x + r * 0.5, y + r * 0.08);
  g.lineBetween(x - r * 0.35, y + r * 0.35, x + r * 0.42, y - r * 0.28);
  g.lineBetween(x - r * 0.15, y - r * 0.55, x + r * 0.1, y + r * 0.52);
  g.lineStyle(1, 0x88aacc, 0.4);
  g.lineBetween(x - r * 0.48, y + r * 0.12, x + r * 0.38, y + r * 0.32);
  g.fillStyle(0xffffff, 0.18);
  g.fillCircle(x - r * 0.2, y - r * 0.22, r * 0.2);
}

function drawGanymedeCloseup(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  drawCloseupBody(g, x, y, r, 0x8899aa, 8);
  g.fillStyle(0xaa9977, 0.35);
  g.fillEllipse(x - r * 0.12, y + r * 0.08, r * 0.7, r * 0.5);
  g.fillStyle(0x667788, 0.4);
  g.fillEllipse(x + r * 0.22, y - r * 0.18, r * 0.48, r * 0.36);
  drawCraters(g, x, y, r, [
    { ox: -0.28, oy: -0.22, size: 0.1 },
    { ox: 0.32, oy: 0.18, size: 0.08 },
    { ox: 0.05, oy: 0.38, size: 0.07 },
  ], 0x556677, 0.45);
}

function drawCallistoCloseup(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  drawCloseupBody(g, x, y, r, 0x776655, 8);
  drawCraters(g, x, y, r, [
    { ox: -0.32, oy: 0.08, size: 0.16 },
    { ox: 0.22, oy: -0.24, size: 0.12 },
    { ox: 0.08, oy: 0.36, size: 0.1 },
    { ox: -0.12, oy: -0.4, size: 0.08 },
    { ox: 0.4, oy: 0.16, size: 0.07 },
    { ox: -0.42, oy: -0.18, size: 0.06 },
    { ox: 0.18, oy: 0.08, size: 0.09 },
  ], 0x554433, 0.5);
}

function drawGalileanBackground(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
): void {
  drawIoCloseup(g, width * 0.28, height * 0.28, width * 0.11);
  drawEuropaCloseup(g, width * 0.72, height * 0.26, width * 0.1);
  drawGanymedeCloseup(g, width * 0.32, height * 0.52, width * 0.14);
  drawCallistoCloseup(g, width * 0.7, height * 0.55, width * 0.12);
}

function drawMoonBody(
  g: Phaser.GameObjects.Graphics,
  px: number,
  py: number,
  r: number,
  glowPad = 12,
): void {
  drawCloseupBody(g, px, py, r, 0x888899, glowPad);

  g.fillStyle(0x6a6a7a, 0.42);
  g.fillEllipse(px - r * 0.18, py - r * 0.08, r * 0.72, r * 0.5);
  g.fillEllipse(px + r * 0.28, py + r * 0.22, r * 0.46, r * 0.34);

  drawCraters(g, px, py, r, [
    { ox: -0.38, oy: 0.12, size: 0.16 },
    { ox: 0.22, oy: -0.28, size: 0.13 },
    { ox: 0.08, oy: 0.38, size: 0.1 },
    { ox: -0.12, oy: -0.42, size: 0.08 },
    { ox: 0.42, oy: 0.08, size: 0.09 },
    { ox: -0.48, oy: -0.22, size: 0.07 },
    { ox: 0.32, oy: 0.42, size: 0.06 },
    { ox: -0.02, oy: 0.08, size: 0.11 },
    { ox: 0.52, oy: -0.18, size: 0.05 },
  ], 0x5a5a68, 0.5);

  g.fillStyle(0xaaaaaa, 0.18);
  g.fillCircle(px - r * 0.38, py + r * 0.12, r * 0.07);
  g.fillCircle(px + r * 0.22, py - r * 0.28, r * 0.05);
}

function drawEarthCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);

  g.fillStyle(0x1a4080, 0.3);
  g.fillCircle(px, py, r + 16);
  g.fillStyle(0x1e5a9a, 0.95);
  g.fillCircle(px, py, r);

  g.fillStyle(0x2a8a55, 0.78);
  g.fillEllipse(px - r * 0.28, py - r * 0.06, r * 0.9, r * 0.52);
  g.fillStyle(0x3aa060, 0.62);
  g.fillEllipse(px + r * 0.24, py + r * 0.2, r * 0.58, r * 0.4);
  g.fillEllipse(px + r * 0.04, py - r * 0.44, r * 0.3, r * 0.18);
  g.fillStyle(0x2a8a55, 0.55);
  g.fillEllipse(px - r * 0.5, py + r * 0.34, r * 0.24, r * 0.16);
  g.fillEllipse(px + r * 0.42, py - r * 0.08, r * 0.2, r * 0.14);
  g.fillStyle(0x3aa060, 0.5);
  g.fillCircle(px - r * 0.08, py + r * 0.48, r * 0.08);

  g.fillStyle(0x88ccff, 0.16);
  g.fillCircle(px - r * 0.26, py - r * 0.32, r * 0.34);

  g.lineStyle(3, 0xaaddff, 0.38);
  g.strokeCircle(px, py, r);
  g.lineStyle(2, 0x88ccff, 0.16);
  g.strokeCircle(px, py, r + 7);

  const moonR = r * 0.32;
  drawMoonBody(g, px - r * 1.28, py - r * 0.62, moonR, 8);
}

function drawMoonCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawMoonBody(g, px, py, r);
}

function drawVenusCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);

  g.fillStyle(0xcc8833, 0.22);
  g.fillCircle(px, py, r + 18);
  g.fillStyle(0xcc8833, 0.92);
  g.fillCircle(px, py, r);

  g.fillStyle(0xffdd99, 0.3);
  g.fillEllipse(px, py - r * 0.28, r * 1.72, r * 0.4);
  g.fillStyle(0xffeeaa, 0.24);
  g.fillEllipse(px + r * 0.08, py - r * 0.02, r * 1.68, r * 0.34);
  g.fillStyle(0xeeaa55, 0.22);
  g.fillEllipse(px - r * 0.06, py + r * 0.26, r * 1.62, r * 0.38);
  g.fillStyle(0xfff6cc, 0.2);
  g.fillEllipse(px - r * 0.04, py - r * 0.52, r * 1.28, r * 0.24);
  g.fillStyle(0xdd9944, 0.18);
  g.fillEllipse(px + r * 0.1, py + r * 0.5, r * 1.2, r * 0.22);

  g.fillStyle(0xffcc88, 0.18);
  g.fillCircle(px, py, r + 10);
  g.lineStyle(8, 0xffddaa, 0.2);
  g.strokeCircle(px, py, r);
  g.fillStyle(0xffffff, 0.1);
  g.fillCircle(px - r * 0.26, py - r * 0.32, r * 0.28);
}

function drawMercuryCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawSun(g, width * 0.9, height * 0.13, 28);
  drawCloseupBody(g, px, py, r, 0x998877);

  drawCraters(g, px, py, r, [
    { ox: -0.32, oy: -0.18, size: 0.18 },
    { ox: 0.28, oy: 0.12, size: 0.14 },
    { ox: 0.06, oy: 0.4, size: 0.1 },
    { ox: -0.08, oy: -0.42, size: 0.09 },
    { ox: 0.42, oy: -0.22, size: 0.08 },
    { ox: -0.46, oy: 0.22, size: 0.07 },
    { ox: 0.18, oy: -0.08, size: 0.11 },
    { ox: -0.18, oy: 0.28, size: 0.06 },
    { ox: 0.48, oy: 0.32, size: 0.05 },
  ], 0x554433, 0.48);
}

function drawPhobos(g: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
  g.fillStyle(0x886655, 0.95);
  g.fillEllipse(x, y, size * 2.3, size * 1.45);
  g.fillCircle(x + size * 0.32, y - size * 0.12, size * 0.58);
  g.fillStyle(0x554433, 0.5);
  g.fillCircle(x - size * 0.18, y + size * 0.05, size * 0.28);
  g.fillStyle(0xffffff, 0.12);
  g.fillCircle(x - size * 0.28, y - size * 0.22, size * 0.22);
}

function drawDeimos(g: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
  g.fillStyle(0x998866, 0.95);
  g.fillCircle(x, y, size);
  g.fillStyle(0x776655, 0.4);
  g.fillCircle(x + size * 0.22, y + size * 0.16, size * 0.32);
  g.fillStyle(0xffffff, 0.16);
  g.fillCircle(x - size * 0.25, y - size * 0.25, size * 0.3);
}

function drawMarsCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawCloseupBody(g, px, py, r, 0xcc4422);

  g.fillStyle(0xaa3318, 0.4);
  g.fillEllipse(px + r * 0.12, py + r * 0.08, r * 0.85, r * 0.7);
  g.fillStyle(0xff8866, 0.28);
  g.fillCircle(px - r * 0.22, py - r * 0.18, r * 0.32);

  g.fillStyle(0x8a2210, 0.45);
  g.fillEllipse(px - r * 0.08, py + r * 0.06, r * 0.95, r * 0.1);

  g.fillStyle(0xe8e8ee, 0.7);
  g.fillEllipse(px, py - r * 0.78, r * 0.42, r * 0.18);
  g.fillStyle(0xd0d4dc, 0.35);
  g.fillEllipse(px + r * 0.04, py + r * 0.82, r * 0.22, r * 0.1);

  drawPhobos(g, px - r * 0.92, py - r * 0.58, 11);
  drawDeimos(g, px - r * 1.38, py - r * 0.08, 6);
}

function drawVestaCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);

  g.fillStyle(0xaa6644, 0.25);
  g.fillEllipse(px, py, (r + 12) * 1.18, (r + 12) * 0.9);
  g.fillStyle(0xaa6644, 0.92);
  g.fillEllipse(px, py, r * 1.18, r * 0.9);

  g.fillStyle(0x7a4430, 0.5);
  g.fillEllipse(px + r * 0.04, py + r * 0.42, r * 0.58, r * 0.4);
  g.fillStyle(0x5a3322, 0.38);
  g.fillEllipse(px + r * 0.04, py + r * 0.46, r * 0.28, r * 0.22);

  drawCraters(g, px, py, r, [
    { ox: -0.28, oy: -0.18, size: 0.1 },
    { ox: 0.32, oy: -0.12, size: 0.08 },
    { ox: -0.08, oy: 0.08, size: 0.07 },
  ], 0x6a3a28, 0.42);

  g.fillStyle(0xffffff, 0.1);
  g.fillEllipse(px - r * 0.28, py - r * 0.28, r * 0.42, r * 0.28);
}

function drawPallasCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawCloseupBody(g, px, py, r, 0x556688, 10);

  drawCraters(g, px, py, r, [
    { ox: -0.3, oy: 0.1, size: 0.14 },
    { ox: 0.24, oy: -0.22, size: 0.11 },
    { ox: 0.08, oy: 0.36, size: 0.09 },
    { ox: -0.12, oy: -0.38, size: 0.07 },
    { ox: 0.4, oy: 0.18, size: 0.06 },
  ], 0x7788aa, 0.4);
}

function drawCeresCloseup(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
  const ceresR = width * 0.22;
  const ceresX = width * 0.78;
  const ceresY = height * 0.42;
  drawCeres(g, ceresX, ceresY, ceresR);
}

function drawBeltEntryBackground(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
): void {
  g.fillStyle(0x665544, 0.1);
  g.fillRect(width * 0.55, 0, width * 0.45, height);
  g.fillStyle(0x443322, 0.08);
  g.fillEllipse(width * 0.88, height * 0.5, width * 0.55, height * 0.95);

  drawBackgroundAsteroidField(g, width, height, BELT_ASTEROID_COUNTS.beltEntry, 61, {
    xMin: 0.55,
    xMax: 1,
    yMin: 0.05,
    yMax: 0.95,
  });
}

function drawBeltFinaleBackground(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
): void {
  drawBackgroundAsteroidField(g, width, height, BELT_ASTEROID_COUNTS.beltFinale, 105);
}

function drawJupiterCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawCloseupBody(g, px, py, r, 0xcc8844, 14);

  g.fillStyle(0xb87238, 0.45);
  g.fillEllipse(px, py - r * 0.28, r * 1.78, r * 0.22);
  g.fillStyle(0xe8c888, 0.28);
  g.fillEllipse(px, py - r * 0.08, r * 1.82, r * 0.18);
  g.fillStyle(0xb87238, 0.4);
  g.fillEllipse(px, py + r * 0.14, r * 1.76, r * 0.2);
  g.fillStyle(0xddaa66, 0.22);
  g.fillEllipse(px, py + r * 0.38, r * 1.58, r * 0.16);
  g.fillStyle(0xaa6622, 0.2);
  g.fillEllipse(px, py - r * 0.48, r * 1.4, r * 0.14);

  g.fillStyle(0xcc5544, 0.88);
  g.fillEllipse(px + r * 0.28, py + r * 0.18, r * 0.44, r * 0.26);
  g.fillStyle(0xaa3322, 0.4);
  g.fillEllipse(px + r * 0.3, py + r * 0.18, r * 0.24, r * 0.14);

  g.fillStyle(0xffffff, 0.1);
  g.fillCircle(px - r * 0.28, py - r * 0.32, r * 0.28);

  drawSatelliteMoon(g, px - r * 1.18, py - r * 0.72, 8, 0xff6644);
  drawSatelliteMoon(g, px - r * 1.45, py - r * 0.22, 8, 0xaaddff);
  drawSatelliteMoon(g, px - r * 1.32, py + r * 0.22, 12, 0x8899aa);
  drawSatelliteMoon(g, px - r * 1.08, py + r * 0.68, 10, 0x776655);
}

function drawSaturnCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawSaturnRings(g, px, py, r, false);
  drawCloseupBody(g, px, py, r, 0xddbb88, 10);

  g.fillStyle(0xc8a060, 0.32);
  g.fillEllipse(px, py - r * 0.18, r * 1.72, r * 0.18);
  g.fillStyle(0xeeddcc, 0.22);
  g.fillEllipse(px, py + r * 0.08, r * 1.7, r * 0.16);
  g.fillStyle(0xb89458, 0.22);
  g.fillEllipse(px, py + r * 0.32, r * 1.5, r * 0.14);

  drawSaturnRings(g, px, py, r, true);

  drawSatelliteMoon(g, px - r * 1.42, py - r * 0.12, 14, 0xaa7744);
  drawSatelliteMoon(g, px - r * 1.08, py - r * 0.72, 8, 0xccbbaa);
  drawSatelliteMoon(g, px - r * 0.55, py - r * 1.05, 7, 0x998877);
  drawSatelliteMoon(g, px - r * 1.22, py + r * 0.48, 6, 0xbbbbaa);
  drawSatelliteMoon(g, px - r * 0.82, py + r * 0.88, 6, 0xccccdd);
  drawSatelliteMoon(g, px - r * 1.55, py + r * 0.28, 5, 0xddeeff);
  drawSatelliteMoon(g, px - r * 0.95, py - r * 0.42, 4, 0xaaa899);
}

function drawTitanCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  g.fillStyle(0xaa7744, 0.18);
  g.fillCircle(px, py, r + 24);
  g.fillStyle(0xaa7744, 0.92);
  g.fillCircle(px, py, r);
  g.fillStyle(0xcc9944, 0.22);
  g.fillCircle(px, py, r + 14);
  g.lineStyle(12, 0xddaa66, 0.22);
  g.strokeCircle(px, py, r);
  g.lineStyle(6, 0xffcc88, 0.14);
  g.strokeCircle(px, py, r + 8);
  g.fillStyle(0xffddaa, 0.1);
  g.fillCircle(px - r * 0.24, py - r * 0.3, r * 0.3);
}

function drawUranusCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawCloseupBody(g, px, py, r, 0x66bbcc, 12);

  g.fillStyle(0x88ddff, 0.22);
  g.fillEllipse(px - r * 0.2, py, r * 0.3, r * 1.68);
  g.fillStyle(0x4aa8b8, 0.26);
  g.fillEllipse(px + r * 0.06, py, r * 0.34, r * 1.72);
  g.fillStyle(0x77ccee, 0.18);
  g.fillEllipse(px + r * 0.32, py, r * 0.24, r * 1.52);
  g.fillStyle(0x3a8898, 0.16);
  g.fillEllipse(px - r * 0.42, py, r * 0.18, r * 1.28);

  drawSatelliteMoon(g, px - r * 1.22, py - r * 0.55, 5, 0xccddee, true);
  drawSatelliteMoon(g, px - r * 1.38, py - r * 0.08, 7, 0xbbccdd);
  drawSatelliteMoon(g, px - r * 1.18, py + r * 0.42, 7, 0x556677);
  drawSatelliteMoon(g, px - r * 0.85, py - r * 0.92, 8, 0xaabbbb);
  drawSatelliteMoon(g, px - r * 0.72, py + r * 0.95, 8, 0x99aabb);
}

function drawNeptuneCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawCloseupBody(g, px, py, r, 0x2244aa, 12);

  g.fillStyle(0x3366cc, 0.28);
  g.fillEllipse(px, py - r * 0.22, r * 1.7, r * 0.18);
  g.fillStyle(0x5588ee, 0.2);
  g.fillEllipse(px, py + r * 0.08, r * 1.72, r * 0.16);
  g.fillStyle(0x1a3388, 0.22);
  g.fillEllipse(px, py + r * 0.32, r * 1.5, r * 0.14);

  g.fillStyle(0x0a1844, 0.7);
  g.fillEllipse(px + r * 0.18, py - r * 0.08, r * 0.42, r * 0.26);
  g.fillStyle(0x112266, 0.4);
  g.fillEllipse(px + r * 0.2, py - r * 0.08, r * 0.22, r * 0.14);

  g.fillStyle(0xaaccff, 0.18);
  g.fillEllipse(px - r * 0.2, py + r * 0.42, r * 0.55, r * 0.1);

  drawSatelliteMoon(g, px - r * 1.28, py - r * 0.18, 13, 0xe8c8c0);
}

function drawPlutoCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawCloseupBody(g, px, py, r, 0x998877, 10);

  g.fillStyle(0xccbbaa, 0.55);
  g.fillEllipse(px + r * 0.08, py + r * 0.06, r * 0.72, r * 0.58);
  g.fillStyle(0xaa8870, 0.35);
  g.fillEllipse(px - r * 0.28, py - r * 0.18, r * 0.42, r * 0.32);
  g.fillStyle(0x776655, 0.3);
  g.fillCircle(px + r * 0.32, py - r * 0.28, r * 0.14);

  const charonR = r * 0.5;
  drawCloseupBody(g, px - r * 1.35, py + r * 0.12, charonR, 0x888899, 6);
  g.fillStyle(0x667788, 0.35);
  g.fillEllipse(px - r * 1.35, py + r * 0.18, charonR * 0.7, charonR * 0.45);

  drawSatelliteMoon(g, px - r * 0.95, py - r * 0.85, 3.5, 0xbbccee);
  drawSatelliteMoon(g, px - r * 1.55, py - r * 0.55, 3.2, 0xaabbcc);
  drawSatelliteMoon(g, px - r * 1.62, py + r * 0.62, 2.8, 0x99aabb);
  drawSatelliteMoon(g, px - r * 0.72, py + r * 0.95, 2.5, 0x8899aa);

  const cx = width * 0.34;
  const cy = height * 0.26;
  const scale = width / 390;
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(cx, cy, 150 * scale, 28 * scale);
  drawNewHorizons(g, cx, cy, scale);
}

function drawErisCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawCloseupBody(g, px, py, r, 0xc8c8d4, 10);
  g.fillStyle(0xa8a8b8, 0.3);
  g.fillEllipse(px + r * 0.12, py + r * 0.1, r * 0.7, r * 0.5);
  drawCraters(g, px, py, r, [
    { ox: -0.22, oy: -0.16, size: 0.1 },
    { ox: 0.28, oy: 0.22, size: 0.08 },
  ], 0x889099, 0.35);

  drawSatelliteMoon(g, px - r * 1.32, py - r * 0.28, 7, 0x554466);
}

function drawSednaCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawCloseupBody(g, px, py, r, 0xaa5544, 10);
  g.fillStyle(0x883322, 0.35);
  g.fillEllipse(px + r * 0.1, py + r * 0.12, r * 0.68, r * 0.5);
  g.fillStyle(0xcc7766, 0.28);
  g.fillCircle(px - r * 0.22, py - r * 0.2, r * 0.28);
}

function drawKuiperBackground(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
): void {
  drawBackgroundAsteroidField(g, width, height, ICY_FIELD_COUNT, 116, undefined, ICY_ASTEROID_PALETTE);
}

function drawOortBackground(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
): void {
  drawBackgroundAsteroidField(g, width, height, ICY_FIELD_COUNT, 127, undefined, ICY_ASTEROID_PALETTE);
  drawBackgroundCometField(g, width, height, OORT_COMET_COUNT, 138);
}

function drawRedDwarf(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  g.fillStyle(0xcc2211, 0.16);
  g.fillCircle(x, y, r + 18);
  g.fillStyle(0xcc3322, 0.35);
  g.fillCircle(x, y, r + 8);
  g.fillStyle(0xdd4422, 0.92);
  g.fillCircle(x, y, r);
  g.fillStyle(0xff6644, 0.22);
  g.fillCircle(x - r * 0.2, y - r * 0.22, r * 0.35);
}

function drawYellowDwarf(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  g.fillStyle(0xffaa22, 0.18);
  g.fillCircle(x, y, r + 20);
  g.fillStyle(0xffcc44, 0.42);
  g.fillCircle(x, y, r + 10);
  g.fillStyle(0xffee88, 0.95);
  g.fillCircle(x, y, r);
  g.fillStyle(0xffffff, 0.55);
  g.fillCircle(x - r * 0.18, y - r * 0.2, r * 0.28);
}

function drawOrangeDwarf(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  g.fillStyle(0xcc6622, 0.18);
  g.fillCircle(x, y, r + 16);
  g.fillStyle(0xdd8844, 0.45);
  g.fillCircle(x, y, r + 8);
  g.fillStyle(0xffaa66, 0.94);
  g.fillCircle(x, y, r);
  g.fillStyle(0xffcc88, 0.35);
  g.fillCircle(x - r * 0.2, y - r * 0.22, r * 0.3);
}

function drawWhiteMainSequence(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  g.fillStyle(0x88aacc, 0.2);
  g.fillCircle(x, y, r + 22);
  g.fillStyle(0xaaccff, 0.45);
  g.fillCircle(x, y, r + 12);
  g.fillStyle(0xccddff, 0.96);
  g.fillCircle(x, y, r);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(x - r * 0.16, y - r * 0.18, r * 0.3);
}

function drawWhiteSubgiant(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  g.fillStyle(0x99aabb, 0.2);
  g.fillCircle(x, y, r + 24);
  g.fillStyle(0xccddee, 0.48);
  g.fillCircle(x, y, r + 14);
  g.fillStyle(0xeeeeff, 0.95);
  g.fillCircle(x, y, r);
  g.fillStyle(0xffffff, 0.65);
  g.fillCircle(x - r * 0.18, y - r * 0.2, r * 0.32);
}

function drawWhiteDwarf(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  g.fillStyle(0xaaaacc, 0.22);
  g.fillCircle(x, y, r + 10);
  g.fillStyle(0xddddee, 0.55);
  g.fillCircle(x, y, r + 4);
  g.fillStyle(0xffffff, 0.98);
  g.fillCircle(x, y, r);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(x - r * 0.12, y - r * 0.14, r * 0.35);
}

function drawOrangeGiant(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  g.fillStyle(0xcc6622, 0.22);
  g.fillCircle(x, y, r + 28);
  g.fillStyle(0xdd8844, 0.48);
  g.fillCircle(x, y, r + 14);
  g.fillStyle(0xffaa66, 0.94);
  g.fillCircle(x, y, r);
  g.fillStyle(0xffcc88, 0.28);
  g.fillEllipse(x, y + r * 0.08, r * 1.1, r * 0.92);
  g.fillStyle(0xffddaa, 0.2);
  g.fillCircle(x - r * 0.22, y - r * 0.24, r * 0.34);
}

function drawRedGiant(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  g.fillStyle(0x881100, 0.2);
  g.fillCircle(x, y, r + 36);
  g.fillStyle(0xcc2200, 0.42);
  g.fillCircle(x, y, r + 18);
  g.fillStyle(0xdd3311, 0.94);
  g.fillCircle(x, y, r);
  g.fillStyle(0xff4422, 0.3);
  g.fillEllipse(x, y + r * 0.06, r * 1.08, r * 0.95);
  g.fillStyle(0xff6644, 0.18);
  g.fillCircle(x - r * 0.2, y - r * 0.22, r * 0.32);
}

function drawBrownDwarfL(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  g.fillStyle(0x663311, 0.18);
  g.fillCircle(x, y, r + 14);
  g.fillStyle(0x884422, 0.5);
  g.fillCircle(x, y, r + 6);
  g.fillStyle(0xaa6633, 0.92);
  g.fillCircle(x, y, r);
  g.fillStyle(0xcc8844, 0.25);
  g.fillCircle(x - r * 0.18, y - r * 0.2, r * 0.28);
}

function drawBrownDwarfT(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  g.fillStyle(0x442211, 0.16);
  g.fillCircle(x, y, r + 12);
  g.fillStyle(0x663322, 0.45);
  g.fillCircle(x, y, r + 5);
  g.fillStyle(0x884433, 0.9);
  g.fillCircle(x, y, r);
  g.fillStyle(0xaa6644, 0.2);
  g.fillCircle(x - r * 0.16, y - r * 0.18, r * 0.26);
}

function drawRockyPlanet(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  color: number,
): void {
  drawCloseupBody(g, x, y, r, color, 6);
  g.fillStyle(0x554433, 0.35);
  g.fillCircle(x + r * 0.18, y + r * 0.12, r * 0.22);
  g.fillStyle(0x667755, 0.28);
  g.fillEllipse(x - r * 0.22, y - r * 0.08, r * 0.38, r * 0.24);
}

function drawProximaCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawRedDwarf(g, px, py, r);
  drawRockyPlanet(g, px + r * 1.35, py + r * 0.15, r * 0.28, 0x886655);
}

function drawAlphaCentauriCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawYellowDwarf(g, px - r * 0.35, py, r * 0.88);
  drawOrangeDwarf(g, px + r * 0.55, py + r * 0.08, r * 0.72);
}

function drawBarnardCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawRedDwarf(g, px, py, r);
}

function drawLuhmanCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawBrownDwarfL(g, px - r * 0.3, py, r * 0.82);
  drawBrownDwarfT(g, px + r * 0.55, py + r * 0.1, r * 0.68);
}

function drawWolf359Closeup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawRedDwarf(g, px, py, r);
  g.fillStyle(0xff2200, 0.35);
  g.fillCircle(px + r * 0.42, py - r * 0.55, r * 0.12);
}

function drawSiriusCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawWhiteMainSequence(g, px - r * 0.2, py, r * 0.92);
  drawWhiteDwarf(g, px + r * 1.05, py + r * 0.12, r * 0.22);
}

function drawEpsilonEridaniCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawOrangeDwarf(g, px, py, r);
  drawRockyPlanet(g, px + r * 1.28, py - r * 0.08, r * 0.3, 0x998866);
}

function drawProcyonCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawWhiteSubgiant(g, px - r * 0.15, py, r * 0.9);
  drawWhiteDwarf(g, px + r * 0.95, py + r * 0.15, r * 0.2);
}

function drawVanMaanenCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawWhiteDwarf(g, px, py, r * 0.85);
}

function drawAltairCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  g.fillStyle(0x88aacc, 0.2);
  g.fillEllipse(px, py, (r + 22) * 1.15, r + 22);
  g.fillStyle(0xaaccff, 0.45);
  g.fillEllipse(px, py, (r + 12) * 1.12, r + 12);
  g.fillStyle(0xccddff, 0.96);
  g.fillEllipse(px, py, r * 1.12, r);
  g.fillStyle(0xffffff, 0.65);
  g.fillEllipse(px - r * 0.18, py - r * 0.2, r * 0.34, r * 0.28);
}

function drawVegaCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawWhiteMainSequence(g, px, py, r);
  g.lineStyle(2, 0xddeeff, 0.35);
  g.strokeEllipse(px, py, r * 1.35, r * 0.22);
}

function drawPolluxCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawOrangeGiant(g, px, py, r);
  drawRockyPlanet(g, px + r * 1.22, py + r * 0.18, r * 0.26, 0xaa7755);
}

function drawArcturusCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawOrangeGiant(g, px, py, r);
}

function drawTrappistCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawRedDwarf(g, px, py, r);

  const orbitR = r * 1.55;
  g.lineStyle(1, 0xff6644, 0.18);
  g.strokeCircle(px, py, orbitR);

  const planetColors = [0x886655, 0x776644, 0x998877, 0x665544, 0x887766, 0x776655, 0x998866];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
    const pr = r * (0.1 + (i % 3) * 0.02);
    drawRockyPlanet(
      g,
      px + Math.cos(a) * orbitR,
      py + Math.sin(a) * orbitR,
      pr,
      planetColors[i],
    );
  }
}

function drawCapellaCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawYellowDwarf(g, px - r * 0.22, py - r * 0.08, r * 0.78);
  drawYellowDwarf(g, px + r * 0.28, py + r * 0.06, r * 0.74);
  drawRedDwarf(g, px - r * 1.35, py + r * 0.42, r * 0.28);
  drawRedDwarf(g, px + r * 1.42, py - r * 0.35, r * 0.26);
}

function drawAlderaminCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawWhiteSubgiant(g, px, py, r);
}

function drawCastorCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawWhiteMainSequence(g, px - r * 0.55, py - r * 0.35, r * 0.52);
  drawRedDwarf(g, px - r * 0.18, py - r * 0.28, r * 0.22);
  drawWhiteMainSequence(g, px + r * 0.08, py + r * 0.05, r * 0.42);
  drawRedDwarf(g, px + r * 0.38, py + r * 0.12, r * 0.18);
  drawRedDwarf(g, px - r * 0.12, py + r * 0.62, r * 0.24);
  drawRedDwarf(g, px + r * 0.22, py + r * 0.72, r * 0.22);
}

function drawAldebaranCloseup(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const { px, py, r } = closeupCenter(theme, width, height);
  drawRedGiant(g, px, py, r);
}

function drawGenericPlanet(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: BackgroundTheme,
): void {
  const px = width * theme.planetX;
  const py = height * 0.38;
  const r = theme.planetSize / 2;

  g.fillStyle(theme.planetColor, 0.35);
  g.fillCircle(px, py, r + 8);
  g.fillStyle(theme.planetColor, 0.9);
  g.fillCircle(px, py, r);
  g.fillStyle(0xffffff, 0.12);
  g.fillCircle(px - r * 0.25, py - r * 0.25, r * 0.35);
}

export function applyStoryBackground(
  scene: Phaser.Scene,
  width: number,
  height: number,
  theme: BackgroundTheme,
): StoryBackgroundLayers {
  const sky = scene.add.graphics().setDepth(-3);
  sky.fillGradientStyle(theme.skyTop, theme.skyTop, theme.skyBottom, theme.skyBottom, 1);
  sky.fillRect(0, 0, width, height);

  const planet = scene.add.graphics().setDepth(-2);
  switch (theme.id) {
    case 'iss':
      drawIssBackground(planet, width, height);
      break;
    case 'dawn':
      drawDawnBackground(planet, width, height);
      break;
    case 'galilean':
      drawGalileanBackground(planet, width, height);
      break;
    case 'earth':
      drawEarthCloseup(planet, width, height, theme);
      break;
    case 'moon':
      drawMoonCloseup(planet, width, height, theme);
      break;
    case 'venus':
      drawVenusCloseup(planet, width, height, theme);
      break;
    case 'mercury':
      drawMercuryCloseup(planet, width, height, theme);
      break;
    case 'mars':
      drawMarsCloseup(planet, width, height, theme);
      break;
    case 'beltEntry':
      drawBeltEntryBackground(planet, width, height);
      break;
    case 'vesta':
      drawBackgroundAsteroidField(planet, width, height, BELT_ASTEROID_COUNTS.vesta, 77);
      drawVestaCloseup(planet, width, height, theme);
      break;
    case 'pallas':
      drawBackgroundAsteroidField(planet, width, height, BELT_ASTEROID_COUNTS.pallas, 88);
      drawPallasCloseup(planet, width, height, theme);
      break;
    case 'ceres':
      drawBackgroundAsteroidField(planet, width, height, BELT_ASTEROID_COUNTS.ceres, 99);
      drawCeresCloseup(planet, width, height);
      break;
    case 'beltFinale':
      drawBeltFinaleBackground(planet, width, height);
      break;
    case 'jupiter':
      drawJupiterCloseup(planet, width, height, theme);
      break;
    case 'saturn':
      drawSaturnCloseup(planet, width, height, theme);
      break;
    case 'titan':
      drawTitanCloseup(planet, width, height, theme);
      break;
    case 'uranus':
      drawUranusCloseup(planet, width, height, theme);
      break;
    case 'neptune':
      drawNeptuneCloseup(planet, width, height, theme);
      break;
    case 'kuiper':
      drawKuiperBackground(planet, width, height);
      break;
    case 'pluto':
      drawPlutoCloseup(planet, width, height, theme);
      break;
    case 'eris':
      drawErisCloseup(planet, width, height, theme);
      break;
    case 'sedna':
      drawSednaCloseup(planet, width, height, theme);
      break;
    case 'oort':
      drawOortBackground(planet, width, height);
      break;
    case 'proxima':
      drawProximaCloseup(planet, width, height, theme);
      break;
    case 'alphaCentauri':
      drawAlphaCentauriCloseup(planet, width, height, theme);
      break;
    case 'barnard':
      drawBarnardCloseup(planet, width, height, theme);
      break;
    case 'luhman':
      drawLuhmanCloseup(planet, width, height, theme);
      break;
    case 'wolf359':
      drawWolf359Closeup(planet, width, height, theme);
      break;
    case 'sirius':
      drawSiriusCloseup(planet, width, height, theme);
      break;
    case 'epsilonEridani':
      drawEpsilonEridaniCloseup(planet, width, height, theme);
      break;
    case 'procyon':
      drawProcyonCloseup(planet, width, height, theme);
      break;
    case 'vanMaanen':
      drawVanMaanenCloseup(planet, width, height, theme);
      break;
    case 'altair':
      drawAltairCloseup(planet, width, height, theme);
      break;
    case 'vega':
      drawVegaCloseup(planet, width, height, theme);
      break;
    case 'pollux':
      drawPolluxCloseup(planet, width, height, theme);
      break;
    case 'arcturus':
      drawArcturusCloseup(planet, width, height, theme);
      break;
    case 'trappist':
      drawTrappistCloseup(planet, width, height, theme);
      break;
    case 'capella':
      drawCapellaCloseup(planet, width, height, theme);
      break;
    case 'alderamin':
      drawAlderaminCloseup(planet, width, height, theme);
      break;
    case 'castor':
      drawCastorCloseup(planet, width, height, theme);
      break;
    case 'aldebaran':
      drawAldebaranCloseup(planet, width, height, theme);
      break;
    default:
      if (theme.planetSize > 0) {
        drawGenericPlanet(planet, width, height, theme);
      }
      break;
  }

  return { sky, planet };
}
