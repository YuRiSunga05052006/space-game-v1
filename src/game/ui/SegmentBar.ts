import Phaser from 'phaser';

export const BAR_COUNT = 10;
export const POINTS_PER_BAR = 2;

export const SEGMENT_BOX_WIDTH = 28;
export const SEGMENT_BOX_HEIGHT = 14;
export const SEGMENT_BOX_GAP = 4;
export const SEGMENT_PADDING = 2;

export const SEGMENT_COLOR_BORDER = 0x556677;
export const SEGMENT_COLOR_BG = 0x1a1f3a;
export const SEGMENT_COLOR_GRAY = 0x555566;

export function segmentBarTotalWidth(): number {
  return BAR_COUNT * SEGMENT_BOX_WIDTH + (BAR_COUNT - 1) * SEGMENT_BOX_GAP;
}

export function drawSegmentFill(
  g: Phaser.GameObjects.Graphics,
  fillLevel: number,
  fillColor: number,
): void {
  g.clear();

  g.lineStyle(1, SEGMENT_COLOR_BORDER, 1);
  g.fillStyle(SEGMENT_COLOR_BG, 1);
  g.fillRect(0, 0, SEGMENT_BOX_WIDTH, SEGMENT_BOX_HEIGHT);
  g.strokeRect(0, 0, SEGMENT_BOX_WIDTH, SEGMENT_BOX_HEIGHT);

  const innerX = SEGMENT_PADDING;
  const innerY = SEGMENT_PADDING;
  const innerW = SEGMENT_BOX_WIDTH - SEGMENT_PADDING * 2;
  const innerH = SEGMENT_BOX_HEIGHT - SEGMENT_PADDING * 2;
  const halfW = innerW / 2;

  if (fillLevel === 0) {
    g.fillStyle(SEGMENT_COLOR_GRAY, 1);
    g.fillRect(innerX, innerY, innerW, innerH);
  } else if (fillLevel === 1) {
    g.fillStyle(fillColor, 1);
    g.fillRect(innerX, innerY, halfW, innerH);
    g.fillStyle(SEGMENT_COLOR_GRAY, 1);
    g.fillRect(innerX + halfW, innerY, halfW, innerH);
  } else {
    g.fillStyle(fillColor, 1);
    g.fillRect(innerX, innerY, innerW, innerH);
  }
}

export function fillLevelForPoints(points: number, index: number): number {
  return Math.min(POINTS_PER_BAR, Math.max(0, points - index * POINTS_PER_BAR));
}

export function createSegmentGraphics(scene: Phaser.Scene): Phaser.GameObjects.Graphics[] {
  const startX = -segmentBarTotalWidth() / 2;
  const graphics: Phaser.GameObjects.Graphics[] = [];

  for (let i = 0; i < BAR_COUNT; i++) {
    const g = scene.add.graphics();
    g.x = startX + i * (SEGMENT_BOX_WIDTH + SEGMENT_BOX_GAP);
    graphics.push(g);
  }

  return graphics;
}
