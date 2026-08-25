import Phaser from 'phaser';
import {
  clampCollectibleHorizontalBody,
  randomCollectibleSpawnPosition,
} from '../collectibleSpawn';
import { HEART_HEAL } from './Heart';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export const DEBRIS_ARMOR_GAIN = 2;
export const DEBRIS_HEAL = HEART_HEAL * 2;

/** Overflow HP beyond max becomes armor: 1 pt → 1 armor, 2 → 1, 3 → 2, 4 → 2. */
export function computeSpaceDebrisVitality(
  currentHp: number,
  currentArmor: number,
  maxHp: number,
  maxArmor: number,
): { hp: number; armor: number } {
  const rawHp = currentHp + DEBRIS_HEAL;
  const hp = Math.min(maxHp, rawHp);
  let armor = currentArmor;

  if (rawHp > maxHp) {
    const overflow = rawHp - maxHp;
    armor = Math.min(maxArmor, currentArmor + Math.ceil(overflow / 2));
  }

  return { hp, armor };
}

export class SpaceDebris extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'space-debris');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(10);
    this.setDepth(6);
    this.setVelocity(
      Phaser.Math.Between(-18, 18),
      Phaser.Math.Between(20, 45),
    );

    scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 4200,
      repeat: -1,
    });

    scene.tweens.add({
      targets: this,
      scale: { from: 0.92, to: 1.08 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
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
