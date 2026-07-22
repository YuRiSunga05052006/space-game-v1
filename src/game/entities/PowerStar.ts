import Phaser from 'phaser';
import {
  clampCollectibleHorizontalBody,
  randomCollectibleSpawnPosition,
} from '../collectibleSpawn';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export const INVINCIBILITY_DURATION = 8000;

export class PowerStar extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'power-star');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(12);
    this.setDepth(7);
    this.setVelocity(
      Phaser.Math.Between(-18, 18),
      Phaser.Math.Between(20, 45),
    );

    scene.tweens.add({
      targets: this,
      scale: { from: 0.85, to: 1.2 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 3000,
      repeat: -1,
    });
  }

  static randomSpawnPosition(): { x: number; y: number } {
    return randomCollectibleSpawnPosition();
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    clampCollectibleHorizontalBody(this);
  }

  isOffScreen(): boolean {
    const margin = 60;
    return (
      this.x < -margin ||
      this.x > GAME_WIDTH + margin ||
      this.y < -margin ||
      this.y > GAME_HEIGHT + margin
    );
  }
}
