import Phaser from 'phaser';

export const FIRE_DAMAGE = 1;
export const FIRE_TICK_MS = 2000;
export const FIRE_PLUME_LIFETIME_MS = 1100;
/** Distance from ship center to plume center along aim. */
export const FIRE_PLUME_OFFSET = 48;
export const FIRE_PLUME_LENGTH = 72;
export const FIRE_PLUME_WIDTH = 28;

export interface FirePlumeConfig {
  x: number;
  y: number;
  angle: number;
}

/**
 * Short-lived aimed flame burst. No residue after lifetime ends.
 */
export class FirePlume extends Phaser.Physics.Arcade.Sprite {
  private readonly bornAt: number;
  private flickerAccum = 0;

  constructor(scene: Phaser.Scene, config: FirePlumeConfig) {
    const ox = Math.cos(config.angle) * FIRE_PLUME_OFFSET;
    const oy = Math.sin(config.angle) * FIRE_PLUME_OFFSET;
    super(scene, config.x + ox, config.y + oy, 'fire-plume');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(5);
    this.setRotation(config.angle + Math.PI / 2);
    this.setAlpha(0.95);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const bw = FIRE_PLUME_WIDTH * 0.75;
    const bh = FIRE_PLUME_LENGTH * 0.85;
    body.setSize(bw, bh);
    body.setOffset((this.width - bw) / 2, (this.height - bh) / 2);
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setVelocity(0, 0);

    this.bornAt = scene.time.now;
  }

  static spawnFrom(
    scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.Group,
    x: number,
    y: number,
    angle: number,
  ): FirePlume {
    const plume = new FirePlume(scene, { x, y, angle });
    group.add(plume);
    return plume;
  }

  updatePlume(time: number, delta: number): void {
    if (!this.active) return;

    this.flickerAccum += delta;
    if (this.flickerAccum >= 80) {
      this.flickerAccum = 0;
      this.setAlpha(0.75 + Math.random() * 0.25);
      this.setTint(Math.random() < 0.5 ? 0xff6622 : 0xffaa33);
    }

    if (time >= this.bornAt + FIRE_PLUME_LIFETIME_MS) {
      this.destroy();
    }
  }

  isOffScreen(): boolean {
    return false;
  }
}
