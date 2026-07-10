import Phaser from 'phaser';
import { playSfx } from '../audioManager';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export interface MenuButtonConfig {
  label: string;
  y: number;
  color?: number;
  onClick: () => void;
}

export interface MenuButtonResult {
  container: Phaser.GameObjects.Container;
  destroy: () => void;
}

export function createMenuButton(
  scene: Phaser.Scene,
  config: MenuButtonConfig,
): MenuButtonResult {
  const color = config.color ?? 0x00d4ff;
  const container = scene.add.container(0, config.y);

  const bg = scene.add.graphics();
  const drawBg = (fillAlpha: number, strokeAlpha: number) => {
    bg.clear();
    bg.fillStyle(color, fillAlpha);
    bg.fillRoundedRect(-110, -24, 220, 48, 24);
    bg.lineStyle(2, color, strokeAlpha);
    bg.strokeRoundedRect(-110, -24, 220, 48, 24);
  };

  drawBg(0.15, 0.8);

  const label = scene.add.text(0, 0, config.label, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '18px',
    fontStyle: '700',
    color: `#${color.toString(16).padStart(6, '0')}`,
  }).setOrigin(0.5);

  container.add([bg, label]);
  container.setInteractive(
    new Phaser.Geom.Rectangle(-110, -24, 220, 48),
    Phaser.Geom.Rectangle.Contains,
  );
  container.input!.cursor = 'pointer';

  container.on('pointerover', () => drawBg(0.3, 1));
  container.on('pointerout', () => drawBg(0.15, 0.8));
  container.on('pointerup', (_pointer: Phaser.Input.Pointer) => {
    playSfx('ui');
    config.onClick();
  });

  return {
    container,
    destroy: () => container.destroy(),
  };
}

export function resetMenuButtonHover(container: Phaser.GameObjects.Container): void {
  container.emit('pointerout');
}

export function createMenuOverlay(
  scene: Phaser.Scene,
  title: string,
  buttons: MenuButtonConfig[],
  depth = 200,
  buttonStartY = GAME_HEIGHT / 2 - 60,
): Phaser.GameObjects.Container {
  const root = scene.add.container(GAME_WIDTH / 2, 0);
  root.setScrollFactor(0).setDepth(depth);

  const overlay = scene.add.rectangle(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75);
  root.add(overlay);

  const titleText = scene.add.text(0, GAME_HEIGHT / 2 - 120, title, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '32px',
    fontStyle: '900',
    color: '#00d4ff',
  }).setOrigin(0.5);
  root.add(titleText);

  const startY = buttonStartY;
  const gap = 58;
  buttons.forEach((btn, i) => {
    const { container } = createMenuButton(scene, {
      ...btn,
      y: startY + i * gap,
    });
    root.add(container);
  });

  return root;
}
