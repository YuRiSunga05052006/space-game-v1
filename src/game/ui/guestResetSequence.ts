import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { playExplosionSfx, stopMusic } from '../audioManager';
import { resetGuestProgress } from '../cloud/guestProgress';
import { createBlackHoleVisual } from '../entities/blackHoleVisual';

const MENU_BG = 0x0a0e27;
const CX = GAME_WIDTH / 2;
const CY = GAME_HEIGHT / 2;
const SUCK_DURATION = 2600;

export interface GuestResetSuckPayload {
  stars: Phaser.GameObjects.Image[];
  buttons: Phaser.GameObjects.Container[];
  title?: Phaser.GameObjects.Text;
  texts: Phaser.GameObjects.Text[];
}

interface TextStyleSnapshot {
  fontFamily: string;
  fontSize: string;
  fontStyle: string;
  color: string;
  stroke?: string;
  strokeThickness?: number;
}

function spawnExplosion(scene: Phaser.Scene, x: number, y: number, quantity = 45, depth = 500): void {
  const burst = scene.add.particles(x, y, 'particle', {
    speed: { min: 90, max: 300 },
    scale: { start: 1.6, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 750,
    tint: [0xff6b35, 0xffcc00, 0xff4466, 0xffffff],
    quantity,
    emitting: false,
  });
  burst.setDepth(depth);
  burst.explode(quantity);

  const debris = scene.add.particles(x, y, 'particle', {
    speed: { min: 30, max: 120 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 0.85, end: 0 },
    lifespan: 900,
    tint: [0xffaa44, 0xff6600, 0xffcc88],
    quantity: Math.round(quantity * 0.4),
    emitting: false,
  });
  debris.setDepth(depth);
  debris.explode(Math.round(quantity * 0.4));

  scene.time.delayedCall(1200, () => {
    burst.destroy();
    debris.destroy();
  });
}

function drawCracks(g: Phaser.GameObjects.Graphics): void {
  g.clear();
  const rays = 12;
  for (let i = 0; i < rays; i++) {
    let angle = (i / rays) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.12, 0.12);
    const len = Phaser.Math.Between(90, 170);
    let x = CX;
    let y = CY;
    g.lineStyle(Phaser.Math.Between(1, 3), 0xb0c4de, Phaser.Math.FloatBetween(0.55, 0.95));
    g.beginPath();
    g.moveTo(x, y);
    const steps = Phaser.Math.Between(4, 8);
    for (let s = 0; s < steps; s++) {
      const segLen = len / steps;
      angle += Phaser.Math.FloatBetween(-0.45, 0.45);
      x += Math.cos(angle) * segLen;
      y += Math.sin(angle) * segLen;
      g.lineTo(x, y);
    }
    g.strokePath();
  }
}

function tweenBackgroundToBlack(scene: Phaser.Scene, duration: number): void {
  const fromR = (MENU_BG >> 16) & 0xff;
  const fromG = (MENU_BG >> 8) & 0xff;
  const fromB = MENU_BG & 0xff;

  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration,
    ease: 'Sine.easeIn',
    onUpdate: (tween) => {
      const t = tween.getValue() ?? 0;
      const r = Math.round(fromR * (1 - t));
      const g = Math.round(fromG * (1 - t));
      const b = Math.round(fromB * (1 - t));
      scene.cameras.main.setBackgroundColor((r << 16) | (g << 8) | b);
    },
  });
}

function snapshotTextStyle(text: Phaser.GameObjects.Text): TextStyleSnapshot {
  const style: TextStyleSnapshot = {
    fontFamily: text.style.fontFamily as string,
    fontSize: `${text.style.fontSize}px`,
    fontStyle: text.style.fontStyle as string,
    color: text.style.color as string,
  };
  if (text.style.stroke) style.stroke = text.style.stroke as string;
  if (text.style.strokeThickness) style.strokeThickness = text.style.strokeThickness;
  return style;
}

function splitTitleIntoLogoParts(
  scene: Phaser.Scene,
  title: Phaser.GameObjects.Text,
  depth: number,
): Phaser.GameObjects.Text[] {
  scene.tweens.killTweensOf(title);
  title.setVisible(false);

  const style = snapshotTextStyle(title);
  const fontSize = parseFloat(String(title.style.fontSize)) || 48;
  const gap = fontSize * 0.55;

  const starPart = scene.add.text(title.x, title.y - gap, 'STAR', {
    ...style,
    align: 'center',
  }).setOrigin(0.5).setDepth(depth);

  const blasterPart = scene.add.text(title.x, title.y + gap, 'BLASTER', {
    ...style,
    align: 'center',
  }).setOrigin(0.5).setDepth(depth);

  return [starPart, blasterPart];
}

