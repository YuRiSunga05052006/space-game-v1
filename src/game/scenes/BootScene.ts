import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.createTextures();
    this.scene.start('MenuScene');
  }

  private createTextures(): void {
    this.createRocketTexture();
    this.createBulletTexture();
    this.createAsteroidTextures();
    this.createStarTexture();
    this.createParticleTexture();
    this.createHeartTexture();
    this.createPowerStarTexture();
    this.createSpiderShipTexture();
    this.createEnemyLaserTexture();
    this.createBossSpecialLaserTexture();
    this.createLootBoxTexture();
    this.createHeavyBulletTexture();
    this.createSeekerDroneTexture();
    this.createKamikazeWaspTexture();
    this.createPlasmaTurretTexture();
    this.createBossShipTexture();
  }

  private createRocketTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x1a1f3a);
    g.fillTriangle(16, 0, 0, 40, 32, 40);
    g.fillStyle(0x00d4ff);
    g.fillTriangle(16, 8, 6, 36, 26, 36);
    g.fillStyle(0xff6b35);
    g.fillTriangle(10, 40, 16, 52, 22, 40);
    g.fillStyle(0xffcc00);
    g.fillTriangle(13, 42, 16, 50, 19, 42);
    g.generateTexture('rocket', 32, 52);
    g.destroy();
  }

  private createBulletTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x00ffcc);
    g.fillRoundedRect(0, 0, 6, 16, 3);
    g.fillStyle(0xffffff, 0.8);
    g.fillRoundedRect(1, 2, 4, 6, 2);
    g.generateTexture('bullet', 6, 16);
    g.destroy();
  }

  private createAsteroidTextures(): void {
    const sizes = [
      { key: 'asteroid-lg', radius: 28, color: 0x8b7355 },
      { key: 'asteroid-md', radius: 20, color: 0xa0886a },
      { key: 'asteroid-sm', radius: 12, color: 0xb89b7a },
    ];

    for (const { key, radius, color } of sizes) {
      const size = radius * 2 + 4;
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      const cx = size / 2;
      const cy = size / 2;
      g.fillStyle(color);
      g.beginPath();
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = radius * (0.75 + Math.random() * 0.35);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      g.fillPath();
      g.fillStyle(0x000000, 0.25);
      g.fillCircle(cx - radius * 0.2, cy - radius * 0.15, radius * 0.25);
      g.generateTexture(key, size, size);
      g.destroy();
    }
  }

  private createStarTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff);
    g.fillCircle(2, 2, 2);
    g.generateTexture('star', 4, 4);
    g.destroy();
  }

  private createParticleTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();
  }

  private createHeartTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = 12;
    const cy = 11;
    g.fillStyle(0xff4466);
    g.fillCircle(cx - 5, cy - 2, 6);
    g.fillCircle(cx + 5, cy - 2, 6);
    g.fillTriangle(cx - 11, cy, cx + 11, cy, cx, cy + 12);
    g.fillStyle(0xff8899, 0.6);
    g.fillCircle(cx - 3, cy - 4, 2);
    g.generateTexture('heart', 24, 24);
    g.destroy();
  }

  private createPowerStarTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = 12;
    const cy = 12;
    const outer = 10;
    const inner = 4;

    g.fillStyle(0xffcc00, 1);
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fillPath();

    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(cx - 2, cy - 3, 2);
    g.generateTexture('power-star', 24, 24);
    g.destroy();
  }

  private createSpiderShipTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = 18;
    const cy = 18;

    g.lineStyle(3, 0x661111, 1);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const legLen = 14;
      g.lineBetween(
        cx + Math.cos(angle) * 6,
        cy + Math.sin(angle) * 6,
        cx + Math.cos(angle) * legLen,
        cy + Math.sin(angle) * legLen,
      );
    }

    g.fillStyle(0xcc2222, 1);
    g.fillCircle(cx, cy, 10);
    g.fillStyle(0x991111, 1);
    g.fillTriangle(cx, cy - 10, cx - 8, cy + 6, cx + 8, cy + 6);

    g.fillStyle(0xff4444, 1);
    g.fillCircle(cx, cy - 2, 4);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx - 1, cy - 3, 1.5);

    g.generateTexture('spider-ship', 36, 36);
    g.destroy();
  }

  private createEnemyLaserTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xff2244, 1);
    g.fillRoundedRect(0, 0, 8, 20, 2);
    g.fillStyle(0xff8899, 0.9);
    g.fillRoundedRect(2, 2, 4, 8, 1);
    g.generateTexture('enemy-laser', 8, 20);
    g.destroy();
  }

  private createBossSpecialLaserTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x6611bb, 1);
    g.fillRoundedRect(0, 0, 10, 24, 2);
    g.fillStyle(0xaa44ff, 0.95);
    g.fillRoundedRect(2, 2, 6, 12, 1);
    g.fillStyle(0xddbbff, 0.85);
    g.fillRoundedRect(4, 4, 2, 8, 1);
    g.generateTexture('boss-special-laser', 10, 24);
    g.destroy();
  }

  private createLootBoxTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const s = 28;
    g.fillStyle(0x5533aa, 0.4);
    g.fillRoundedRect(-2, -2, s + 4, s + 4, 4);
    g.fillStyle(0xffcc00, 1);
    g.fillRoundedRect(0, 0, s, s, 4);
    g.fillStyle(0xcc9900, 1);
    g.fillRect(4, 4, s - 8, s - 8);
    g.lineStyle(2, 0xaa66ff, 1);
    g.strokeRoundedRect(0, 0, s, s, 4);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(s / 2 - 2, 2, 4, s - 4);
    g.fillRect(2, s / 2 - 2, s - 4, 4);
    g.generateTexture('loot-box', s, s);
    g.destroy();
  }

  private createHeavyBulletTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xff8844, 1);
    g.fillRoundedRect(0, 0, 10, 20, 4);
    g.fillStyle(0xffcc88, 0.9);
    g.fillRoundedRect(2, 2, 6, 8, 2);
    g.generateTexture('bullet-heavy', 10, 20);
    g.destroy();
  }

  private createSeekerDroneTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = 14;
    const cy = 14;
    g.fillStyle(0x662200, 1);
    g.fillTriangle(cx, cy - 12, cx - 12, cy + 8, cx + 12, cy + 8);
    g.fillStyle(0xff7722, 1);
    g.fillTriangle(cx, cy - 8, cx - 7, cy + 4, cx + 7, cy + 4);
    g.fillStyle(0xffaa44, 1);
    g.fillCircle(cx, cy, 4);
    g.generateTexture('seeker-drone', 28, 28);
    g.destroy();
  }

  private createKamikazeWaspTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = 14;
    const cy = 14;
    g.fillStyle(0xccaa00, 1);
    g.fillEllipse(cx, cy, 10, 16);
    g.fillStyle(0xffee44, 0.9);
    g.fillEllipse(cx, cy - 2, 6, 10);
    g.fillStyle(0x886600, 1);
    g.fillTriangle(cx - 14, cy - 2, cx - 4, cy, cx - 4, cy + 6);
    g.fillTriangle(cx + 14, cy - 2, cx + 4, cy, cx + 4, cy + 6);
    g.fillStyle(0xff0000, 1);
    g.fillCircle(cx, cy - 6, 2);
    g.generateTexture('kamikaze-wasp', 28, 28);
    g.destroy();
  }

  private createPlasmaTurretTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = 16;
    const cy = 18;
    g.fillStyle(0x442266, 1);
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * 14;
      const y = cy + Math.sin(angle) * 12;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fillPath();
    g.fillStyle(0xaa44ff, 1);
    g.fillRect(cx - 3, cy - 16, 6, 14);
    g.fillStyle(0xdd88ff, 0.9);
    g.fillCircle(cx, cy - 16, 4);
    g.generateTexture('plasma-turret', 32, 32);
    g.destroy();
  }

  private createBossShipTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = 32;
    const cy = 34;

    g.fillStyle(0x331111, 1);
    g.fillEllipse(cx, cy, 56, 48);
    g.lineStyle(3, 0xffcc00, 1);
    g.strokeEllipse(cx, cy, 56, 48);

    g.fillStyle(0x881111, 1);
    g.fillTriangle(cx, cy - 28, cx - 22, cy + 10, cx + 22, cy + 10);

    g.fillStyle(0xff2244, 0.9);
    g.fillCircle(cx, cy - 4, 10);
    g.fillStyle(0xffcc00, 0.8);
    g.fillCircle(cx, cy - 6, 5);

    g.lineStyle(2, 0x662222, 1);
    g.lineBetween(cx - 28, cy + 8, cx - 44, cy + 20);
    g.lineBetween(cx + 28, cy + 8, cx + 44, cy + 20);

    g.generateTexture('boss-ship', 64, 64);
    g.destroy();
  }
}
