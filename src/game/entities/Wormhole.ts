import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export class Wormhole extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'wormhole');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(28);
    this.setDepth(8);
    this.setImmovable(true);

    scene.tweens.add({
      targets: this,
      scale: { from: 0.9, to: 1.15 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 4000,
      repeat: -1,
    });
  }

  static randomSpawnPosition(): { x: number; y: number } {
    return {
      x: Phaser.Math.Between(80, GAME_WIDTH - 80),
      y: Phaser.Math.Between(120, GAME_HEIGHT * 0.55),
    };
  }
}
