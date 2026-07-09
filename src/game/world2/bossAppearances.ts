import Phaser from 'phaser';
import { getBackgroundTheme } from './backgrounds';

export type BossAppearanceId =
  | 'jovianWarden'
  | 'ringReaver'
  | 'methaneTyrant'
  | 'tiltGuardian'
  | 'neptunianLeviathan'
  | 'kuiperMarauder'
  | 'plutoSentinel'
  | 'erisReaper'
  | 'sednaWraith'
  | 'oortSovereign';

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

function drawRingBody(g: Phaser.GameObjects.Graphics, p: BossAppearancePalette, rings: number): void {
  g.fillStyle(p.hullDark, 1);
  g.fillCircle(CX, CY, 20);
  g.fillStyle(p.hull, 1);
  g.fillCircle(CX, CY, 14);
  for (let i = 0; i < rings; i++) {
    const r = 22 + i * 4;
    g.lineStyle(2, p.trim, 0.7 - i * 0.15);
    g.strokeEllipse(CX, CY + 2, r * 2, r * 0.5);
  }
  g.fillStyle(p.glow, 0.85);
  g.fillCircle(CX, CY - 4, 5);
}

const DRAWERS: Record<BossAppearanceId, (g: Phaser.GameObjects.Graphics, p: BossAppearancePalette) => void> = {
  jovianWarden: (g, p) => {
    g.fillStyle(p.hullDark, 1);
    g.fillEllipse(CX, CY, 46, 38);
    g.fillStyle(p.hull, 1);
    g.fillEllipse(CX, CY - 2, 36, 30);
    g.lineStyle(3, p.trim, 0.9);
    g.strokeEllipse(CX, CY - 2, 36, 30);
    for (let i = -2; i <= 2; i++) {
      g.fillStyle(p.trim, 0.7);
      g.fillEllipse(CX + i * 10, CY + 8, 8, 14);
    }
    g.fillStyle(p.glow, 0.9);
    g.fillCircle(CX, CY - 8, 6);
  },
  ringReaver: (g, p) => drawRingBody(g, p, 3),
  methaneTyrant: (g, p) => {
    g.fillStyle(p.hullDark, 1);
    g.fillRect(CX - 24, CY - 8, 48, 24);
    g.fillStyle(p.hull, 1);
    g.fillRect(CX - 20, CY - 4, 40, 16);
    g.fillStyle(p.trim, 0.85);
    for (let i = 0; i < 5; i++) g.fillCircle(CX - 16 + i * 8, CY + 10, 4);
    g.fillStyle(p.glow, 0.9);
    g.fillCircle(CX, CY - 10, 5);
  },
  tiltGuardian: (g, p) => {
    g.fillStyle(p.hullDark, 1);
    g.fillEllipse(CX, CY + 4, 44, 20);
    g.fillStyle(p.hull, 1);
    g.fillEllipse(CX - 6, CY, 34, 28);
    g.lineStyle(2, p.trim, 0.9);
    g.strokeEllipse(CX - 6, CY, 34, 28);
    g.fillStyle(p.glow, 0.85);
    g.fillCircle(CX - 8, CY - 6, 5);
  },
  neptunianLeviathan: (g, p) => {
    g.fillStyle(p.hullDark, 1);
    g.fillTriangle(CX, CY - 26, CX - 30, CY + 18, CX + 30, CY + 18);
    g.fillStyle(p.hull, 1);
    g.fillTriangle(CX, CY - 20, CX - 24, CY + 12, CX + 24, CY + 12);
    g.lineStyle(3, p.trim, 0.95);
    g.strokeTriangle(CX, CY - 20, CX - 24, CY + 12, CX + 24, CY + 12);
    g.fillStyle(p.trim, 1);
    g.fillRect(CX - 32, CY, 8, 16);
    g.fillRect(CX + 24, CY, 8, 16);
    g.fillStyle(p.glow, 0.9);
    g.fillCircle(CX, CY - 6, 7);
  },
  kuiperMarauder: (g, p) => {
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
  },
  plutoSentinel: (g, p) => {
    g.fillStyle(p.hullDark, 1);
    g.fillCircle(CX, CY, 22);
    g.fillStyle(p.hull, 1);
    g.fillCircle(CX, CY, 16);
    g.lineStyle(3, p.trim, 0.85);
    g.strokeCircle(CX, CY, 16);
    g.fillStyle(p.hullDark, 1);
    g.fillRect(CX - 4, CY - 24, 8, 12);
    g.fillStyle(p.glow, 0.9);
    g.fillCircle(CX, CY - 24, 5);
  },
  erisReaper: (g, p) => {
    g.fillStyle(p.hullDark, 1);
    g.fillTriangle(CX - 10, CY - 20, CX - 26, CY + 14, CX + 10, CY + 14);
    g.fillStyle(p.hull, 1);
    g.fillTriangle(CX, CY - 16, CX - 18, CY + 10, CX + 20, CY + 8);
    g.lineStyle(3, p.trim, 1);
    g.lineBetween(CX + 20, CY - 4, CX + 32, CY + 18);
    g.fillStyle(p.glow, 0.8);
    g.fillCircle(CX - 6, CY, 5);
  },
  sednaWraith: (g, p) => {
    g.fillStyle(p.hull, 1);
    g.fillCircle(CX, CY, 10);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x2 = CX + Math.cos(a) * 22;
      const y2 = CY + Math.sin(a) * 22;
      g.lineStyle(2, p.trim, 0.8);
      g.lineBetween(CX, CY, x2, y2);
      g.fillStyle(p.hullDark, 1);
      g.fillCircle(x2, y2, 5);
    }
    g.fillStyle(p.glow, 0.9);
    g.fillCircle(CX, CY, 4);
  },
  oortSovereign: (g, p) => {
    g.fillStyle(p.hullDark, 1);
    g.fillEllipse(CX, CY + 2, 54, 42);
    g.fillStyle(p.hull, 1);
    g.fillEllipse(CX, CY, 46, 34);
    g.lineStyle(3, p.trim, 0.95);
    g.strokeEllipse(CX, CY, 46, 34);
    g.fillStyle(p.trim, 1);
    g.fillTriangle(CX - 16, CY - 24, CX, CY - 36, CX + 16, CY - 24);
    g.lineStyle(2, p.glow, 0.6);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.lineBetween(CX + Math.cos(a) * 28, CY + Math.sin(a) * 20, CX + Math.cos(a) * 38, CY + Math.sin(a) * 28);
    }
    g.fillStyle(p.core, 0.95);
    g.fillCircle(CX, CY - 28, 5);
  },
};

export function drawBossAppearance(
  g: Phaser.GameObjects.Graphics,
  appearanceId: BossAppearanceId,
  palette: BossAppearancePalette,
): void {
  DRAWERS[appearanceId](g, palette);
}
