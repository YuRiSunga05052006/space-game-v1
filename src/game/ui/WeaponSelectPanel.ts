import Phaser from 'phaser';
import { playSfx } from '../audioManager';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { Weapon } from '../weapons';

export interface WeaponSelectPanelOptions {
  weapons: Weapon[];
  onSelect: (weaponId: string) => void;
}

export interface WeaponSelectPanelResult {
  root: Phaser.GameObjects.Container;
  destroy: () => void;
}

function createWeaponCard(
  scene: Phaser.Scene,
  weapon: Weapon,
  y: number,
  onSelect: () => void,
): Phaser.GameObjects.Container {
  const card = scene.add.container(GAME_WIDTH / 2, y);
  const colorHex = `#${weapon.color.toString(16).padStart(6, '0')}`;

  const bg = scene.add.graphics();
  const drawBg = (fillAlpha: number, strokeAlpha: number) => {
    bg.clear();
    bg.fillStyle(0x1a1f3a, fillAlpha);
    bg.fillRoundedRect(-160, -36, 320, 72, 10);
    bg.lineStyle(2, weapon.color, strokeAlpha);
    bg.strokeRoundedRect(-160, -36, 320, 72, 10);
  };
  drawBg(0.9, 0.8);

  const name = scene.add.text(0, -12, weapon.name, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '16px',
    fontStyle: '700',
    color: colorHex,
  }).setOrigin(0.5);

  const desc = scene.add.text(0, 12, weapon.description, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '11px',
    color: '#8899bb',
  }).setOrigin(0.5);

  card.add([bg, name, desc]);
  card.setSize(320, 72);
  card.setInteractive({ useHandCursor: true });

  card.on('pointerover', () => drawBg(1, 1));
  card.on('pointerout', () => drawBg(0.9, 0.8));
  card.on('pointerup', () => {
    playSfx('ui');
    onSelect();
  });

  return card;
}

export function createWeaponSelectPanel(
  scene: Phaser.Scene,
  depth: number,
  options: WeaponSelectPanelOptions,
): WeaponSelectPanelResult {
  const root = scene.add.container(0, 0).setDepth(depth);

  const overlay = scene.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH,
    GAME_HEIGHT,
    0x000000,
    0.85,
  );
  root.add(overlay);

  const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 160, 'WEAPON UPGRADE', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '28px',
    fontStyle: '900',
    color: '#00d4ff',
  }).setOrigin(0.5);
  root.add(title);

  const subtitle = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 125, 'Choose your upgrade', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '12px',
    color: '#556677',
  }).setOrigin(0.5);
  root.add(subtitle);

  const startY = GAME_HEIGHT / 2 - 60;
  const gap = 88;

  options.weapons.forEach((weapon, i) => {
    const card = createWeaponCard(scene, weapon, startY + i * gap, () => {
      options.onSelect(weapon.id);
    });
    root.add(card);
  });

  return {
    root,
    destroy: () => root.destroy(),
  };
}
