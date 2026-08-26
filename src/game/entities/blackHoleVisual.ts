import Phaser from 'phaser';

export interface BlackHoleVisualOptions {
  x?: number;
  y?: number;
  depth?: number;
  scale?: number;
}

/** Procedural black hole used by the reset sequence and gameplay BlackHole entity. */
export function createBlackHoleVisual(
  scene: Phaser.Scene,
  options: BlackHoleVisualOptions = {},
): Phaser.GameObjects.Container {
  const x = options.x ?? 0;
  const y = options.y ?? 0;
  const depth = options.depth ?? 0;
  const scale = options.scale ?? 1;

  const root = scene.add.container(x, y).setDepth(depth).setScale(scale);

  const disk = scene.add.ellipse(0, 0, 200, 44, 0xff7722, 0.55);
  const halo = scene.add.circle(0, 0, 92, 0x330044, 0.45);
  const ring = scene.add.circle(0, 0, 72, 0x550066, 0.75);
  const core = scene.add.circle(0, 0, 48, 0x000000, 1);
  const inner = scene.add.circle(0, 0, 28, 0x110011, 1);

  root.add([disk, halo, ring, core, inner]);

  scene.tweens.add({
    targets: disk,
    angle: 360,
    duration: 1800,
    repeat: -1,
    ease: 'Linear',
  });
  scene.tweens.add({
    targets: root,
    angle: -360,
    duration: 4200,
    repeat: -1,
    ease: 'Linear',
  });

  return root;
}
