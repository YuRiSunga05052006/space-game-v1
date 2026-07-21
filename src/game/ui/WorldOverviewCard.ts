import Phaser from 'phaser';
import { playSfx } from '../audioManager';
import type { WorldMeta } from '../worlds';
import type { GameMode } from '../gameMode';
import { getBackgroundTheme } from '../levelResolver';
import { isLevel20Complete, isSecretDawnComplete } from '../worldProgress';

const CARD_WIDTH = 170;
const CARD_HEIGHT = 130;

function hexColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function drawWorldIllustration(
  g: Phaser.GameObjects.Graphics,
  world: WorldMeta,
  unlocked: boolean,
): void {
  const alpha = unlocked ? 1 : 0.35;
  const theme = getBackgroundTheme(world.id, world.cardTheme);

  g.fillGradientStyle(
    theme.skyTop,
    theme.skyTop,
    theme.skyBottom,
    theme.skyBottom,
    0.6 * alpha,
  );
  g.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2 + 22, CARD_WIDTH, CARD_HEIGHT - 44, 8);

  switch (world.number) {
    case 1:
      g.fillStyle(0x2266cc, alpha);
      g.fillCircle(-18, 8, 22);
      g.fillStyle(0x33aa66, 0.5 * alpha);
      g.fillCircle(-24, 4, 8);
      g.fillStyle(0x888899, alpha);
      g.fillCircle(28, -12, 8);
      break;
    case 2:
      g.fillStyle(0xcc8844, alpha);
      g.fillCircle(-24, 6, 18);
      g.lineStyle(2, 0xccaa66, 0.7 * alpha);
      g.strokeEllipse(22, 4, 36, 12);
      g.fillStyle(0xddaa66, alpha);
      g.fillCircle(22, 4, 14);
      break;
    case 3:
      g.fillStyle(0xffcc44, alpha);
      g.fillCircle(-22, 2, 12);
      g.lineStyle(1, 0xffdd88, 0.5 * alpha);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.lineBetween(-22 + Math.cos(a) * 14, 2 + Math.sin(a) * 14, -22 + Math.cos(a) * 20, 2 + Math.sin(a) * 20);
      }
      g.fillStyle(0xffaa22, alpha);
      g.fillCircle(24, 6, 16);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.lineBetween(24 + Math.cos(a) * 18, 6 + Math.sin(a) * 18, 24 + Math.cos(a) * 26, 6 + Math.sin(a) * 26);
      }
      break;
    case 4:
    default:
      g.fillStyle(0x443355, 0.4 * alpha);
      g.fillEllipse(0, 8, 90, 50);
      g.fillStyle(0x665577, 0.35 * alpha);
      g.fillEllipse(-10, 4, 60, 35);
      g.fillStyle(0x887799, 0.25 * alpha);
      g.fillEllipse(12, 12, 45, 28);
      break;
  }
}

export interface WorldOverviewCardConfig {
  x: number;
  y: number;
  world: WorldMeta;
  mode?: GameMode;
  onClick?: () => void;
}

export function createWorldOverviewCard(
  scene: Phaser.Scene,
  config: WorldOverviewCardConfig,
): Phaser.GameObjects.Container {
  const { x, y, world, onClick } = config;
  const unlocked = !world.locked;
  const theme = getBackgroundTheme(world.id, world.cardTheme);
  const container = scene.add.container(x, y);

  const bg = scene.add.graphics();
  const drawCard = (strokeAlpha: number) => {
    bg.clear();
    bg.fillStyle(0x0a1020, 0.85);
    bg.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 10);
    bg.lineStyle(2, unlocked ? theme.accentColor : 0x334455, strokeAlpha);
    bg.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 10);
    drawWorldIllustration(bg, world, unlocked);
  };

  drawCard(unlocked ? 0.9 : 0.4);

  const title = scene.add.text(0, -CARD_HEIGHT / 2 + 12, world.title, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '9px',
    fontStyle: '700',
    color: unlocked ? '#ccddee' : '#556677',
    align: 'center',
    wordWrap: { width: CARD_WIDTH - 12 },
  }).setOrigin(0.5);

  const footer = scene.add.text(0, CARD_HEIGHT / 2 - 14, `World ${world.number}`, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '10px',
    fontStyle: '700',
    color: unlocked ? hexColor(theme.accentColor) : '#445566',
  }).setOrigin(0.5);

  container.add([bg, title, footer]);

  if (unlocked && onClick) {
    container.setSize(CARD_WIDTH, CARD_HEIGHT);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => drawCard(1));
    container.on('pointerout', () => drawCard(0.9));
    container.on('pointerup', () => {
      playSfx('ui');
      onClick();
    });
  }

  if (world.locked) {
    const lockLabel = scene.add.text(0, -4, 'LOCKED', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '11px',
      fontStyle: '900',
      color: '#445566',
    }).setOrigin(0.5);
    container.add(lockLabel);

    if (world.id === 'world3') {
      const l20 = isLevel20Complete();
      const dawn = isSecretDawnComplete();
      const orLabel = scene.add.text(0, 10, 'Clear either:', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '7px',
        color: '#667788',
      }).setOrigin(0.5);
      const req1 = scene.add.text(0, 22, `${l20 ? '✓' : '○'} Oort Cloud (Lv 20)`, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '7px',
        color: l20 ? '#66aa66' : '#667788',
      }).setOrigin(0.5);
      const req2 = scene.add.text(0, 34, `${dawn ? '✓' : '○'} Dawn secret`, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '7px',
        color: dawn ? '#66aa66' : '#667788',
      }).setOrigin(0.5);
      container.add([orLabel, req1, req2]);
    }
  }

  return container;
}

export function getWorldOverviewCardWidth(): number {
  return CARD_WIDTH;
}

export function getWorldOverviewCardHeight(): number {
  return CARD_HEIGHT;
}
