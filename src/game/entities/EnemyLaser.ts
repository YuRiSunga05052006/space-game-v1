import Phaser from 'phaser';
import { playSfx } from '../audioManager';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export const LASER_DAMAGE = 1;
export const BOSS_SPECIAL_LASER_DAMAGE = 10;
export const LASER_SPEED = 180;

export interface EnemyLaserOptions {
  damage?: number;
  speed?: number;
  isSpecial?: boolean;
}

export type EnemyLaserSprite = Phaser.Physics.Arcade.Sprite;

export function spawnEnemyLaser(
  group: Phaser.Physics.Arcade.Group,
  x: number,
  y: number,
  angle: number,
  options: EnemyLaserOptions = {},
): EnemyLaserSprite | null {
  const laser = group.create(x, y, 'enemy-laser') as EnemyLaserSprite | null;
  if (!laser) return null;

  const isSpecial = options.isSpecial ?? false;
  const damage = options.damage ?? (isSpecial ? BOSS_SPECIAL_LASER_DAMAGE : LASER_DAMAGE);
  const speed = options.speed ?? LASER_SPEED;

  laser.setActive(true);
  laser.setVisible(true);
  laser.setRotation(angle + Math.PI / 2);
  laser.setDepth(isSpecial ? 8 : 7);
  laser.setTexture(isSpecial ? 'boss-special-laser' : 'enemy-laser');
  laser.clearTint();
  laser.setScale(isSpecial ? 1.5 : 1);
  laser.setData('damage', damage);
  laser.setData('isSpecial', isSpecial);

  const body = laser.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  body.setCircle(isSpecial ? 6 : 3);

  laser.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  playSfx('enemyLaser');
  return laser;
}

export function isEnemyLaserOffScreen(laser: EnemyLaserSprite): boolean {
  const margin = 40;
  return (
    laser.x < -margin ||
    laser.x > GAME_WIDTH + margin ||
    laser.y < -margin ||
    laser.y > GAME_HEIGHT + margin
  );
}
