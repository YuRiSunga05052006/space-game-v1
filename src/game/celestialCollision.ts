import type { Mine } from './entities/Mine';
import type { Player } from './entities/Player';

/** Push a point to sit on the circle boundary (combined radii from center). */
export function pushOutOfCircle(
  x: number,
  y: number,
  cx: number,
  cy: number,
  minDist: number,
): { x: number; y: number } {
  const dx = x - cx;
  const dy = y - cy;
  const distSq = dx * dx + dy * dy;
  const minDistSq = minDist * minDist;
  if (distSq >= minDistSq) return { x, y };

  if (distSq < 1e-6) {
    return { x: cx + minDist, y: cy };
  }

  const dist = Math.sqrt(distSq);
  const scale = minDist / dist;
  return { x: cx + dx * scale, y: cy + dy * scale };
}

export function approximatePlayerRadius(player: Player): number {
  const body = player.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return 16;
  return Math.max(body.halfWidth, body.halfHeight);
}

export function approximateMineRadius(mine: Mine): number {
  const body = mine.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return 12;
  return body.halfWidth;
}

/** Solid body block — ghost / invincible / boost pass through (overlap handles destroy). */
export function shouldPlayerSolidCollideCelestial(player: Player): boolean {
  return !player.isGhostMode() && !player.isInvincible() && !player.isBoosting();
}

/** Armed blue mines cannot pass through planets. */
export function shouldBlueMineSolidCollidePlanet(mine: Mine): boolean {
  return mine.isBlue && mine.isArmed;
}

export function resolveCirclePenetration(
  sprite: Phaser.Physics.Arcade.Sprite,
  cx: number,
  cy: number,
  bodyRadius: number,
  entityRadius: number,
): boolean {
  const minDist = bodyRadius + entityRadius;
  const next = pushOutOfCircle(sprite.x, sprite.y, cx, cy, minDist);
  if (next.x === sprite.x && next.y === sprite.y) return false;

  sprite.setPosition(next.x, next.y);
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (body) {
    const dx = sprite.x - cx;
    const dy = sprite.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;
    const vn = body.velocity.x * nx + body.velocity.y * ny;
    if (vn < 0) {
      body.setVelocity(
        body.velocity.x - nx * vn,
        body.velocity.y - ny * vn,
      );
    }
  }
  return true;
}
