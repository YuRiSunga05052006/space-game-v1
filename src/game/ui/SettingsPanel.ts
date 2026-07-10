import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import {
  getAutoFire,
  getFireModeLabel,
  getMusicVolume,
  getSoundVolume,
  setMusicVolume,
  setSoundVolume,
  toggleAutoFire,
} from '../settings';
import { createMenuButton } from './MenuButtons';
import { createVolumeSlider } from './VolumeSlider';

export interface SettingsPanelOptions {
  onBack: () => void;
  onAutoFireChange?: (autoFire: boolean) => void;
  onSoundVolumeChange?: (volume: number) => void;
  onMusicVolumeChange?: (volume: number) => void;
}

export interface SettingsPanelResult {
  root: Phaser.GameObjects.Container;
  destroy: () => void;
}

export function createSettingsPanel(
  scene: Phaser.Scene,
  depth: number,
  options: SettingsPanelOptions,
): SettingsPanelResult {
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

  const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, 'SETTINGS', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '32px',
    fontStyle: '900',
    color: '#00d4ff',
  }).setOrigin(0.5);
  root.add(title);

  root.add(
    scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 145, 'Firing mode', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '14px',
      color: '#8899bb',
    }).setOrigin(0.5),
  );

  const modeText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, getFireModeLabel(), {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '20px',
    fontStyle: '700',
    color: '#ffcc00',
  }).setOrigin(0.5);
  root.add(modeText);

  const hint = scene.add.text(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2 - 88,
    getAutoFire() ? 'Ship fires continuously' : 'Press Space or tap FIRE to shoot',
    {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '11px',
      color: '#556677',
      align: 'center',
    },
  ).setOrigin(0.5);
  root.add(hint);

  const { container: toggleBtn } = createMenuButton(scene, {
    label: 'TOGGLE AUTO / MANUAL',
    y: GAME_HEIGHT / 2 - 40,
    color: 0xffcc00,
    onClick: () => {
      const autoFire = toggleAutoFire();
      modeText.setText(getFireModeLabel());
      hint.setText(
        autoFire ? 'Ship fires continuously' : 'Press Space or tap FIRE to shoot',
      );
      options.onAutoFireChange?.(autoFire);
    },
  });
  toggleBtn.setX(GAME_WIDTH / 2);
  root.add(toggleBtn);

  const { container: soundSlider } = createVolumeSlider(scene, {
    label: 'SOUND',
    value: getSoundVolume(),
    clickChannel: 'sound',
    onChange: (volume) => {
      const next = setSoundVolume(volume);
      options.onSoundVolumeChange?.(next);
    },
  });
  soundSlider.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35);
  root.add(soundSlider);

  const { container: musicSlider } = createVolumeSlider(scene, {
    label: 'MUSIC',
    value: getMusicVolume(),
    clickChannel: 'music',
    onChange: (volume) => {
      const next = setMusicVolume(volume);
      options.onMusicVolumeChange?.(next);
    },
  });
  musicSlider.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 105);
  root.add(musicSlider);

  root.add(
    scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 150, 'Drag sliders or scroll to adjust (0–100)', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '10px',
      color: '#445566',
      align: 'center',
    }).setOrigin(0.5),
  );

  const { container: backBtn } = createMenuButton(scene, {
    label: 'BACK',
    y: GAME_HEIGHT / 2 + 205,
    onClick: () => options.onBack(),
  });
  backBtn.setX(GAME_WIDTH / 2);
  root.add(backBtn);

  return {
    root,
    destroy: () => root.destroy(),
  };
}
