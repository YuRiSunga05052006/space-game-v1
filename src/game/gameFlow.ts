import { updateSurvivalHighScore, getSurvivalHighScore, formatSurvivalHighScoreLabel } from './survivalHighScore';
import type { GameMode } from './gameMode';

export function goToTitleScreen(scene: Phaser.Scene): void {
  scene.time.paused = false;
  scene.tweens.resumeAll();

  scene.cameras.main.fadeOut(300, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    scene.scene.start('MenuScene');
  });
}

export function goToLevelSelect(scene: Phaser.Scene, worldId = 'world1'): void {
  scene.time.paused = false;
  scene.tweens.resumeAll();

  scene.cameras.main.fadeOut(300, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    scene.scene.start('LevelSelectScene', { worldId, mode: 'story' });
  });
}

export function restartGame(
  scene: Phaser.Scene,
  score: number,
  mode: GameMode,
  level: number,
  worldId = 'world1',
  secretId?: string,
): void {
  if (mode === 'survival') {
    updateSurvivalHighScore(score, worldId);
  }
  scene.scene.restart({ mode, level, worldId, secretId });
}

export function saveScoreAndGoToTitle(scene: Phaser.Scene, score: number, mode: GameMode, worldId = 'world1'): void {
  if (mode === 'survival') {
    updateSurvivalHighScore(score, worldId);
  }
  goToTitleScreen(scene);
}

export function formatHighScoreLabel(worldId = 'world1'): string {
  return formatSurvivalHighScoreLabel(worldId);
}

export { getSurvivalHighScore as getHighScore, updateSurvivalHighScore as updateHighScore };
export { quitGame } from './quitGame';
