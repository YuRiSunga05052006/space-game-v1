import Phaser from 'phaser';
import { playSfx, initAudio } from '../../audioManager';
import type { SpawnRule, SpawnScaleBy } from '../customLevels';

export function showToast(scene: Phaser.Scene, message: string, color = '#00d4ff'): void {
  const text = scene.add.text(scene.cameras.main.centerX, 56, message, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '14px',
    fontStyle: '700',
    color,
    backgroundColor: '#000000aa',
    padding: { x: 12, y: 8 },
  }).setOrigin(0.5).setDepth(500).setScrollFactor(0);

  scene.tweens.add({
    targets: text,
    alpha: 0,
    delay: 1600,
    duration: 400,
    onComplete: () => text.destroy(),
  });
}

export function promptText(message: string, defaultValue = ''): string | null {
  try {
    return window.prompt(message, defaultValue);
  } catch {
    return null;
  }
}

export function colorToRgb(color: number): { r: number; g: number; b: number } {
  const c = color >>> 0;
  return {
    r: (c >> 16) & 255,
    g: (c >> 8) & 255,
    b: c & 255,
  };
}

export function rgbToColor(r: number, g: number, b: number): number {
  return ((Phaser.Math.Clamp(r, 0, 255) & 255) << 16)
    | ((Phaser.Math.Clamp(g, 0, 255) & 255) << 8)
    | (Phaser.Math.Clamp(b, 0, 255) & 255);
}

function styleEditorInput(el: HTMLInputElement, widthPx: number): void {
  el.style.cssText = [
    `width:${widthPx}px`,
    'height:28px',
    'box-sizing:border-box',
    'border:1px solid #334466',
    'border-radius:6px',
    'background:#1a1f3a',
    'color:#00d4ff',
    'font-family:Orbitron,sans-serif',
    'font-size:12px',
    'font-weight:700',
    'text-align:center',
    'outline:none',
    'padding:0 4px',
  ].join(';');
}

export interface DomTextInputResult {
  container: Phaser.GameObjects.Container;
  input: HTMLInputElement;
  dom: Phaser.GameObjects.DOMElement;
  getValue: () => string;
  setValue: (value: string) => void;
  destroy: () => void;
}

/** Typeable text field via Phaser DOM (requires gameConfig.dom.createContainer). */
export function createDomTextInput(
  scene: Phaser.Scene,
  options: {
    label?: string;
    value: string;
    width?: number;
    maxLength?: number;
    placeholder?: string;
    onChange?: (value: string) => void;
  },
): DomTextInputResult {
  const root = scene.add.container(0, 0);
  const width = options.width ?? 200;
  let y = 0;

  if (options.label) {
    root.add(scene.add.text(-150, 0, options.label, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '13px',
      color: '#ccddee',
    }).setOrigin(0, 0.5));
  }

  const input = document.createElement('input');
  input.type = 'text';
  input.value = options.value;
  input.placeholder = options.placeholder ?? '';
  if (options.maxLength) input.maxLength = options.maxLength;
  styleEditorInput(input, width);
  input.style.textAlign = 'left';
  input.style.padding = '0 8px';

  const dom = scene.add.dom(40, y, input).setOrigin(0.5);
  root.add(dom);

  input.addEventListener('input', () => {
    options.onChange?.(input.value);
  });
  // Keep Phaser from stealing focus while typing.
  input.addEventListener('pointerdown', (e) => e.stopPropagation());
  input.addEventListener('mousedown', (e) => e.stopPropagation());
  input.addEventListener('touchstart', (e) => e.stopPropagation());

  return {
    container: root,
    input,
    dom,
    getValue: () => input.value,
    setValue: (value: string) => {
      input.value = value;
    },
    destroy: () => root.destroy(true),
  };
}

export interface RgbColorRowResult {
  container: Phaser.GameObjects.Container;
  /** Total height used by this block (for layout). */
  blockHeight: number;
  getColor: () => number;
  destroy: () => void;
}

