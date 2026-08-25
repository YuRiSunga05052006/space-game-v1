import Phaser from 'phaser';
import {
  BAR_COUNT,
  createSegmentGraphics,
  drawSegmentFill,
  fillLevelForPoints,
  POINTS_PER_BAR,
} from './SegmentBar';

export const MAX_ARMOR = BAR_COUNT * POINTS_PER_BAR;

const COLOR_BLUE = 0x4488ff;

export class ArmorBar extends Phaser.GameObjects.Container {
  private segmentGraphics: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.segmentGraphics = createSegmentGraphics(scene);
    for (const g of this.segmentGraphics) {
      this.add(g);
    }

    scene.add.existing(this);
    this.setScrollFactor(0);
    this.setDepth(100);
    this.setArmor(0);
  }

  setArmor(armor: number): void {
    const clamped = Phaser.Math.Clamp(armor, 0, MAX_ARMOR);
    this.setVisible(clamped > 0);

    for (let i = 0; i < BAR_COUNT; i++) {
      const g = this.segmentGraphics[i];
      const fillLevel = fillLevelForPoints(clamped, i);
      if (fillLevel > 0) {
        g.setVisible(true);
        drawSegmentFill(g, fillLevel, COLOR_BLUE);
      } else {
        g.setVisible(false);
        g.clear();
      }
    }
  }
}
