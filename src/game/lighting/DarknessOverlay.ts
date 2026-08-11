import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../dimensions';

export interface CircleLight {
  x: number;
  y: number;
  radius: number;
  /** 0–1 erase strength (default 1). */
  intensity?: number;
  /**
   * `soft` (default): 4-ring falloff for ships/pickups.
   * `simple`: 2-ring brush for high-count trail particles.
   */
  quality?: 'soft' | 'simple';
}

export interface BeamLight {
  x: number;
  y: number;
  rotation: number;
  length: number;
  halfWidth: number;
  intensity?: number;
}

export interface ExplosionLight {
  x: number;
  y: number;
  radius: number;
  expiresAt: number;
}

/** Depth below HUD (≥100) so darkness never covers UI. */
export const DARKNESS_DEPTH = 80;

export const LIGHT_RADIUS = {
  playerSpotlight: 88,
  playerBeamHalfWidth: 42,
  enemySpotlight: 52,
  enemyBeamHalfWidth: 28,
  panel: 110,
  boss: 120,
  bossBeamHalfWidth: 36,
  faint: 48,
  mine: 42,
  laser: 16,
  firePlume: 40,
  /** Player thruster flame particles (sampled; see Player.collectTrailDarknessLights). */
  trail: 16,
  explosion: 70,
  bigExplosion: 130,
} as const;

/** Distance from (x, y) along `rotation` to the viewport edge (effectively infinite on-screen). */
export function beamLengthToScreenEdge(x: number, y: number, rotation: number): number {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  let t = Number.POSITIVE_INFINITY;

  if (cos > 1e-6) t = Math.min(t, (GAME_WIDTH - x) / cos);
  else if (cos < -1e-6) t = Math.min(t, (0 - x) / cos);

  if (sin > 1e-6) t = Math.min(t, (GAME_HEIGHT - y) / sin);
  else if (sin < -1e-6) t = Math.min(t, (0 - y) / sin);

  if (!Number.isFinite(t) || t < 0) {
    return Math.hypot(GAME_WIDTH, GAME_HEIGHT);
  }
  return t + 2;
}

/**
 * Full-screen obstruction with punch-out lights for dark levels.
 * Uses a RenderTexture filled each frame, then erased by soft circles / beams.
 */
export class DarknessOverlay {
  private readonly scene: Phaser.Scene;
  private readonly rt: Phaser.GameObjects.RenderTexture;
  private readonly brush: Phaser.GameObjects.Graphics;
  private readonly obstructionColor: number;
  private fullIlluminate = false;
  private readonly explosionLights: ExplosionLight[] = [];

  constructor(scene: Phaser.Scene, obstructionColor = 0x000000) {
    this.scene = scene;
    this.obstructionColor = obstructionColor;
    this.rt = scene.add
      .renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DARKNESS_DEPTH);
    this.brush = scene.make.graphics({ x: 0, y: 0 }, false);
  }

  setFullIlluminate(on: boolean): void {
    this.fullIlluminate = on;
  }

  addExplosionLight(x: number, y: number, radius: number, durationMs: number): void {
    this.explosionLights.push({
      x,
      y,
      radius,
      expiresAt: this.scene.time.now + durationMs,
    });
  }

  redraw(circles: CircleLight[], beams: BeamLight[] = []): void {
    if (this.fullIlluminate) {
      this.rt.clear();
      return;
    }

    const now = this.scene.time.now;
    for (let i = this.explosionLights.length - 1; i >= 0; i--) {
      if (this.explosionLights[i].expiresAt <= now) {
        this.explosionLights.splice(i, 1);
      }
    }

    this.rt.clear();
    this.rt.fill(this.obstructionColor, 1);

    this.brush.clear();
    for (const light of circles) {
      const intensity = light.intensity ?? 1;
      if (light.quality === 'simple') {
        this.drawSimpleCircle(light.x, light.y, light.radius, intensity);
      } else {
        this.drawSoftCircle(light.x, light.y, light.radius, intensity);
      }
    }
    for (const light of this.explosionLights) {
      const remaining = Math.max(0, light.expiresAt - now);
      const life = Math.min(1, remaining / 500);
      this.drawSoftCircle(light.x, light.y, light.radius * (0.55 + 0.45 * life), 0.55 + 0.45 * life);
    }
    for (const beam of beams) {
      this.drawBeam(beam);
    }

    this.rt.erase(this.brush);
  }

  destroy(): void {
    this.brush.destroy();
    this.rt.destroy();
    this.explosionLights.length = 0;
  }

  private drawSoftCircle(x: number, y: number, radius: number, intensity: number): void {
    const rings = [
      { scale: 1, alpha: 0.18 * intensity },
      { scale: 0.72, alpha: 0.35 * intensity },
      { scale: 0.48, alpha: 0.55 * intensity },
      { scale: 0.28, alpha: 0.85 * intensity },
    ];
    for (const ring of rings) {
      this.brush.fillStyle(0xffffff, ring.alpha);
      this.brush.fillCircle(x, y, radius * ring.scale);
    }
  }

  /** Cheaper 2-ring punch-out for dense trail sampling. */
  private drawSimpleCircle(x: number, y: number, radius: number, intensity: number): void {
    this.brush.fillStyle(0xffffff, 0.28 * intensity);
    this.brush.fillCircle(x, y, radius);
    this.brush.fillStyle(0xffffff, 0.7 * intensity);
    this.brush.fillCircle(x, y, radius * 0.45);
  }

  private drawBeam(beam: BeamLight): void {
    const intensity = beam.intensity ?? 0.85;
    const cos = Math.cos(beam.rotation);
    const sin = Math.sin(beam.rotation);
    const tipX = beam.x + cos * beam.length;
    const tipY = beam.y + sin * beam.length;
    const perpX = -sin * beam.halfWidth;
    const perpY = cos * beam.halfWidth;

    this.brush.fillStyle(0xffffff, 0.22 * intensity);
    this.brush.fillTriangle(
      beam.x,
      beam.y,
      tipX + perpX,
      tipY + perpY,
      tipX - perpX,
      tipY - perpY,
    );

    this.brush.fillStyle(0xffffff, 0.4 * intensity);
    this.brush.fillTriangle(
      beam.x,
      beam.y,
      tipX + perpX * 0.55,
      tipY + perpY * 0.55,
      tipX - perpX * 0.55,
      tipY - perpY * 0.55,
    );

    this.drawSoftCircle(beam.x + cos * (beam.length * 0.35), beam.y + sin * (beam.length * 0.35), beam.halfWidth * 0.55, 0.35 * intensity);
  }
}
