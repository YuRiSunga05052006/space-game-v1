import Phaser from 'phaser';
import { getBackgroundTheme } from './backgrounds';

export type BossAppearanceId =
  | 'hamalSentinel'
  | 'alpheccaWarden'
  | 'kausArcher'
  | 'regulusLion'
  | 'ankaaStriker'
  | 'acruxTyrant'
  | 'cursaSentinel'
  | 'algolDemon'
  | 'alpheratzWarden'
  | 'corCaroliGuardian'
  | 'alnairHunter'
  | 'aliothTyrant';

export interface BossAppearancePalette {
  hull: number;
  hullDark: number;
  trim: number;
  core: number;
  glow: number;
}

const CX = 32;
const CY = 34;

function darkenColor(color: number, factor: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * factor);
  const g = Math.floor(((color >> 8) & 0xff) * factor);
  const b = Math.floor((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

export function getBossAppearancePalette(themeId: string): BossAppearancePalette {
  const theme = getBackgroundTheme(themeId);
  return {
    hull: theme.planetColor,
    hullDark: darkenColor(theme.planetColor, 0.5),
    trim: theme.accentColor,
    core: 0xffffff,
    glow: theme.accentColor,
  };
}

function drawCompact(g: Phaser.GameObjects.Graphics, p: BossAppearancePalette): void {
  g.fillStyle(p.hullDark, 1);
  g.fillCircle(CX, CY, 20);
  g.fillStyle(p.hull, 1);
  g.fillCircle(CX, CY, 14);
  g.lineStyle(2, p.trim, 0.9);
  g.strokeCircle(CX, CY, 14);
  g.fillStyle(p.glow, 0.9);
  g.fillCircle(CX, CY - 4, 5);
}

function drawTwin(g: Phaser.GameObjects.Graphics, p: BossAppearancePalette): void {
  g.fillStyle(p.hullDark, 1);
  g.fillCircle(CX - 12, CY, 14);
  g.fillCircle(CX + 12, CY, 14);
  g.fillStyle(p.hull, 1);
  g.fillCircle(CX - 12, CY, 10);
  g.fillCircle(CX + 12, CY, 10);
  g.lineStyle(2, p.trim, 0.9);
  g.lineBetween(CX - 12, CY, CX + 12, CY);
  g.fillStyle(p.glow, 0.9);
  g.fillCircle(CX, CY, 4);
}

function drawAngular(g: Phaser.GameObjects.Graphics, p: BossAppearancePalette): void {
  g.fillStyle(p.hullDark, 1);
  g.beginPath();
  g.moveTo(CX, CY - 18);
  g.lineTo(CX + 20, CY + 12);
  g.lineTo(CX - 20, CY + 12);
  g.closePath();
  g.fillPath();
  g.fillStyle(p.hull, 1);
  g.fillTriangle(CX, CY - 12, CX + 14, CY + 6, CX - 14, CY + 6);
  g.fillStyle(p.glow, 0.9);
  g.fillCircle(CX, CY - 2, 4);
}

function drawCross(g: Phaser.GameObjects.Graphics, p: BossAppearancePalette): void {
  g.fillStyle(p.hullDark, 1);
  g.fillRect(CX - 6, CY - 26, 12, 52);
  g.fillRect(CX - 26, CY - 6, 52, 12);
  g.fillStyle(p.hull, 1);
  g.fillRect(CX - 4, CY - 20, 8, 40);
  g.fillRect(CX - 20, CY - 4, 40, 8);
  g.fillStyle(p.glow, 0.95);
  g.fillCircle(CX, CY, 6);
  g.lineStyle(2, p.trim, 0.85);
  g.strokeCircle(CX, CY, 10);
}

function drawWide(g: Phaser.GameObjects.Graphics, p: BossAppearancePalette): void {
  g.fillStyle(p.hullDark, 1);
  g.fillEllipse(CX, CY, 50, 36);
  g.fillStyle(p.hull, 1);
  g.fillEllipse(CX, CY, 42, 28);
  g.lineStyle(3, p.trim, 0.9);
  g.strokeEllipse(CX, CY, 42, 28);
  g.fillStyle(p.glow, 0.85);
  g.fillCircle(CX, CY - 6, 6);
}

function drawDipper(g: Phaser.GameObjects.Graphics, p: BossAppearancePalette): void {
  g.lineStyle(3, p.trim, 0.9);
  const bowl = [
    { x: CX - 16, y: CY - 8 },
    { x: CX - 4, y: CY - 14 },
    { x: CX + 6, y: CY - 2 },
    { x: CX - 8, y: CY + 6 },
  ];
  for (let i = 0; i < bowl.length; i++) {
    const a = bowl[i];
    const b = bowl[(i + 1) % bowl.length];
    g.lineBetween(a.x, a.y, b.x, b.y);
    g.fillStyle(p.hull, 1);
    g.fillCircle(a.x, a.y, 5);
  }
  g.lineBetween(CX + 6, CY - 2, CX + 16, CY + 8);
  g.lineBetween(CX + 16, CY + 8, CX + 22, CY + 18);
  g.fillCircle(CX + 16, CY + 8, 5);
  g.fillCircle(CX + 22, CY + 18, 6);
  g.fillStyle(p.glow, 0.95);
  g.fillCircle(CX - 4, CY - 14, 3);
}

const DRAWERS: Record<BossAppearanceId, (g: Phaser.GameObjects.Graphics, p: BossAppearancePalette) => void> = {
  hamalSentinel: drawCompact,
  alpheccaWarden: drawTwin,
  kausArcher: drawAngular,
  regulusLion: drawWide,
  ankaaStriker: drawAngular,
  acruxTyrant: drawCross,
  cursaSentinel: drawCompact,
  algolDemon: drawTwin,
  alpheratzWarden: drawWide,
  corCaroliGuardian: drawTwin,
  alnairHunter: drawAngular,
  aliothTyrant: drawDipper,
};

export function drawBossAppearance(
  g: Phaser.GameObjects.Graphics,
  appearanceId: BossAppearanceId,
  palette: BossAppearancePalette,
): void {
  DRAWERS[appearanceId](g, palette);
}
