import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export class WarpPanel extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'warp-panel');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(24);
    this.setDepth(8);
    this.setImmovable(true);

    scene.tweens.add({
      targets: this,
      alpha: { from: 0.7, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  static randomSpawnPosition(): { x: number; y: number } {
    return {
      x: Phaser.Math.Between(100, GAME_WIDTH - 100),
      y: Phaser.Math.Between(140, GAME_HEIGHT * 0.5),
    };
  }
}
