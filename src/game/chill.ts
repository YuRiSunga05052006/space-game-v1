import Phaser from 'phaser';

/** How long a chill lasts after an ice hit. */
export const ICE_CHILL_DURATION_MS = 2500;
/** Movement speed while chilled (0.4 = 60% slower). */
export const ICE_CHILL_FACTOR = 0.4;
/** Chance each shot becomes an ice bullet when the upgrade is owned. */
export const ICE_BULLET_CHANCE = 0.35;
export const CHILL_TINT = 0x66ddff;

type ChillSprite = Phaser.Physics.Arcade.Sprite;

export function isChilled(sprite: ChillSprite, time: number): boolean {
  const until = (sprite.getData('chillUntil') as number) ?? 0;
  return time < until;
}

export function getChillFactor(sprite: ChillSprite, time: number): number {
  if (!isChilled(sprite, time)) return 1;
  return (sprite.getData('chillFactor') as number) ?? ICE_CHILL_FACTOR;
}

/** Apply / refresh chill. Ice tint re-applies after brief hit flashes. */
export function applyChill(
  sprite: ChillSprite,
  durationMs = ICE_CHILL_DURATION_MS,
): void {
  if (!sprite.active) return;
  const now = sprite.scene.time.now;
  const prev = (sprite.getData('chillUntil') as number) ?? 0;
  sprite.setData('chillUntil', Math.max(prev, now + durationMs));
  sprite.setData('chillFactor', ICE_CHILL_FACTOR);

  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (body && sprite.getData('chillBaseVx') == null) {
    sprite.setData('chillBaseVx', body.velocity.x);
    sprite.setData('chillBaseVy', body.velocity.y);
  }

  sprite.setTint(CHILL_TINT);
  sprite.scene.time.delayedCall(100, () => {
    if (!sprite.active) return;
    if (isChilled(sprite, sprite.scene.time.now)) {
      sprite.setTint(CHILL_TINT);
    }
  });
}

/**
 * After AI that freshly sets full velocity this frame — scale once (no compounding).
 */
export function applyChillScaleToVelocity(sprite: ChillSprite, time: number): void {
  applyChillAfterAi(sprite, time, { x: true, y: true });
}

/**
 * For drift enemies that do not refresh velocity every frame.
 * Holds slowed velocity from a snapshot; restores when chill ends.
 */
export function applyChillDriftVelocity(sprite: ChillSprite, time: number): void {
  applyChillAfterAi(sprite, time, { x: false, y: false });
}

/**
 * @param refreshed - axes the AI set to full (unscaled) values this frame.
 *   Unrefreshed axes use a snapshot so chill does not compound.
 */
export function applyChillAfterAi(
  sprite: ChillSprite,
  time: number,
  refreshed: { x: boolean; y: boolean },
): void {
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body || !sprite.active) return;

  if (!isChilled(sprite, time)) {
    const bx = sprite.getData('chillBaseVx') as number | null;
    const by = sprite.getData('chillBaseVy') as number | null;
    if (bx != null && !refreshed.x) body.setVelocityX(bx);
    if (by != null && !refreshed.y) body.setVelocityY(by);
    clearExpiredChill(sprite);
    return;
  }

  if (sprite.getData('chillBaseVx') == null) {
    sprite.setData('chillBaseVx', body.velocity.x);
  }
  if (sprite.getData('chillBaseVy') == null) {
    sprite.setData('chillBaseVy', body.velocity.y);
  }

  const f = getChillFactor(sprite, time);
  const vx = refreshed.x
    ? body.velocity.x * f
    : (sprite.getData('chillBaseVx') as number) * f;
  const vy = refreshed.y
    ? body.velocity.y * f
    : (sprite.getData('chillBaseVy') as number) * f;
  body.setVelocity(vx, vy);
}

function clearExpiredChill(sprite: ChillSprite): void {
  if ((sprite.getData('chillUntil') as number) > 0) {
    sprite.setData('chillUntil', 0);
    sprite.setData('chillBaseVx', null);
    sprite.setData('chillBaseVy', null);
    sprite.clearTint();
  }
}
