import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export abstract class PowerUpPickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
    super(scene, x, y, textureKey);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(12);
    this.setDepth(7);
    this.setVelocity(
      Phaser.Math.Between(-25, 25),
      Phaser.Math.Between(20, 45),
    );

    scene.tweens.add({
      targets: this,
      scale: { from: 0.85, to: 1.15 },
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  static randomSpawnPosition(): { x: number; y: number } {
    return {
      x: Phaser.Math.Between(40, GAME_WIDTH - 40),
      y: Phaser.Math.Between(-60, GAME_HEIGHT * 0.5),
    };
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

export class ShieldPickup extends PowerUpPickup {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'shield-pickup');
  }
}

export class InvisibilityPickup extends PowerUpPickup {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'invisibility-pickup');
  }
}

export class FuelTankPickup extends PowerUpPickup {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'fuel-tank-pickup');
  }
}
