import { updateSurvivalHighScore, getSurvivalHighScore, getBestSurvivalHighScore, formatSurvivalHighScoreLabel } from './survivalHighScore';
import { stopMusic } from './audioManager';
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

export function goToEditorHub(scene: Phaser.Scene, selectedSlot = 0): void {
  scene.time.paused = false;
  scene.tweens.resumeAll();
  stopMusic();

  scene.cameras.main.fadeOut(300, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    scene.scene.start('EditorHubScene', { selectedSlot });
  });
}

export function restartGame(
  scene: Phaser.Scene,
  score: number,
  mode: GameMode,
  level: number,
  worldId = 'world1',
  secretId?: string,
  customSlotIndex?: number,
  customSubAreaId?: string,
): void {
  if (mode === 'survival') {
    updateSurvivalHighScore(score, worldId);
  }
  scene.scene.restart({
    mode,
    level,
    worldId,
    secretId,
    customSlotIndex,
    customSubAreaId,
  });
}

export function saveScoreAndGoToTitle(scene: Phaser.Scene, score: number, mode: GameMode, worldId = 'world1'): void {
  if (mode === 'survival') {
    updateSurvivalHighScore(score, worldId);
  }
  goToTitleScreen(scene);
}

export function formatHighScoreLabel(worldId?: string): string {
  return formatSurvivalHighScoreLabel(worldId);
}

export {
  getSurvivalHighScore as getHighScore,
  getBestSurvivalHighScore,
  updateSurvivalHighScore as updateHighScore,
};
export { quitGame } from './quitGame';