/** RGB color editor: typeable R / G / B fields (0–255) plus a color swatch. */
export function createRgbColorRow(
  scene: Phaser.Scene,
  label: string,
  color: number,
  onChange: (next: number) => void,
): RgbColorRowResult {
  const root = scene.add.container(0, 0);
  let rgb = colorToRgb(color);

  root.add(scene.add.text(-150, 0, label, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '13px',
    fontStyle: '700',
    color: '#00d4ff',
  }).setOrigin(0, 0.5));

  const swatch = scene.add.rectangle(130, 0, 28, 18, rgbToColor(rgb.r, rgb.g, rgb.b)).setOrigin(0.5);
  root.add(swatch);

  const channels: Array<{ key: 'r' | 'g' | 'b'; label: string; x: number }> = [
    { key: 'r', label: 'R', x: -90 },
    { key: 'g', label: 'G', x: 0 },
    { key: 'b', label: 'B', x: 90 },
  ];

  const inputs: HTMLInputElement[] = [];

  channels.forEach((ch) => {
    const rowY = 32;
    root.add(scene.add.text(ch.x - 28, rowY, `${ch.label}=`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '12px',
      color: '#8899bb',
    }).setOrigin(1, 0.5));

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '255';
    input.step = '1';
    input.value = String(rgb[ch.key]);
    input.inputMode = 'numeric';
    styleEditorInput(input, 52);
    inputs.push(input);

    const dom = scene.add.dom(ch.x + 10, rowY, input).setOrigin(0.5);
    root.add(dom);

    const commit = () => {
      const parsed = parseInt(input.value, 10);
      rgb[ch.key] = Number.isFinite(parsed) ? Phaser.Math.Clamp(parsed, 0, 255) : 0;
      input.value = String(rgb[ch.key]);
      const next = rgbToColor(rgb.r, rgb.g, rgb.b);
      swatch.setFillStyle(next);
      onChange(next);
    };

    input.addEventListener('change', commit);
    input.addEventListener('blur', commit);
    input.addEventListener('input', () => {
      const parsed = parseInt(input.value, 10);
      if (!Number.isFinite(parsed)) return;
      rgb[ch.key] = Phaser.Math.Clamp(parsed, 0, 255);
      const next = rgbToColor(rgb.r, rgb.g, rgb.b);
      swatch.setFillStyle(next);
      onChange(next);
    });
    input.addEventListener('pointerdown', (e) => e.stopPropagation());
    input.addEventListener('mousedown', (e) => e.stopPropagation());
    input.addEventListener('touchstart', (e) => e.stopPropagation());
  });

  return {
    container: root,
    blockHeight: 58,
    getColor: () => rgbToColor(rgb.r, rgb.g, rgb.b),
    destroy: () => root.destroy(true),
  };
}

/** Typeable numeric field (for Interval ms and similar). */
export function createDomNumberInput(
  scene: Phaser.Scene,
  options: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    width?: number;
    disabled?: boolean;
    onChange: (value: number) => void;
  },
): DomTextInputResult {
  const root = scene.add.container(0, 0);
  root.add(scene.add.text(-150, 0, options.label, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '13px',
    color: options.disabled ? '#556677' : '#ccddee',
  }).setOrigin(0, 0.5));

  const input = document.createElement('input');
  input.type = 'number';
  input.min = String(options.min);
  input.max = String(options.max);
  input.step = String(options.step ?? 1);
  input.value = String(options.value);
  input.inputMode = 'numeric';
  input.disabled = options.disabled === true;
  styleEditorInput(input, options.width ?? 88);
  if (options.disabled) {
    input.style.color = '#556677';
    input.style.borderColor = '#2a3348';
  }

  const dom = scene.add.dom(40, 0, input).setOrigin(0.5);
  root.add(dom);

  const commit = () => {
    const parsed = parseInt(input.value, 10);
    const next = Number.isFinite(parsed)
      ? Phaser.Math.Clamp(parsed, options.min, options.max)
      : options.min;
    input.value = String(next);
    options.onChange(next);
  };

  input.addEventListener('change', commit);
  input.addEventListener('blur', commit);
  input.addEventListener('input', () => {
    const parsed = parseInt(input.value, 10);
    if (!Number.isFinite(parsed)) return;
    options.onChange(Phaser.Math.Clamp(parsed, options.min, options.max));
  });
  input.addEventListener('pointerdown', (e) => e.stopPropagation());
  input.addEventListener('mousedown', (e) => e.stopPropagation());
  input.addEventListener('touchstart', (e) => e.stopPropagation());

  return {
    container: root,
    input,
    dom,
    getValue: () => input.value,
    setValue: (value: string) => {
      input.value = value;
    },
    destroy: () => root.destroy(true),
  };
}

