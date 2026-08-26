import type { Player } from './entities/Player';

export interface GravitySource {
  x: number;
  y: number;
  gravityRadius: number;
  gravityStrength: number;
}

/** Power Star, Invisibility, and boost modes bypass gravity. */
export function isGravityBypassed(player: Player): boolean {
  return player.isInvincible() || player.isGhostMode() || player.isBoosting();
}

export function applyGravitySources(
  player: Player,
  sources: GravitySource[],
  delta: number,
): void {
  if (isGravityBypassed(player)) return;

  const body = player.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;

  const dt = delta / 1000;
  let ax = 0;
  let ay = 0;

  for (const source of sources) {
    const dx = source.x - player.x;
    const dy = source.y - player.y;
    const distSq = dx * dx + dy * dy;
    const radiusSq = source.gravityRadius * source.gravityRadius;
    if (distSq <= 0 || distSq > radiusSq) continue;

    const dist = Math.sqrt(distSq);
    const falloff = 1 - dist / source.gravityRadius;
    const strength = source.gravityStrength * falloff * falloff;
    ax += (dx / dist) * strength;
    ay += (dy / dist) * strength;
  }

  if (ax === 0 && ay === 0) return;

  body.setVelocity(
    body.velocity.x + ax * dt,
    body.velocity.y + ay * dt,
  );
}
