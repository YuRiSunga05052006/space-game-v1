import Phaser from 'phaser';
import { initAudio, startMusic } from '../audioManager';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { formatCoinsLabel } from '../coins';
import { getWorld } from '../worlds';
import { isLevelUnlocked } from '../storyProgress';
import { createSolarSystemMap, type SolarSystemMapHandle } from '../ui/SolarSystemMap';
import { createLevelDetailStrip, getHighestUnlockedLevel } from '../ui/LevelDetailStrip';
import { createMenuButton } from '../ui/MenuButtons';
import type { GameMode } from '../gameMode';

interface LevelSelectSceneData {
  worldId?: string;
  mode?: GameMode;
}

const UI_DEPTH = 200;
const MAP_TOP = 118;
const MAP_HEIGHT = 500;
const STRIP_Y = 668;
const BACK_Y = 790;

export class LevelSelectScene extends Phaser.Scene {
  private worldId = 'world1';
  private mode: GameMode = 'story';
  private mapHandle?: SolarSystemMapHandle;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  init(data: LevelSelectSceneData = {}): void {
    this.worldId = data.worldId ?? 'world1';
    this.mode = data.mode ?? 'story';
  }

  create(): void {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0e27)
      .setDepth(0);

    const world = getWorld(this.worldId);
    const headerTitle = world?.title.toUpperCase() ?? 'INNER SOLAR SYSTEM';

    this.add.text(GAME_WIDTH / 2, 48, headerTitle, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '20px',
      fontStyle: '900',
      color: '#00d4ff',
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 32 },
    }).setOrigin(0.5).setDepth(UI_DEPTH).setScrollFactor(0);

    if (world?.subtitle) {
      this.add.text(GAME_WIDTH / 2, 74, world.subtitle, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '11px',
        color: '#667788',
      }).setOrigin(0.5).setDepth(UI_DEPTH).setScrollFactor(0);
    }

    this.add.text(GAME_WIDTH / 2, 96, formatCoinsLabel(), {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '12px',
      color: '#ffcc00',
    }).setOrigin(0.5).setDepth(UI_DEPTH).setScrollFactor(0);

    const initialLevel = getHighestUnlockedLevel(this.worldId);

    const detailStrip = createLevelDetailStrip(this, {
      x: GAME_WIDTH / 2,
      y: STRIP_Y,
      width: GAME_WIDTH - 24,
      worldId: this.worldId,
      initialLevel,
      onPlay: (level, secretId) => this.startLevel(level, secretId),
    });
    detailStrip.container.setDepth(UI_DEPTH).setScrollFactor(0);

    this.mapHandle = createSolarSystemMap(this, {
      viewportX: GAME_WIDTH / 2,
      viewportY: MAP_TOP + MAP_HEIGHT / 2,
      viewportWidth: GAME_WIDTH - 16,
      viewportHeight: MAP_HEIGHT,
      worldId: this.worldId,
      initialLevel,
      onSelectLevel: (level, secretId) => {
        detailStrip.setLevel(level, secretId);
      },
    });

    const { container: backBtn } = createMenuButton(this, {
      label: 'BACK',
      y: BACK_Y,
      color: 0x8899bb,
      onClick: () => this.transitionTo('WorldSelectScene', { mode: this.mode }),
    });
    backBtn.setX(GAME_WIDTH / 2).setDepth(UI_DEPTH).setScrollFactor(0);
  }

  private startLevel(level: number, secretId?: string): void {
    if (!secretId && !isLevelUnlocked(level)) return;
    initAudio();
    startMusic();
    this.transitionTo('GameScene', {
      mode: 'story',
      level,
      worldId: this.worldId,
      secretId,
    });
  }

  private transitionTo(sceneKey: string, data?: object): void {
    this.mapHandle?.destroy();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey, data);
    });
  }
}
