import Phaser from 'phaser';

const TRACK_WIDTH = 220;
const TRACK_HEIGHT = 8;
const THUMB_RADIUS = 10;

export interface VolumeSliderConfig {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export interface VolumeSliderResult {
  container: Phaser.GameObjects.Container;
  setValue: (value: number) => void;
  destroy: () => void;
}

export function createVolumeSlider(
  scene: Phaser.Scene,
  config: VolumeSliderConfig,
): VolumeSliderResult {
  let currentValue = Phaser.Math.Clamp(Math.round(config.value), 0, 100);
  let dragging = false;
  let dragT: number | null = null;

  const container = scene.add.container(0, 0);

  const labelText = scene.add.text(-TRACK_WIDTH / 2, -28, config.label, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '12px',
    fontStyle: '700',
    color: '#8899bb',
  }).setOrigin(0, 0.5);

  const valueText = scene.add.text(TRACK_WIDTH / 2, -28, String(currentValue), {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '12px',
    fontStyle: '700',
    color: '#00d4ff',
  }).setOrigin(1, 0.5);

  const trackBg = scene.add.graphics();
  const trackFill = scene.add.graphics();
  const thumb = scene.add.graphics();

  const getThumbT = () => dragT ?? currentValue / 100;

  const draw = () => {
    const t = getThumbT();
    const thumbX = -TRACK_WIDTH / 2 + t * TRACK_WIDTH;

    trackBg.clear();
    trackBg.fillStyle(0x1a1f3a, 1);
    trackBg.fillRoundedRect(-TRACK_WIDTH / 2, -TRACK_HEIGHT / 2, TRACK_WIDTH, TRACK_HEIGHT, 4);
    trackBg.lineStyle(1, 0x334466, 0.9);
    trackBg.strokeRoundedRect(-TRACK_WIDTH / 2, -TRACK_HEIGHT / 2, TRACK_WIDTH, TRACK_HEIGHT, 4);

    trackFill.clear();
    if (t > 0) {
      trackFill.fillStyle(0x00d4ff, 0.85);
      trackFill.fillRoundedRect(-TRACK_WIDTH / 2, -TRACK_HEIGHT / 2, TRACK_WIDTH * t, TRACK_HEIGHT, 4);
    }

    thumb.clear();
    thumb.fillStyle(0x00d4ff, 1);
    thumb.fillCircle(thumbX, 0, THUMB_RADIUS);
    thumb.lineStyle(2, 0xffffff, 0.35);
    thumb.strokeCircle(thumbX, 0, THUMB_RADIUS);

    valueText.setText(String(currentValue));
  };

  const valueFromLocalX = (localX: number) => {
    const t = Phaser.Math.Clamp((localX + TRACK_WIDTH / 2) / TRACK_WIDTH, 0, 1);
    return Math.round(t * 100);
  };

  const pointerToTrackX = (pointer: Phaser.Input.Pointer) => {
<<<<<<< Updated upstream
    const centerX = container.getBounds().centerX;
    return pointer.x - centerX;
=======
    return pointer.x - container.x;
>>>>>>> Stashed changes
  };

  const updateFromPointer = (pointer: Phaser.Input.Pointer) => {
    const localX = pointerToTrackX(pointer);
    dragT = Phaser.Math.Clamp((localX + TRACK_WIDTH / 2) / TRACK_WIDTH, 0, 1);
    draw();

    const next = valueFromLocalX(localX);
    if (next !== currentValue) {
      currentValue = next;
      config.onChange(currentValue);
    }
  };

  const setValue = (value: number, notify = true) => {
    dragT = null;
    const next = Phaser.Math.Clamp(Math.round(value), 0, 100);
    const changed = next !== currentValue;
    currentValue = next;
    draw();
    if (notify && changed) config.onChange(currentValue);
  };

  const stopDragging = () => {
    if (!dragging) return;
    dragging = false;
    dragT = null;
    draw();
    scene.input.off('pointermove', onScenePointerMove);
    scene.input.off('pointerup', onScenePointerUp);
  };

  const onScenePointerMove = (pointer: Phaser.Input.Pointer) => {
    if (!dragging) return;
    updateFromPointer(pointer);
  };

  const onScenePointerUp = () => {
    stopDragging();
  };

  container.add([trackBg, trackFill, thumb, labelText, valueText]);
<<<<<<< Updated upstream
  container.setSize(TRACK_WIDTH + THUMB_RADIUS * 2, 40);
  container.setInteractive(
    new Phaser.Geom.Rectangle(
      -TRACK_WIDTH / 2 - THUMB_RADIUS,
      -20,
      TRACK_WIDTH + THUMB_RADIUS * 2,
      40,
=======
  container.setInteractive(
    new Phaser.Geom.Rectangle(
      -TRACK_WIDTH / 2 - THUMB_RADIUS,
      -THUMB_RADIUS,
      TRACK_WIDTH + THUMB_RADIUS * 2,
      THUMB_RADIUS * 2,
>>>>>>> Stashed changes
    ),
    Phaser.Geom.Rectangle.Contains,
  );
  container.input!.cursor = 'pointer';

  container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    dragging = true;
    updateFromPointer(pointer);
    scene.input.on('pointermove', onScenePointerMove);
    scene.input.on('pointerup', onScenePointerUp);
  });

  container.on('wheel', (_pointer: Phaser.Input.Pointer, _dx: number, dy: number) => {
    const step = dy > 0 ? -5 : 5;
    setValue(currentValue + step);
  });

  draw();

  return {
    container,
    setValue: (value: number) => setValue(value, false),
    destroy: () => {
      stopDragging();
      container.destroy();
    },
  };
}