export function createStepperRow(
  scene: Phaser.Scene,
  label: string,
  value: number,
  step: number,
  min: number,
  max: number,
  onChange: (next: number) => void,
  disabled = false,
): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0);
  const labelText = scene.add.text(-150, 0, label, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '13px',
    color: disabled ? '#556677' : '#ccddee',
  }).setOrigin(0, 0.5);

  const valueText = scene.add.text(40, 0, formatStepperValue(value), {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '13px',
    color: disabled ? '#556677' : '#00d4ff',
  }).setOrigin(0.5);

  const makeBtn = (x: number, text: string, delta: number) => {
    const btn = scene.add.text(x, 0, text, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '16px',
      fontStyle: '700',
      color: disabled ? '#445566' : '#ffcc00',
      backgroundColor: '#1a1f3a',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);
    if (!disabled) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerup', () => {
        void initAudio().then(() => playSfx('ui'));
        const next = Phaser.Math.Clamp(
          Math.round((value + delta) / step) * step,
          min,
          max,
        );
        value = next;
        valueText.setText(formatStepperValue(next));
        onChange(next);
      });
    }
    return btn;
  };

  root.add([labelText, valueText, makeBtn(-20, '−', -step), makeBtn(100, '+', step)]);
  return root;
}

function formatStepperValue(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

export function createToggleRow(
  scene: Phaser.Scene,
  label: string,
  value: boolean,
  onChange: (next: boolean) => void,
  disabled = false,
  disabledHint?: string,
): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0);
  const shown = disabled && disabledHint ? `${label} (${disabledHint})` : label;
  const labelText = scene.add.text(-150, 0, shown, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '13px',
    color: disabled ? '#556677' : '#ccddee',
  }).setOrigin(0, 0.5);

  const btn = scene.add.text(80, 0, value ? 'ON' : 'OFF', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '13px',
    fontStyle: '700',
    color: disabled ? '#556677' : (value ? '#44ff88' : '#ff4466'),
    backgroundColor: '#1a1f3a',
    padding: { x: 10, y: 4 },
  }).setOrigin(0.5);

  if (!disabled) {
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerup', () => {
      void initAudio().then(() => playSfx('ui'));
      value = !value;
      btn.setText(value ? 'ON' : 'OFF');
      btn.setColor(value ? '#44ff88' : '#ff4466');
      onChange(value);
    });
  }

  root.add([labelText, btn]);
  return root;
}

export function createScaleByRow(
  scene: Phaser.Scene,
  value: SpawnScaleBy,
  onChange: (next: SpawnScaleBy) => void,
): Phaser.GameObjects.Container {
  const options: SpawnScaleBy[] = ['none', 'score', 'time'];
  let current = value;
  const root = scene.add.container(0, 0);
  root.add(scene.add.text(-150, 0, 'Scale by', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '13px',
    color: '#ccddee',
  }).setOrigin(0, 0.5));

  const btn = scene.add.text(40, 0, current.toUpperCase(), {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '13px',
    fontStyle: '700',
    color: '#00d4ff',
    backgroundColor: '#1a1f3a',
    padding: { x: 10, y: 4 },
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });

  btn.on('pointerup', () => {
    void initAudio().then(() => playSfx('ui'));
    const idx = options.indexOf(current);
    current = options[(idx + 1) % options.length];
    btn.setText(current.toUpperCase());
    onChange(current);
  });

  root.add(btn);
  return root;
}

