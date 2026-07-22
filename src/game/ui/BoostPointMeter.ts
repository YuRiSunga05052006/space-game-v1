import Phaser from 'phaser';

const BAR_WIDTH = 200;
const BAR_HEIGHT = 10;
const DEPTH = 101;

export class BoostPointMeter extends Phaser.GameObjects.Container {
  private fillGfx: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private scoreCap = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const frame = scene.add.graphics();
    frame.lineStyle(1, 0xffcc44, 0.85);
    frame.strokeRoundedRect(-BAR_WIDTH / 2, -BAR_HEIGHT / 2, BAR_WIDTH, BAR_HEIGHT, 4);
    frame.fillStyle(0x1a1f3a, 0.9);
    frame.fillRoundedRect(-BAR_WIDTH / 2, -BAR_HEIGHT / 2, BAR_WIDTH, BAR_HEIGHT, 4);

    this.fillGfx = scene.add.graphics();
    this.label = scene.add.text(0, BAR_HEIGHT / 2 + 10, '0 / 0', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '9px',
      fontStyle: '700',
      color: '#ffcc44',
    }).setOrigin(0.5, 0);

    this.add([frame, this.fillGfx, this.label]);
    scene.add.existing(this);
    this.setScrollFactor(0);
    this.setDepth(DEPTH);
    this.setVisible(false);
  }

  show(scoreCap: number): void {
    this.scoreCap = scoreCap;
    this.setVisible(true);
    this.update(0, scoreCap);
  }

  update(earned: number, scoreCap?: number): void {
    if (scoreCap != null) this.scoreCap = scoreCap;
    const cap = Math.max(1, this.scoreCap);
    const clamped = Phaser.Math.Clamp(earned, 0, cap);
    const ratio = clamped / cap;

    this.fillGfx.clear();
    const innerW = BAR_WIDTH - 4;
    const fillW = Math.max(0, innerW * ratio);
    if (fillW > 0) {
      this.fillGfx.fillStyle(0xffaa22, 0.95);
      this.fillGfx.fillRoundedRect(-BAR_WIDTH / 2 + 2, -BAR_HEIGHT / 2 + 2, fillW, BAR_HEIGHT - 4, 3);
    }

    this.label.setText(`${clamped} / ${cap}`);
  }

  hide(): void {
    this.setVisible(false);
    this.fillGfx.clear();
    this.scoreCap = 0;
  }
}