function splitTextIntoCharacters(
  scene: Phaser.Scene,
  source: Phaser.GameObjects.Text,
  depth: number,
): Phaser.GameObjects.Text[] {
  scene.tweens.killTweensOf(source);
  source.setVisible(false);

  const style = snapshotTextStyle(source);
  const lines = source.text.split('\n');
  const fontSize = parseFloat(String(source.style.fontSize)) || 16;
  const lineSpacing = source.lineSpacing || 0;
  const lineHeight = fontSize + lineSpacing;
  const totalHeight = lines.length * fontSize + Math.max(0, lines.length - 1) * lineSpacing;
  const glyphs: Phaser.GameObjects.Text[] = [];

  lines.forEach((line, lineIndex) => {
    const lineY = source.y - totalHeight * source.originY + lineIndex * lineHeight;

    const lineProbe = scene.add.text(0, 0, line, style).setOrigin(0, 0);
    const lineWidth = lineProbe.width;
    lineProbe.destroy();

    const align = source.style.align ?? 'left';
    let lineStartX = source.x - lineWidth * source.originX;
    if (align === 'center') {
      lineStartX = source.x - lineWidth / 2;
    } else if (align === 'right' || source.originX >= 0.99) {
      lineStartX = source.x - lineWidth;
    }

    let prefix = '';
    for (const ch of line) {
      const prefixProbe = scene.add.text(0, 0, prefix, style).setOrigin(0, 0);
      const x = lineStartX + prefixProbe.width;
      prefixProbe.destroy();

      if (ch !== ' ') {
        const glyph = scene.add.text(x, lineY, ch, style).setOrigin(0, 0).setDepth(depth);
        glyphs.push(glyph);
      }
      prefix += ch;
    }
  });

  return glyphs;
}

function suckStarSpiral(scene: Phaser.Scene, star: Phaser.GameObjects.Image, duration: number, index: number): void {
  const startX = star.x;
  const startY = star.y;
  const dx = startX - CX;
  const dy = startY - CY;
  const startAngle = Math.atan2(dy, dx);
  const startDist = Math.max(Math.hypot(dx, dy), 40);
  const spiralTurns = Phaser.Math.FloatBetween(1.4, 2.8) * (index % 2 === 0 ? 1 : -1);
  const startScale = star.scaleX;
  const startAlpha = star.alpha;

  scene.tweens.killTweensOf(star);
  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: duration + Phaser.Math.Between(-150, 150),
    ease: 'Cubic.easeIn',
    onUpdate: (tween) => {
      const t = tween.getValue() ?? 0;
      const dist = startDist * (1 - t);
      const angle = startAngle + spiralTurns * Math.PI * 2 * t;
      star.x = CX + Math.cos(angle) * dist;
      star.y = CY + Math.sin(angle) * dist;
      star.setScale(startScale * (1 - t * 0.95));
      star.setAlpha(startAlpha * (1 - t));
    },
  });
}

function suckButtonErratic(
  scene: Phaser.Scene,
  button: Phaser.GameObjects.Container,
  duration: number,
  seed: number,
): void {
  const startX = button.x;
  const startY = button.y;
  const startAngle = button.angle;
  const startScale = button.scaleX;
  const spin = Phaser.Math.Between(540, 1440) * (seed % 2 === 0 ? 1 : -1);
  const wobbleFreq = 4 + (seed % 4);
  const wobbleAmp = 35 + (seed % 25);

  scene.tweens.killTweensOf(button);
  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: duration + Phaser.Math.Between(-100, 200),
    ease: 'Cubic.easeIn',
    onUpdate: (tween) => {
      const t = tween.getValue() ?? 0;
      const wobble = Math.sin(t * Math.PI * wobbleFreq + seed) * (1 - t) * wobbleAmp;
      const towardAngle = Math.atan2(startY - CY, startX - CX);
      const perp = towardAngle + Math.PI / 2;
      button.x = Phaser.Math.Linear(startX, CX, t) + Math.cos(perp) * wobble;
      button.y = Phaser.Math.Linear(startY, CY, t) + Math.sin(perp) * wobble;
      button.angle = startAngle + spin * t + Math.sin(t * 18 + seed) * 35 * (1 - t);
      button.setScale(startScale * (1 - t * 0.92));
      button.setAlpha(1 - t);
    },
  });
}

