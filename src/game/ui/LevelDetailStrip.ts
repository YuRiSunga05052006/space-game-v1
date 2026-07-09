import Phaser from 'phaser';
import { isLevelUnlocked, getHighestUnlockedLevelForWorld } from '../storyProgress';
import { getLevelMeta, getBackgroundTheme } from '../levelResolver';
import { getSecretLevel } from '../world1/secretLevels';

export interface LevelDetailStripConfig {
  x: number;
  y: number;
  width: number;
  worldId: string;
  initialLevel: number;
  initialSecretId?: string;
  onPlay: (level: number, secretId?: string) => void;
}

export interface LevelDetailStripHandle {
  container: Phaser.GameObjects.Container;
  setLevel: (level: number, secretId?: string) => void;
}

function hexColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function createPlayButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  onClick: () => void,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const color = 0x00d4ff;
  const bg = scene.add.graphics();

  const drawBg = (fillAlpha: number, strokeAlpha: number) => {
    bg.clear();
    bg.fillStyle(color, fillAlpha);
    bg.fillRoundedRect(-70, -22, 140, 44, 22);
    bg.lineStyle(2, color, strokeAlpha);
    bg.strokeRoundedRect(-70, -22, 140, 44, 22);
  };

  drawBg(0.15, 0.8);

  const label = scene.add.text(0, 0, 'PLAY', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '16px',
    fontStyle: '700',
    color: '#00d4ff',
  }).setOrigin(0.5);

  container.add([bg, label]);
  container.setInteractive(
    new Phaser.Geom.Rectangle(-70, -22, 140, 44),
    Phaser.Geom.Rectangle.Contains,
  );
  container.input!.cursor = 'pointer';
  container.on('pointerover', () => drawBg(0.3, 1));
  container.on('pointerout', () => drawBg(0.15, 0.8));
  container.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    pointer.event.stopPropagation();
    onClick();
  });

  return container;
}

export function createLevelDetailStrip(
  scene: Phaser.Scene,
  config: LevelDetailStripConfig,
): LevelDetailStripHandle {
  const { x, y, width, worldId, initialLevel, initialSecretId, onPlay } = config;
  const container = scene.add.container(x, y);
  let currentLevel = initialLevel;
  let currentSecretId = initialSecretId;
  let playBtn!: Phaser.GameObjects.Container;

  const bg = scene.add.graphics();
  bg.fillStyle(0x0a1020, 0.95);
  bg.fillRoundedRect(-width / 2, -62, width, 124, 10);
  bg.lineStyle(1, 0x334455, 0.7);
  bg.strokeRoundedRect(-width / 2, -62, width, 124, 10);
  container.add(bg);

  const locationText = scene.add.text(-width / 2 + 20, -42, '', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '15px',
    fontStyle: '900',
    color: '#00d4ff',
  });

  const bossText = scene.add.text(-width / 2 + 20, -18, '', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '11px',
    color: '#8899aa',
  });

  const statusText = scene.add.text(-width / 2 + 20, 4, '', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '10px',
    color: '#667788',
  });

  container.add([locationText, bossText, statusText]);

  const updateDisplay = (level: number, secretId?: string) => {
    currentLevel = level;
    currentSecretId = secretId;

    if (secretId) {
      const secret = getSecretLevel(secretId);
      const theme = getBackgroundTheme(worldId, secret?.themeId ?? 'iss');
      locationText.setText(`SECRET · ${(secret?.name ?? 'ISS').toUpperCase()}`);
      locationText.setColor(hexColor(theme.accentColor));
      bossText.setText('No boss — reach warp panel');
      statusText.setText('Ready to launch');
      playBtn.setVisible(true);
      playBtn.setAlpha(1);
      return;
    }

    const meta = getLevelMeta(worldId, level);
    const theme = getBackgroundTheme(worldId, meta.themeId);
    const unlocked = isLevelUnlocked(level);

    locationText.setText(`LEVEL ${level} · ${meta.location.toUpperCase()}`);
    locationText.setColor(unlocked ? hexColor(theme.accentColor) : '#556677');
    bossText.setText(unlocked ? meta.bossName : 'Complete previous levels to unlock');
    statusText.setText(unlocked ? 'Ready to launch' : 'LOCKED');
    playBtn.setVisible(unlocked);
    playBtn.setAlpha(unlocked ? 1 : 0.35);
  };

  playBtn = createPlayButton(scene, width / 2 - 78, 24, () => {
    if (currentSecretId) {
      onPlay(currentLevel, currentSecretId);
      return;
    }
    if (isLevelUnlocked(currentLevel)) {
      onPlay(currentLevel);
    }
  });
  container.add(playBtn);

  updateDisplay(initialLevel, initialSecretId);

  return {
    container,
    setLevel: (level: number, secretId?: string) => {
      updateDisplay(level, secretId);
    },
  };
}

export function getHighestUnlockedLevel(worldId = 'world1'): number {
  return getHighestUnlockedLevelForWorld(worldId);
}
