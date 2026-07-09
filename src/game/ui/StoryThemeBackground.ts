import Phaser from 'phaser';
import type { BackgroundTheme } from '../world1/backgrounds';

export interface StoryBackgroundLayers {
  sky: Phaser.GameObjects.Graphics;
  planet: Phaser.GameObjects.Graphics;
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
  if (theme.id === 'iss') {
    drawIssBackground(planet, width, height);
  } else if (theme.planetSize > 0) {
    const px = width * theme.planetX;
    const py = height * 0.38;
    const r = theme.planetSize / 2;

    planet.fillStyle(theme.planetColor, 0.35);
    planet.fillCircle(px, py, r + 8);
    planet.fillStyle(theme.planetColor, 0.9);
    planet.fillCircle(px, py, r);
    planet.fillStyle(0xffffff, 0.12);
    planet.fillCircle(px - r * 0.25, py - r * 0.25, r * 0.35);
  }

  return { sky, planet };
}
