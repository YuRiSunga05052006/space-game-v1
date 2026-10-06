import Phaser from 'phaser';
import { getBackgroundTheme } from './backgrounds';

export type StoryEnemyAppearanceId =
  | 'hamalSkiff'
  | 'alpheccaScout'
  | 'kausSkiff'
  | 'regulusScout'
  | 'ankaaSkiff'
  | 'southernRaider'
  | 'cursaSkiff'
  | 'algolScout'
  | 'alpheratzScout'
  | 'corCaroliScout'
  | 'alnairSkiff'
  | 'dipperRaider';

export interface StoryEnemyAppearancePalette {
  hull: number;
  hullDark: number;
  trim: number;
  core: number;
  glow: number;
}

const CX = 16;
const CY = 18;

function darkenColor(color: number, factor: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * factor);
  const g = Math.floor(((color >> 8) & 0xff) * factor);
  const b = Math.floor((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

export function getStoryEnemyAppearancePalette(
  themeId: string,
  overrides?: Partial<StoryEnemyAppearancePalette>,
): StoryEnemyAppearancePalette {
  const theme = getBackgroundTheme(themeId);
  const base: StoryEnemyAppearancePalette = {
    hull: theme.planetColor,
    hullDark: darkenColor(theme.planetColor, 0.5),
    trim: theme.accentColor,
    core: 0xffffff,
    glow: theme.accentColor,
  };
  return overrides ? { ...base, ...overrides } : base;
}

function drawDisc(g: Phaser.GameObjects.Graphics, p: StoryEnemyAppearancePalette): void {
  g.fillStyle(p.hullDark, 1);
  g.fillCircle(CX, CY, 10);
  g.fillStyle(p.hull, 1);
  g.fillCircle(CX, CY, 7);
  g.lineStyle(2, p.trim, 0.9);
  g.strokeCircle(CX, CY, 10);
  g.fillStyle(p.glow, 0.9);
  g.fillCircle(CX, CY - 2, 3);
}

function drawDart(g: Phaser.GameObjects.Graphics, p: StoryEnemyAppearancePalette): void {
  g.fillStyle(p.trim, 1);
  g.fillTriangle(CX, CY - 14, CX - 5, CY + 10, CX + 5, CY + 10);
  g.fillStyle(p.hull, 1);
  g.fillTriangle(CX, CY - 10, CX - 3, CY + 6, CX + 3, CY + 6);
  g.fillStyle(p.glow, 0.95);
  g.fillCircle(CX, CY - 4, 3);
}

function drawDiamond(g: Phaser.GameObjects.Graphics, p: StoryEnemyAppearancePalette): void {
  g.fillStyle(p.hullDark, 1);
  g.beginPath();
  g.moveTo(CX, CY - 12);
  g.lineTo(CX + 10, CY);
  g.lineTo(CX, CY + 12);
  g.lineTo(CX - 10, CY);
  g.closePath();
  g.fillPath();
  g.fillStyle(p.glow, 0.9);
  g.fillCircle(CX, CY - 2, 3);
}

function drawTwin(g: Phaser.GameObjects.Graphics, p: StoryEnemyAppearancePalette): void {
  g.fillStyle(p.hull, 1);
  g.fillCircle(CX - 5, CY, 5);
  g.fillCircle(CX + 5, CY, 5);
  g.lineStyle(2, p.trim, 0.8);
  g.lineBetween(CX - 5, CY, CX + 5, CY);
  g.fillStyle(p.glow, 0.9);
  g.fillCircle(CX, CY - 4, 3);
}

function drawCross(g: Phaser.GameObjects.Graphics, p: StoryEnemyAppearancePalette): void {
  g.fillStyle(p.hullDark, 1);
  g.fillRect(CX - 3, CY - 13, 6, 26);
  g.fillRect(CX - 13, CY - 3, 26, 6);
  g.fillStyle(p.hull, 1);
  g.fillRect(CX - 2, CY - 10, 4, 20);
  g.fillRect(CX - 10, CY - 2, 20, 4);
  g.fillStyle(p.glow, 0.95);
  g.fillCircle(CX, CY, 3);
}

function drawDipper(g: Phaser.GameObjects.Graphics, p: StoryEnemyAppearancePalette): void {
  g.fillStyle(p.trim, 0.9);
  g.lineStyle(2, p.trim, 0.8);
  const bowl = [
    { x: CX - 8, y: CY - 6 },
    { x: CX - 2, y: CY - 8 },
    { x: CX + 2, y: CY - 2 },
    { x: CX - 6, y: CY + 1 },
  ];
  for (let i = 0; i < bowl.length; i++) {
    const a = bowl[i];
    const b = bowl[(i + 1) % bowl.length];
    g.lineBetween(a.x, a.y, b.x, b.y);
    g.fillStyle(p.hull, 1);
    g.fillCircle(a.x, a.y, 2.4);
  }
  g.lineBetween(CX + 2, CY - 2, CX + 8, CY + 4);
  g.lineBetween(CX + 8, CY + 4, CX + 12, CY + 10);
  g.fillCircle(CX + 8, CY + 4, 2.2);
  g.fillCircle(CX + 12, CY + 10, 2.6);
  g.fillStyle(p.glow, 0.95);
  g.fillCircle(CX - 2, CY - 8, 1.6);
}

const DRAWERS: Record<StoryEnemyAppearanceId, (g: Phaser.GameObjects.Graphics, p: StoryEnemyAppearancePalette) => void> = {
  hamalSkiff: drawDisc,
  alpheccaScout: drawTwin,
  kausSkiff: drawDart,
  regulusScout: drawDiamond,
  ankaaSkiff: drawDart,
  southernRaider: drawCross,
  cursaSkiff: drawDisc,
  algolScout: drawTwin,
  alpheratzScout: drawDiamond,
  corCaroliScout: drawTwin,
  alnairSkiff: drawDart,
  dipperRaider: drawDipper,
};

export function drawStoryEnemyAppearance(
  g: Phaser.GameObjects.Graphics,
  appearanceId: StoryEnemyAppearanceId,
  palette: StoryEnemyAppearancePalette,
): void {
  DRAWERS[appearanceId](g, palette);
}