function suckGlyphErratic(
  scene: Phaser.Scene,
  glyph: Phaser.GameObjects.Text,
  duration: number,
  seed: number,
): void {
  const startX = glyph.x;
  const startY = glyph.y;
  const startAngle = glyph.angle;
  const startScale = glyph.scaleX;
  const spin = Phaser.Math.Between(360, 1080) * (seed % 2 === 0 ? 1 : -1);
  const wobbleFreq = 3 + (seed % 6);
  const wobbleAmp = 18 + (seed % 32);
  const stagger = (seed % 7) * 40;

  scene.tweens.killTweensOf(glyph);
  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: duration + stagger,
    delay: Phaser.Math.Between(0, 120),
    ease: 'Cubic.easeIn',
    onUpdate: (tween) => {
      const t = tween.getValue() ?? 0;
      const wobble = Math.sin(t * Math.PI * wobbleFreq + seed * 0.7) * (1 - t) * wobbleAmp;
      const towardAngle = Math.atan2(startY - CY, startX - CX);
      const perp = towardAngle + Math.PI / 2;
      glyph.x = Phaser.Math.Linear(startX, CX, t) + Math.cos(perp) * wobble;
      glyph.y = Phaser.Math.Linear(startY, CY, t) + Math.sin(perp) * wobble;
      glyph.angle = startAngle + spin * t + Math.sin(t * 22 + seed) * 45 * (1 - t);
      glyph.setScale(startScale * (1 - t * 0.94));
      glyph.setAlpha(1 - t);
    },
  });
}

function suckMenuIntoBlackHole(scene: Phaser.Scene, payload: GuestResetSuckPayload, duration: number): void {
  const depth = 200;
  let seed = 0;

  payload.stars.forEach((star, index) => {
    if (!star.active) return;
    suckStarSpiral(scene, star, duration, index);
  });

  payload.buttons.forEach((button) => {
    if (!button.active) return;
    suckButtonErratic(scene, button, duration, seed++);
  });

  if (payload.title?.active) {
    const logoParts = splitTitleIntoLogoParts(scene, payload.title, depth);
    logoParts.forEach((part) => suckGlyphErratic(scene, part, duration + 100, seed++));
  }

  payload.texts.forEach((text) => {
    if (!text.active) return;
    const glyphs = splitTextIntoCharacters(scene, text, depth);
    glyphs.forEach((glyph) => suckGlyphErratic(scene, glyph, duration, seed++));
  });
}

/** Three-stage menu destruction after guest reset hold completes. */
export function runGuestResetSequence(
  scene: Phaser.Scene,
  payload: GuestResetSuckPayload,
  onMenuRebuild: () => void,
): void {
  stopMusic();

  playExplosionSfx();
  spawnExplosion(scene, CX, CY, 40);
  scene.cameras.main.shake(320, 0.018);

  scene.time.delayedCall(1000, () => {
    playExplosionSfx();
    spawnExplosion(scene, CX, CY, 35);
    scene.cameras.main.shake(220, 0.012);

    const cracks = scene.add.graphics().setDepth(450).setAlpha(0);
    drawCracks(cracks);
    scene.tweens.add({ targets: cracks, alpha: 1, duration: 500, ease: 'Quad.easeOut' });

    scene.time.delayedCall(1100, () => {
      playExplosionSfx();
      spawnExplosion(scene, CX, CY, 50);
      scene.cameras.main.shake(280, 0.016);

      const blackHole = createBlackHoleVisual(scene, {
        x: CX,
        y: CY,
        depth: 460,
        scale: 0.15,
      });
      tweenBackgroundToBlack(scene, SUCK_DURATION);
      suckMenuIntoBlackHole(scene, payload, SUCK_DURATION);

      scene.tweens.add({
        targets: blackHole,
        scale: 1.15,
        duration: SUCK_DURATION,
        ease: 'Sine.easeIn',
      });

      scene.time.delayedCall(SUCK_DURATION + 200, () => {
        playExplosionSfx();
        spawnExplosion(scene, CX, CY, 70, 520);
        spawnExplosion(scene, CX, CY, 55, 521);
        scene.cameras.main.shake(500, 0.03);
        scene.cameras.main.flash(400, 255, 200, 120);

        scene.tweens.add({
          targets: blackHole,
          scale: 2.4,
          alpha: 0,
          duration: 900,
          ease: 'Quad.easeOut',
          onComplete: () => blackHole.destroy(),
        });
        scene.tweens.add({
          targets: cracks,
          alpha: 0,
          duration: 600,
          onComplete: () => cracks.destroy(),
        });

        scene.time.delayedCall(2200, () => {
          scene.cameras.main.setBackgroundColor('#000000');
          resetGuestProgress();
          onMenuRebuild();
        });
      });
    });
  });
}
