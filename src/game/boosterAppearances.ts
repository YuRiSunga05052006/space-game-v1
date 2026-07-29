import Phaser from 'phaser';

export const BOOSTER_TEXTURE_WIDTH = 56;
export const BOOSTER_TEXTURE_HEIGHT = 120;
export const BOOSTER_TEXTURE_KEY = 'launch-booster';
export const BOOSTER_DEPLOYED_TEXTURE_KEY = 'launch-booster-deployed';

export interface BoosterDrawOptions {
  /** Grid fins and landing legs. Retracted during launch ascent. */
  deployed?: boolean;
}

/**
 * Procedural Falcon-style booster (reference only).
 * Drawn in texture space: width 56, height 120. Origin top-left.
 */
export function drawBooster(
  g: Phaser.GameObjects.Graphics,
  ox = 0,
  oy = 0,
  options: BoosterDrawOptions = {},
): void {
  const deployed = options.deployed === true;
  const cx = ox + BOOSTER_TEXTURE_WIDTH / 2;
  const tankTop = oy + 14;
  const tankBottom = oy + 100;
  const tankW = 22;
  const tankLeft = cx - tankW / 2;

  // Interstage (ribbed dark band)
  g.fillStyle(0x3a3a42, 1);
  g.fillRect(tankLeft - 1, oy + 2, tankW + 2, 12);
  g.fillStyle(0x2a2a30, 1);
  for (let i = 0; i < 8; i++) {
    g.fillRect(tankLeft + 1 + i * 2.5, oy + 3, 1.2, 10);
  }

  // Grid fins (deployed: extended; retracted: flush stubs)
  if (deployed) {
    g.fillStyle(0x6a6a72, 1);
    g.fillRect(tankLeft - 14, oy + 16, 12, 3);
    g.fillRect(tankLeft + tankW + 2, oy + 16, 12, 3);
    g.lineStyle(1, 0x9a9aa2, 0.9);
    for (let i = 0; i < 4; i++) {
      g.lineBetween(tankLeft - 13 + i * 3, oy + 16, tankLeft - 13 + i * 3, oy + 19);
      g.lineBetween(tankLeft + tankW + 3 + i * 3, oy + 16, tankLeft + tankW + 3 + i * 3, oy + 19);
    }
  } else {
    g.fillStyle(0x55555e, 1);
    g.fillRect(tankLeft - 3, oy + 16, 2, 3);
    g.fillRect(tankLeft + tankW + 1, oy + 16, 2, 3);
  }

  // Fuel tank body
  g.fillStyle(0xb8bcc4, 1);
  g.fillRoundedRect(tankLeft, tankTop, tankW, tankBottom - tankTop, 3);
  g.fillStyle(0xd0d4dc, 1);
  g.fillRect(tankLeft + 2, tankTop + 4, 4, tankBottom - tankTop - 8);
  g.fillStyle(0x9aa0aa, 1);
  g.fillRect(tankLeft + tankW - 5, tankTop + 6, 3, tankBottom - tankTop - 12);

  // Landing legs
  if (deployed) {
    g.lineStyle(2.5, 0x7a7a84, 1);
    g.lineBetween(tankLeft + 2, tankBottom - 4, tankLeft - 12, oy + 116);
    g.lineBetween(tankLeft + tankW - 2, tankBottom - 4, tankLeft + tankW + 12, oy + 116);
    g.fillStyle(0x888892, 1);
    g.fillRect(tankLeft - 14, oy + 114, 6, 3);
    g.fillRect(tankLeft + tankW + 8, oy + 114, 6, 3);
  } else {
    g.fillStyle(0x6a6a74, 1);
    g.fillRect(tankLeft + 1, tankBottom - 2, 3, 4);
    g.fillRect(tankLeft + tankW - 4, tankBottom - 2, 3, 4);
  }

  // Five engine bells
  const engineY = oy + 108;
  const engineXs = [cx - 10, cx - 5, cx, cx + 5, cx + 10];
  for (const ex of engineXs) {
    g.fillStyle(0x555560, 1);
    g.fillEllipse(ex, engineY, 4.5, 6);
    g.fillStyle(0x333338, 1);
    g.fillEllipse(ex, engineY + 2, 2.5, 3);
  }
}
