import { getMusicVolume, getSoundVolume } from './settings';

export type SfxType = 'shoot' | 'explosion' | 'hit' | 'ui';
export type UiClickChannel = 'sound' | 'music';

let ctx: AudioContext | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicOscillators: OscillatorNode[] = [];
let musicArpTimer: ReturnType<typeof setInterval> | null = null;
let musicPlaying = false;
let musicMutedByPause = false;
let explosionBuffer: AudioBuffer | null = null;
let explosionLoadPromise: Promise<AudioBuffer | null> | null = null;
let buttonClickBuffer: AudioBuffer | null = null;
let buttonClickLoadPromise: Promise<AudioBuffer | null> | null = null;
let rocketEngineBuffer: AudioBuffer | null = null;
let rocketEngineLoadPromise: Promise<AudioBuffer | null> | null = null;
let rocketEngineSource: AudioBufferSourceNode | null = null;
let rocketEngineGain: GainNode | null = null;
let rocketEnginePlaying = false;
let invincibilityThemeBuffer: AudioBuffer | null = null;
let invincibilityThemeLoadPromise: Promise<AudioBuffer | null> | null = null;
let invincibilityThemeSource: AudioBufferSourceNode | null = null;
let invincibilityThemeGain: GainNode | null = null;
let invincibilityThemePlaying = false;
let invincibilityThemeDesired = false;

const EXPLOSION_URL = '/assets/explosion.mp3';
const BUTTON_CLICK_URL = '/assets/button-click.mp3';
const ROCKET_ENGINE_URL = '/assets/rocket-engine.mp3';
const INVINCIBILITY_THEME_URL = '/assets/invincibility-theme.mp3';
const ROCKET_ENGINE_VOLUME = 0.45;
const INVINCIBILITY_THEME_VOLUME = 0.7;
const BUTTON_CLICK_VOLUME = 0.85;

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!ctx) {
    const AudioCtx = window.AudioContext
      ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    ctx = new AudioCtx();
    sfxGain = ctx.createGain();
    musicGain = ctx.createGain();
    sfxGain.connect(ctx.destination);
    musicGain.connect(ctx.destination);
    applyAudioSettings();
  }

  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  return ctx;
}

function getEffectiveMusicGain(): number {
  if (musicMutedByPause) return 0;
  return getMusicVolume() / 100;
}

function getEffectiveSfxGain(): number {
  return getSoundVolume() / 100;
}

export function initAudio(): void {
  ensureContext();
  preloadExplosionSfx();
  preloadButtonClickSfx();
  preloadRocketEngineSfx();
  preloadInvincibilityTheme();
}

function loadExplosionBuffer(): Promise<AudioBuffer | null> {
  if (explosionBuffer) {
    return Promise.resolve(explosionBuffer);
  }

  if (!explosionLoadPromise) {
    explosionLoadPromise = (async () => {
      const audioCtx = ensureContext();
      if (!audioCtx) return null;

      try {
        const response = await fetch(EXPLOSION_URL);
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        explosionBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        return explosionBuffer;
      } catch {
        return null;
      }
    })();
  }

  return explosionLoadPromise;
}

export function preloadExplosionSfx(): void {
  void loadExplosionBuffer();
}

function loadButtonClickBuffer(): Promise<AudioBuffer | null> {
  if (buttonClickBuffer) {
    return Promise.resolve(buttonClickBuffer);
  }

  if (!buttonClickLoadPromise) {
    buttonClickLoadPromise = (async () => {
      const audioCtx = ensureContext();
      if (!audioCtx) return null;

      try {
        const response = await fetch(BUTTON_CLICK_URL);
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        buttonClickBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        return buttonClickBuffer;
      } catch {
        return null;
      }
    })();
  }

  return buttonClickLoadPromise;
}

export function preloadButtonClickSfx(): void {
  void loadButtonClickBuffer();
}

function loadRocketEngineBuffer(): Promise<AudioBuffer | null> {
  if (rocketEngineBuffer) {
    return Promise.resolve(rocketEngineBuffer);
  }

  if (!rocketEngineLoadPromise) {
    rocketEngineLoadPromise = (async () => {
      const audioCtx = ensureContext();
      if (!audioCtx) return null;

      try {
        const response = await fetch(ROCKET_ENGINE_URL);
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        rocketEngineBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        return rocketEngineBuffer;
      } catch {
        return null;
      }
    })();
  }

  return rocketEngineLoadPromise;
}

export function preloadRocketEngineSfx(): void {
  void loadRocketEngineBuffer();
}

