import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { GravitySource } from '../gravityField';
import {
  MOON_GRAVITY_RADIUS,
  MOON_GRAVITY_STRENGTH,
} from './Moon';
import {
  PLANET_GRAVITY_RADIUS,
  PLANET_GRAVITY_STRENGTH,
} from './Planet';

export type GravityFieldSize = 'small' | 'large';

export interface GravityFieldConfig {
  size: GravityFieldSize;
  x: number;
  y: number;
  velocityX?: number;
  velocityY?: number;
}

const FIELD_DATA: Record<
  GravityFieldSize,
  { texture: string; gravityRadius: number; gravityStrength: number }
> = {
  small: {
    texture: 'gravity-field-sm',
    gravityRadius: MOON_GRAVITY_RADIUS,
    gravityStrength: MOON_GRAVITY_STRENGTH,
  },
  large: {
    texture: 'gravity-field-lg',
    gravityRadius: PLANET_GRAVITY_RADIUS,
    gravityStrength: PLANET_GRAVITY_STRENGTH,
  },
};

/** Editor-only gravity zone with no solid body. */
export class GravityField extends Phaser.GameObjects.Sprite implements GravitySource {
  readonly size: GravityFieldSize;
  readonly gravityRadius: number;
  readonly gravityStrength: number;
  private velocityX: number;
  private velocityY: number;

  constructor(scene: Phaser.Scene, config: GravityFieldConfig) {
    const data = FIELD_DATA[config.size];
    super(scene, config.x, config.y, data.texture);

    this.size = config.size;
    this.gravityRadius = data.gravityRadius;
    this.gravityStrength = data.gravityStrength;
    this.velocityX = config.velocityX ?? 0;
    this.velocityY = config.velocityY ?? 0;

    scene.add.existing(this);
    this.setDepth(4);
    this.setAlpha(config.size === 'small' ? 0.55 : 0.45);
  }

  updateField(delta: number): void {
    if (this.velocityX === 0 && this.velocityY === 0) return;
    const dt = delta / 1000;
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
  }

  static randomConfig(size: GravityFieldSize): GravityFieldConfig {
    return {
      size,
      x: Phaser.Math.Between(80, GAME_WIDTH - 80),
      y: Phaser.Math.Between(100, GAME_HEIGHT * 0.55),
      velocityX: 0,
      velocityY: 0,
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
