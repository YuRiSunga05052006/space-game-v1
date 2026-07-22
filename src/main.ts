import '@fontsource/orbitron/400.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/900.css';
import { initAudio } from './game/audioManager';
import Phaser from 'phaser';
import { gameConfig } from './game/config';

const game = new Phaser.Game(gameConfig);

const refreshScale = () => game.scale.refresh();
window.addEventListener('resize', refreshScale);
window.visualViewport?.addEventListener('resize', refreshScale);

const gameContainer = document.getElementById('game-container');
if (gameContainer) {
  new ResizeObserver(refreshScale).observe(gameContainer);
}

const unlockAudioOnGesture = () => {
  void initAudio();
};
window.addEventListener('pointerdown', unlockAudioOnGesture, { capture: true, once: true });
window.addEventListener('keydown', unlockAudioOnGesture, { capture: true, once: true });

export default game;