function stopRocketEngineNodes(): void {
  if (rocketEngineSource) {
    try {
      rocketEngineSource.stop();
      rocketEngineSource.disconnect();
    } catch {
      // source may already be stopped
    }
    rocketEngineSource = null;
  }

  if (rocketEngineGain) {
    try {
      rocketEngineGain.disconnect();
    } catch {
      // already disconnected
    }
    rocketEngineGain = null;
  }

  rocketEnginePlaying = false;
}

export function startRocketEngineSfx(): void {
  const audioCtx = ensureContext();
  if (!audioCtx || !sfxGain || getSoundVolume() <= 0) return;
  if (rocketEnginePlaying) return;

  void loadRocketEngineBuffer().then((buffer) => {
    if (!buffer || !ctx || !sfxGain || getSoundVolume() <= 0) return;
    if (rocketEnginePlaying) return;

    stopRocketEngineNodes();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = ROCKET_ENGINE_VOLUME;
    source.connect(gain);
    gain.connect(sfxGain);
    source.start();

    rocketEngineSource = source;
    rocketEngineGain = gain;
    rocketEnginePlaying = true;
  });
}

export function stopRocketEngineSfx(): void {
  stopRocketEngineNodes();
}

export function setRocketEngineActive(active: boolean): void {
  if (active) {
    startRocketEngineSfx();
  } else {
    stopRocketEngineSfx();
  }
}

function loadInvincibilityThemeBuffer(): Promise<AudioBuffer | null> {
  if (invincibilityThemeBuffer) {
    return Promise.resolve(invincibilityThemeBuffer);
  }

  if (!invincibilityThemeLoadPromise) {
    invincibilityThemeLoadPromise = (async () => {
      const audioCtx = ensureContext();
      if (!audioCtx) return null;

      try {
        const response = await fetch(INVINCIBILITY_THEME_URL);
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        invincibilityThemeBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        return invincibilityThemeBuffer;
      } catch {
        return null;
      }
    })();
  }

  return invincibilityThemeLoadPromise;
}

export function preloadInvincibilityTheme(): void {
  void loadInvincibilityThemeBuffer();
}

function stopInvincibilityThemeNodes(): void {
  if (invincibilityThemeSource) {
    try {
      invincibilityThemeSource.stop();
      invincibilityThemeSource.disconnect();
    } catch {
      // source may already be stopped
    }
    invincibilityThemeSource = null;
  }

  if (invincibilityThemeGain) {
    try {
      invincibilityThemeGain.disconnect();
    } catch {
      // already disconnected
    }
    invincibilityThemeGain = null;
  }

  invincibilityThemePlaying = false;
}

function beginInvincibilityTheme(): void {
  const audioCtx = ensureContext();
  if (!audioCtx || !musicGain || !invincibilityThemeDesired) return;
  if (getMusicVolume() <= 0) return;
  if (invincibilityThemePlaying) return;

  stopMusic();

  void loadInvincibilityThemeBuffer().then((buffer) => {
    if (!buffer || !ctx || !musicGain || !invincibilityThemeDesired) return;
    if (getMusicVolume() <= 0) return;
    if (invincibilityThemePlaying) return;

    stopInvincibilityThemeNodes();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = INVINCIBILITY_THEME_VOLUME;
    source.connect(gain);
    gain.connect(musicGain);
    source.start();

    invincibilityThemeSource = source;
    invincibilityThemeGain = gain;
    invincibilityThemePlaying = true;
  });
}

export function startInvincibilityTheme(): void {
  invincibilityThemeDesired = true;
  beginInvincibilityTheme();
}

export function stopInvincibilityTheme(): void {
  const wasDesired = invincibilityThemeDesired;
  invincibilityThemeDesired = false;
  stopInvincibilityThemeNodes();

  if (wasDesired && !musicMutedByPause && getMusicVolume() > 0) {
    startMusic();
  }
}

