import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './dimensions';

/** Inside Player.clampToBounds (x: 20) plus typical pickup radius (~12). */
export const COLLECTIBLE_PLAYABLE_MIN_X = 32;
export const COLLECTIBLE_PLAYABLE_MAX_X = GAME_WIDTH - 32;

const SPAWN_INSET_X = 20;
const SPAWN_MIN_X = COLLECTIBLE_PLAYABLE_MIN_X + SPAWN_INSET_X;
const SPAWN_MAX_X = COLLECTIBLE_PLAYABLE_MAX_X - SPAWN_INSET_X;

export function randomCollectibleSpawnPosition(): { x: number; y: number } {
  return {
    x: Phaser.Math.Between(SPAWN_MIN_X, SPAWN_MAX_X),
    y: Phaser.Math.Between(90, Math.floor(GAME_HEIGHT * 0.42)),
  };
}

/** Keep drifting pickups on-screen horizontally so they stay collectible. */
export function clampCollectibleHorizontalBody(sprite: Phaser.Physics.Arcade.Sprite): void {
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;

  if (sprite.x < COLLECTIBLE_PLAYABLE_MIN_X) {
    sprite.x = COLLECTIBLE_PLAYABLE_MIN_X;
    body.setVelocityX(Math.abs(body.velocity.x));
  } else if (sprite.x > COLLECTIBLE_PLAYABLE_MAX_X) {
    sprite.x = COLLECTIBLE_PLAYABLE_MAX_X;
    body.setVelocityX(-Math.abs(body.velocity.x));
  }
}
