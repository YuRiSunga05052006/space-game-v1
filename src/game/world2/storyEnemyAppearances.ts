import Phaser from 'phaser';
import { getBackgroundTheme } from './backgrounds';

export type StoryEnemyAppearanceId =
  | 'jovianDrone'
  | 'ringSkimmer'
  | 'methaneLeech'
  | 'iceDart'
  | 'tritonHunter'
  | 'kuiperStalker'
  | 'frostRaider'
  | 'shadowWeaver'
  | 'sednoidPhantom'
  | 'cometHerald';

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

export function getStoryEnemyAppearancePalette(themeId: string): StoryEnemyAppearancePalette {
  const theme = getBackgroundTheme(themeId);
  return {
    hull: theme.planetColor,
    hullDark: darkenColor(theme.planetColor, 0.5),
    trim: theme.accentColor,
    core: 0xffffff,
    glow: theme.accentColor,
  };
}

const DRAWERS: Record<StoryEnemyAppearanceId, (g: Phaser.GameObjects.Graphics, p: StoryEnemyAppearancePalette) => void> = {
  jovianDrone: (g, p) => {
    g.fillStyle(p.hullDark, 1);
    g.fillCircle(CX, CY, 10);
    g.fillStyle(p.hull, 1);
    g.fillCircle(CX, CY, 7);
    g.lineStyle(2, p.trim, 0.9);
    g.strokeCircle(CX, CY, 10);
    g.fillStyle(p.glow, 0.9);
    g.fillCircle(CX, CY - 2, 3);
  },
  ringSkimmer: (g, p) => {
    g.fillStyle(p.hull, 1);
    g.fillEllipse(CX, CY, 14, 6);
    g.lineStyle(2, p.trim, 0.8);
    g.strokeEllipse(CX, CY, 18, 4);
    g.fillStyle(p.glow, 0.9);
    g.fillCircle(CX, CY, 3);
  },
  methaneLeech: (g, p) => {
    g.fillStyle(p.hullDark, 1);
    g.fillEllipse(CX, CY, 12, 16);
    g.fillStyle(p.hull, 1);
    g.fillEllipse(CX, CY - 2, 8, 12);
    g.fillStyle(p.trim, 0.85);
    g.fillCircle(CX, CY - 6, 4);
  },
  iceDart: (g, p) => {
    g.fillStyle(p.trim, 1);
    g.fillTriangle(CX, CY - 14, CX - 5, CY + 10, CX + 5, CY + 10);
    g.fillStyle(p.hull, 1);
    g.fillTriangle(CX, CY - 10, CX - 3, CY + 6, CX + 3, CY + 6);
    g.fillStyle(p.glow, 0.95);
    g.fillCircle(CX, CY - 4, 3);
  },
  tritonHunter: (g, p) => {
    g.fillStyle(p.hullDark, 1);
    g.fillTriangle(CX - 12, CY + 8, CX + 12, CY + 8, CX, CY - 12);
    g.fillStyle(p.hull, 1);
    g.fillTriangle(CX - 8, CY + 4, CX + 8, CY + 4, CX, CY - 8);
    g.fillStyle(p.glow, 0.9);
    g.fillCircle(CX, CY - 2, 4);
  },
  kuiperStalker: (g, p) => {
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
  },
  frostRaider: (g, p) => {
    g.fillStyle(p.hullDark, 1);
    g.fillRect(CX - 12, CY - 4, 24, 10);
    g.fillStyle(p.hull, 1);
    g.fillRect(CX - 10, CY - 6, 20, 8);
    g.fillStyle(p.trim, 1);
    g.fillRect(CX - 2, CY - 12, 4, 8);
    g.fillStyle(p.glow, 0.9);
    g.fillCircle(CX, CY - 12, 3);
  },
  shadowWeaver: (g, p) => {
    g.fillStyle(p.hullDark, 1);
    g.fillCircle(CX, CY, 11);
    g.fillStyle(p.hull, 1);
    g.fillCircle(CX, CY, 8);
    g.lineStyle(2, p.trim, 0.8);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.lineBetween(CX + Math.cos(a) * 5, CY + Math.sin(a) * 5, CX + Math.cos(a) * 13, CY + Math.sin(a) * 13);
    }
    g.fillStyle(p.glow, 0.9);
    g.fillCircle(CX, CY, 3);
  },
  sednoidPhantom: (g, p) => {
    g.fillStyle(p.hullDark, 1);
    g.fillEllipse(CX, CY, 14, 18);
    g.fillStyle(p.hull, 0.7);
    g.fillEllipse(CX, CY - 2, 10, 14);
    g.lineStyle(2, p.glow, 0.7);
    g.strokeEllipse(CX, CY, 14, 18);
    g.fillStyle(p.core, 0.8);
    g.fillCircle(CX - 2, CY - 7, 1.5);
  },
  cometHerald: (g, p) => {
    g.fillStyle(p.trim, 1);
    g.fillCircle(CX + 4, CY - 2, 6);
    g.fillStyle(p.hull, 1);
    g.fillCircle(CX + 4, CY - 2, 4);
    g.fillStyle(p.glow, 0.5);
    g.fillTriangle(CX - 12, CY, CX + 2, CY - 6, CX + 2, CY + 6);
    g.fillStyle(p.glow, 0.3);
    g.fillTriangle(CX - 16, CY, CX - 4, CY - 4, CX - 4, CY + 4);
  },
};

export function drawStoryEnemyAppearance(
  g: Phaser.GameObjects.Graphics,
  appearanceId: StoryEnemyAppearanceId,
  palette: StoryEnemyAppearancePalette,
): void {
  DRAWERS[appearanceId](g, palette);
}
