import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './dimensions';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { ModeSelectScene } from './scenes/ModeSelectScene';
import { WorldSelectScene } from './scenes/WorldSelectScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { EditorHubScene } from './scenes/EditorHubScene';
import { EditorEditScene } from './scenes/EditorEditScene';
import { LaunchCutsceneScene } from './scenes/LaunchCutsceneScene';
import { GameScene } from './scenes/GameScene';

export { GAME_HEIGHT, GAME_WIDTH } from './dimensions';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a0e27',
  dom: {
    createContainer: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  render: {
    roundPixels: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  input: {
    activePointers: 3,
  },
  scene: [
    BootScene,
    MenuScene,
    ModeSelectScene,
    WorldSelectScene,
    LevelSelectScene,
    EditorHubScene,
    EditorEditScene,
    LaunchCutsceneScene,
    GameScene,
  ],
};
