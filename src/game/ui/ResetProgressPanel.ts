import Phaser from 'phaser';
import { initAudio, playAlarmSfx } from '../audioManager';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { disablePhaserKeyboardWhileTyping } from '../editor/ui/editorWidgets';
import { createMenuButton } from './MenuButtons';

const HOLD_MS = 10_000;
const RESET_CONFIRM_WORD = 'delete';

export interface ResetProgressPanelOptions {
  onBack: () => void;
  onResetTriggered: () => void;
}

export interface ResetProgressPanelResult {
  root: Phaser.GameObjects.Container;
  destroy: () => void;
}

function styleConfirmInput(el: HTMLInputElement): void {
  el.style.cssText = [
    'width:220px',
    'height:40px',
    'box-sizing:border-box',
    'border:1px solid #553344',
    'border-radius:10px',
    'background:#1a1f3a',
    'color:#e8f4ff',
    'font-family:Orbitron,sans-serif',
    'font-size:13px',
    'font-weight:700',
    'outline:none',
    'padding:0 12px',
    'text-align:center',
  ].join(';');
}

export function createResetProgressPanel(
  scene: Phaser.Scene,
  depth: number,
  options: ResetProgressPanelOptions,
): ResetProgressPanelResult {
  const root = scene.add.container(0, 0).setDepth(depth);

  const overlay = scene.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH,
    GAME_HEIGHT,
    0x000000,
    0.9,
  );
  root.add(overlay);

  root.add(scene.add.text(GAME_WIDTH / 2, 72, 'RESET PROGRESS', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '28px',
    fontStyle: '900',
    color: '#ff4466',
  }).setOrigin(0.5));

  root.add(scene.add.text(
    GAME_WIDTH / 2,
    148,
    'Warning: all of this guest account\'s progress will be permanently deleted — coins, unlocks, shop items, high scores, and custom levels.\n\nSigned-in accounts and cloud saves are not affected. Only guest progress on this device is reset.',
    {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '11px',
      color: '#cc8899',
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 56 },
      lineSpacing: 8,
    },
  ).setOrigin(0.5, 0));

  root.add(scene.add.text(GAME_WIDTH / 2, 268, 'Type "delete" to enable reset', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '11px',
    color: '#8899bb',
  }).setOrigin(0.5));

  const confirmInput = document.createElement('input');
  confirmInput.type = 'text';
  confirmInput.placeholder = 'delete';
  confirmInput.autocomplete = 'off';
  confirmInput.spellcheck = false;
  styleConfirmInput(confirmInput);
  confirmInput.addEventListener('pointerdown', (event) => event.stopPropagation());
  confirmInput.addEventListener('mousedown', (event) => event.stopPropagation());
  confirmInput.addEventListener('touchstart', (event) => event.stopPropagation());
  disablePhaserKeyboardWhileTyping(scene, confirmInput);
  const confirmDom = scene.add.dom(GAME_WIDTH / 2, 308, confirmInput).setOrigin(0.5);
  root.add(confirmDom);

  const holdHint = scene.add.text(GAME_WIDTH / 2, 362, 'Hold RESET for 10 seconds', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '10px',
    color: '#556677',
  }).setOrigin(0.5);
  root.add(holdHint);

  const countdownText = scene.add.text(GAME_WIDTH / 2, 392, '10', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '28px',
    fontStyle: '900',
    color: '#ffcc00',
  }).setOrigin(0.5);
  root.add(countdownText);

  const resetColor = 0xff4466;
  const resetBtn = scene.add.container(GAME_WIDTH / 2, 448);
  const resetBg = scene.add.graphics();
  const drawResetBg = (fillAlpha: number, strokeAlpha: number) => {
    resetBg.clear();
    resetBg.fillStyle(resetColor, fillAlpha);
    resetBg.fillRoundedRect(-110, -24, 220, 48, 24);
    resetBg.lineStyle(2, resetColor, strokeAlpha);
    resetBg.strokeRoundedRect(-110, -24, 220, 48, 24);
  };
  drawResetBg(0.15, 0.8);
  const resetLabel = scene.add.text(0, 0, 'RESET', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '18px',
    fontStyle: '700',
    color: '#ff4466',
  }).setOrigin(0.5);
  resetBtn.add([resetBg, resetLabel]);
  resetBtn.setInteractive(
    new Phaser.Geom.Rectangle(-110, -24, 220, 48),
    Phaser.Geom.Rectangle.Contains,
  );
  root.add(resetBtn);

  let holding = false;
  let holdStartMs = 0;
  let resetTriggered = false;
  let controlsLocked = false;
  let atZeroGrace = false;
  let lastDisplayedSecond = 10;
  let zeroExplosionTimer: Phaser.Time.TimerEvent | undefined;

  const playAlarm = () => {
    void initAudio();
    playAlarmSfx();
  };

  const canReset = (): boolean => (
    confirmInput.value.trim().toLowerCase() === RESET_CONFIRM_WORD
  );

  const syncResetButton = () => {
    if (controlsLocked) return;
    resetBtn.setAlpha(canReset() ? 1 : 0.35);
  };

  const cancelHold = () => {
    if (!holding || controlsLocked) return;
    holding = false;
    holdStartMs = 0;
    atZeroGrace = false;
    zeroExplosionTimer?.remove();
    zeroExplosionTimer = undefined;
    lastDisplayedSecond = 10;
    countdownText.setText('10');
    holdHint.setText('Hold RESET for 10 seconds');
    holdHint.setColor('#556677');
  };

  const runResetSequence = () => {
    if (resetTriggered) return;
    resetTriggered = true;
    controlsLocked = true;
    holding = false;
    confirmInput.disabled = true;
    resetBtn.disableInteractive();
    resetBtn.setAlpha(0.35);
    options.onResetTriggered();
  };

  const onUpdate = () => {
    if (!holding || controlsLocked || resetTriggered) return;
    const elapsed = scene.time.now - holdStartMs;

    if (elapsed >= HOLD_MS) {
      if (!atZeroGrace) {
        atZeroGrace = true;
        if (lastDisplayedSecond !== 0) {
          lastDisplayedSecond = 0;
          countdownText.setText('0');
          playAlarm();
        }
        holdHint.setText('Release to cancel');
        holdHint.setColor('#ff4466');
        zeroExplosionTimer = scene.time.delayedCall(1000, () => {
          zeroExplosionTimer = undefined;
          if (holding && !resetTriggered) {
            runResetSequence();
          }
        });
      }
      return;
    }

    const remainingMs = HOLD_MS - elapsed;
    const seconds = Math.ceil(remainingMs / 1000);
    if (seconds !== lastDisplayedSecond) {
      lastDisplayedSecond = seconds;
      countdownText.setText(String(seconds));
      playAlarm();
    }
    holdHint.setText('Keep holding…');
    holdHint.setColor('#ffcc00');
  };

  confirmInput.addEventListener('input', syncResetButton);

  resetBtn.on('pointerdown', () => {
    if (controlsLocked || !canReset()) return;
    zeroExplosionTimer?.remove();
    zeroExplosionTimer = undefined;
    atZeroGrace = false;
    holding = true;
    holdStartMs = scene.time.now;
    lastDisplayedSecond = 10;
    countdownText.setText('10');
    holdHint.setText('Keep holding…');
    holdHint.setColor('#ffcc00');
    playAlarm();
  });
  resetBtn.on('pointerup', cancelHold);
  resetBtn.on('pointerout', cancelHold);

  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
  syncResetButton();

  const { container: backBtn } = createMenuButton(scene, {
    label: 'BACK',
    y: GAME_HEIGHT - 72,
    onClick: () => {
      if (controlsLocked) return;
      options.onBack();
    },
  });
  backBtn.setX(GAME_WIDTH / 2);
  root.add(backBtn);

  const destroy = () => {
    zeroExplosionTimer?.remove();
    zeroExplosionTimer = undefined;
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    confirmInput.remove();
    root.destroy();
  };

  return { root, destroy };
}
