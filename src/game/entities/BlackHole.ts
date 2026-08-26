import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { createBlackHoleVisual } from './blackHoleVisual';
import {
  PLANET_GRAVITY_RADIUS,
  PLANET_GRAVITY_STRENGTH,
} from './Planet';
import type { GravitySource } from '../gravityField';

export interface BlackHoleConfig {
  x: number;
  y: number;
  velocityX?: number;
  velocityY?: number;
}

export class BlackHole extends Phaser.Physics.Arcade.Sprite implements GravitySource {
  readonly gravityRadius = PLANET_GRAVITY_RADIUS;
  readonly gravityStrength = PLANET_GRAVITY_STRENGTH;
  private readonly visual: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: BlackHoleConfig) {
    super(scene, config.x, config.y, 'black-hole-hit');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(40);
    this.setDepth(5);
    this.setVelocity(config.velocityX ?? 0, config.velocityY ?? 0);

    this.visual = createBlackHoleVisual(scene, { depth: 4, scale: 0.42 });
    this.syncVisual();
  }

  private syncVisual(): void {
    this.visual.setPosition(this.x, this.y);
  }

  preUpdate(_time: number, _delta: number): void {
    super.preUpdate(_time, _delta);
    this.syncVisual();
  }

  destroy(fromScene?: boolean): void {
    this.visual.destroy();
    super.destroy(fromScene);
  }

  static randomConfig(): BlackHoleConfig {
    return {
      x: Phaser.Math.Between(80, GAME_WIDTH - 80),
      y: Phaser.Math.Between(80, GAME_HEIGHT * 0.45),
      velocityX: Phaser.Math.Between(-15, 15),
      velocityY: Phaser.Math.Between(10, 30),
    };
  }

  isOffScreen(): boolean {
    const margin = 120;
    return (
      this.x < -margin ||
      this.x > GAME_WIDTH + margin ||
      this.y < -margin ||
      this.y > GAME_HEIGHT + margin
    );
  }
}