function playBufferedSample(
  buffer: AudioBuffer | null,
  volume: number,
  output: GainNode,
  fallback: () => void,
): void {
  if (!buffer || !ctx) {
    fallback();
    return;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(output);
  source.start();
}

export function playExplosionSfx(): void {
  const audioCtx = ensureContext();
  if (!audioCtx || !sfxGain || getSoundVolume() <= 0) return;

  void loadExplosionBuffer().then((buffer) => {
    playBufferedSample(buffer, 0.9, sfxGain!, () => playSfx('explosion'));
  });
}

function playUiClickFallback(audioCtx: AudioContext, output: AudioNode, now: number): void {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(640, now);
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  osc.connect(gain);
  gain.connect(output);
  osc.start(now);
  osc.stop(now + 0.05);
}

/**
 * Button clicks:
 * - 'sound' channel → Sound slider (all normal buttons + sound slider)
 * - 'music' channel → Music slider only (still works when Sound is muted)
 */
export function playUiClick(channel: UiClickChannel = 'sound'): void {
  const audioCtx = ensureContext();
  if (!audioCtx) return;

  const sliderVolume = channel === 'music' ? getMusicVolume() : getSoundVolume();
  if (sliderVolume <= 0) return;

  void loadButtonClickBuffer().then((buffer) => {
    if (!ctx) return;

    const liveVolume = channel === 'music' ? getMusicVolume() : getSoundVolume();
    if (liveVolume <= 0) return;

    // Play directly to the speakers with this slider's volume so pause-mute
    // on the music bus cannot silence UI clicks.
    const master = ctx.createGain();
    master.gain.value = (liveVolume / 100) * BUTTON_CLICK_VOLUME;
    master.connect(ctx.destination);

    if (buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(master);
      source.start();
      return;
    }

    playUiClickFallback(ctx, master, ctx.currentTime);
  });
}

export function applyAudioSettings(): void {
  if (sfxGain) sfxGain.gain.value = getEffectiveSfxGain();

  if (getSoundVolume() <= 0) {
    stopRocketEngineSfx();
  }

  if (musicGain) musicGain.gain.value = getEffectiveMusicGain();

  if (getMusicVolume() <= 0) {
    if (musicPlaying) stopMusic();
    stopInvincibilityThemeNodes();
    return;
  }

  if (invincibilityThemeDesired) {
    if (!invincibilityThemePlaying) {
      beginInvincibilityTheme();
    }
    return;
  }

  if (!musicPlaying && !musicMutedByPause) {
    startMusic();
  }
}

export function playSfx(type: SfxType): void {
  const audioCtx = ensureContext();
  if (!audioCtx) return;

  if (type === 'ui') {
    playUiClick('sound');
    return;
  }

  if (!sfxGain || getSoundVolume() <= 0) return;

  const now = audioCtx.currentTime;
  const output = sfxGain;

  if (type === 'shoot') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.05);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(output);
    osc.start(now);
    osc.stop(now + 0.06);
    return;
  }

  if (type === 'explosion') {
    const duration = 0.16;
    const bufferSize = Math.floor(audioCtx.sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + duration);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    noise.start(now);
    noise.stop(now + duration);
    return;
  }

  if (type === 'hit') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(output);
    osc.start(now);
    osc.stop(now + 0.11);
  }
}

function stopMusicNodes(): void {
  for (const osc of musicOscillators) {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // oscillator may already be stopped
    }
  }
  musicOscillators = [];

  if (musicArpTimer !== null) {
    clearInterval(musicArpTimer);
    musicArpTimer = null;
  }
}

export function startMusic(): void {
  const audioCtx = ensureContext();
  if (!audioCtx || !musicGain || musicPlaying || getMusicVolume() <= 0) return;
  if (invincibilityThemeDesired) return;

  const pad1 = audioCtx.createOscillator();
  const pad2 = audioCtx.createOscillator();
  pad1.type = 'sine';
  pad2.type = 'triangle';
  pad1.frequency.value = 55;
  pad2.frequency.value = 110;

  const padGain = audioCtx.createGain();
  padGain.gain.value = 0.035;
  pad1.connect(padGain);
  pad2.connect(padGain);
  padGain.connect(musicGain);
  pad1.start();
  pad2.start();
  musicOscillators.push(pad1, pad2);

  const arpNotes = [220, 277, 330, 392];
  let arpIndex = 0;
  musicArpTimer = setInterval(() => {
    if (!ctx || !musicGain || musicMutedByPause || getMusicVolume() <= 0) return;
    if (invincibilityThemeDesired) return;

    const note = arpNotes[arpIndex % arpNotes.length];
    arpIndex += 1;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = note;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.75);
  }, 900);

  musicPlaying = true;
  applyAudioSettings();
}

export function stopMusic(): void {
  stopMusicNodes();
  musicPlaying = false;
}

export function pauseMusic(): void {
  musicMutedByPause = true;
  applyAudioSettings();
}

export function resumeMusic(): void {
  musicMutedByPause = false;
  applyAudioSettings();
}