export function createSpawnRuleBlock(
  scene: Phaser.Scene,
  title: string,
  rule: SpawnRule,
  onChange: (next: SpawnRule) => void,
  options?: {
    showChance?: boolean;
    disabled?: boolean;
    disabledHint?: string;
    intervalStep?: number;
  },
): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0);
  let current = { ...rule };
  const disabled = options?.disabled === true;
  let y = 0;

  root.add(scene.add.text(-150, y, title, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '15px',
    fontStyle: '700',
    color: disabled ? '#556677' : '#00d4ff',
  }).setOrigin(0, 0.5));
  y += 28;

  const notify = () => onChange({ ...current });

  const toggle = createToggleRow(scene, 'Enabled', current.enabled, (v) => {
    current.enabled = v;
    notify();
  }, disabled, options?.disabledHint);
  toggle.setY(y);
  root.add(toggle);
  y += 34;

  if (disabled) {
    const interval = createStepperRow(
      scene,
      'Interval ms',
      current.intervalMs,
      options?.intervalStep ?? 500,
      0,
      300000,
      (v) => {
        current.intervalMs = v;
        notify();
      },
      true,
    );
    interval.setY(y);
    root.add(interval);
  } else {
    const intervalField = createDomNumberInput(scene, {
      label: 'Interval ms',
      value: current.intervalMs,
      min: 0,
      max: 300000,
      step: 1,
      width: 88,
      onChange: (v) => {
        current.intervalMs = v;
        notify();
      },
    });
    intervalField.container.setY(y);
    root.add(intervalField.container);
  }
  y += 34;

  if (options?.showChance) {
    const chance = createStepperRow(
      scene,
      'Chance',
      current.chance,
      0.05,
      0,
      1,
      (v) => {
        current.chance = v;
        notify();
      },
      disabled,
    );
    chance.setY(y);
    root.add(chance);
    y += 34;
  }

  const scale = createScaleByRow(scene, current.scaleBy, (v) => {
    current.scaleBy = v;
    notify();
  });
  scale.setY(y);
  if (disabled) scale.setAlpha(0.4);
  root.add(scale);
  y += 34;

  const strength = createStepperRow(
    scene,
    'Scale strength',
    current.scaleStrength,
    0.05,
    0,
    1,
    (v) => {
      current.scaleStrength = v;
      notify();
    },
    disabled,
  );
  strength.setY(y);
  root.add(strength);

  (root as Phaser.GameObjects.Container & { blockHeight?: number }).blockHeight = y + 28;
  return root;
}

export function confirmYesNo(
  scene: Phaser.Scene,
  message: string,
  onYes: () => void,
  onNo?: () => void,
): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0).setDepth(400);

  root.add(scene.add.rectangle(
    scene.cameras.main.centerX,
    scene.cameras.main.centerY,
    scene.cameras.main.width,
    scene.cameras.main.height,
    0x000000,
    0.8,
  ).setScrollFactor(0));

  root.add(scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY - 60, message, {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '18px',
    fontStyle: '700',
    color: '#00d4ff',
    align: 'center',
    wordWrap: { width: 320 },
  }).setOrigin(0.5).setScrollFactor(0));

  const yes = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY + 10, 'YES', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '18px',
    fontStyle: '700',
    color: '#ff4466',
    backgroundColor: '#1a1f3a',
    padding: { x: 24, y: 10 },
  }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0);

  const no = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY + 70, 'NO', {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '18px',
    fontStyle: '700',
    color: '#00d4ff',
    backgroundColor: '#1a1f3a',
    padding: { x: 24, y: 10 },
  }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0);

  yes.on('pointerup', () => {
    void initAudio().then(() => playSfx('ui'));
    root.destroy();
    onYes();
  });
  no.on('pointerup', () => {
    void initAudio().then(() => playSfx('ui'));
    root.destroy();
    onNo?.();
  });

  root.add([yes, no]);
  return root;
}
