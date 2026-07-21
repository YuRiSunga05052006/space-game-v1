import Phaser from 'phaser';
import { getBackgroundTheme } from './backgrounds';

export type BossAppearanceId =
  | 'proximaRaider'
  | 'alphaWarden'
  | 'barnardHunter'
  | 'luhmanTyrant'
  | 'wolfStriker'
  | 'siriusTyrant'
  | 'epsilonSentinel'
  | 'procyonGuardian'
  | 'vanMaanenPhantom'
  | 'altairSpinner'
  | 'vegaDancer'
  | 'polluxGiant'
  | 'arcturusWarden'
  | 'trappistOverlord'
  | 'capellaReaver'
  | 'alderaminSentinel'
  | 'castorWeaver'
  | 'aldebaranColossus';

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

function drawSpiked(g: Phaser.GameObjects.Graphics, p: BossAppearancePalette): void {
  g.fillStyle(p.hull, 1);
  g.fillCircle(CX, CY, 12);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x2 = CX + Math.cos(a) * 24;
    const y2 = CY + Math.sin(a) * 24;
    g.lineStyle(2, p.trim, 0.8);
    g.lineBetween(CX, CY, x2, y2);
    g.fillStyle(p.hullDark, 1);
    g.fillCircle(x2, y2, 5);
  }
  g.fillStyle(p.glow, 0.9);
  g.fillCircle(CX, CY, 5);
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

function drawColossus(g: Phaser.GameObjects.Graphics, p: BossAppearancePalette): void {
  g.fillStyle(p.hullDark, 1);
  g.fillEllipse(CX, CY + 2, 54, 42);
  g.fillStyle(p.hull, 1);
  g.fillEllipse(CX, CY, 46, 34);
  g.lineStyle(3, p.trim, 0.95);
  g.strokeEllipse(CX, CY, 46, 34);
  g.fillStyle(p.trim, 1);
  g.fillTriangle(CX - 16, CY - 24, CX, CY - 36, CX + 16, CY - 24);
  g.lineStyle(2, p.glow, 0.6);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.lineBetween(CX + Math.cos(a) * 28, CY + Math.sin(a) * 20, CX + Math.cos(a) * 40, CY + Math.sin(a) * 30);
  }
  g.fillStyle(p.core, 0.95);
  g.fillCircle(CX, CY - 28, 6);
}

const DRAWERS: Record<BossAppearanceId, (g: Phaser.GameObjects.Graphics, p: BossAppearancePalette) => void> = {
  proximaRaider: drawCompact,
  alphaWarden: drawTwin,
  barnardHunter: drawAngular,
  luhmanTyrant: drawCompact,
  wolfStriker: drawSpiked,
  siriusTyrant: drawTwin,
  epsilonSentinel: drawWide,
  procyonGuardian: drawCompact,
  vanMaanenPhantom: drawAngular,
  altairSpinner: drawSpiked,
  vegaDancer: drawWide,
  polluxGiant: drawWide,
  arcturusWarden: drawCompact,
  trappistOverlord: drawSpiked,
  capellaReaver: drawTwin,
  alderaminSentinel: drawAngular,
  castorWeaver: drawSpiked,
  aldebaranColossus: drawColossus,
};

export function drawBossAppearance(
  g: Phaser.GameObjects.Graphics,
  appearanceId: BossAppearanceId,
  palette: BossAppearancePalette,
): void {
  DRAWERS[appearanceId](g, palette);
}
