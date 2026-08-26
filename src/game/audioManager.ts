import { assetUrl } from './assetUrl';
import { getMusicVolume, getSoundVolume } from './settings';

export type SfxType = 'shoot' | 'enemyLaser' | 'explosion' | 'hit' | 'ui';
export type UiClickChannel = 'sound' | 'music';

let ctx: AudioContext | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let mainThemeBuffer: AudioBuffer | null = null;
let mainThemeLoadPromise: Promise<AudioBuffer | null> | null = null;
let mainThemeSource: AudioBufferSourceNode | null = null;
let mainThemeGain: GainNode | null = null;
let musicPlaying = false;
/** True while gameplay UI has paused themes (pause / loot / victory / game over). */
let musicSuspended = false;
/** True while music must stay silent (e.g. launch cutscene) until startMusic(). */
let musicSuppressed = false;
let mainThemeResumeOffset = 0;
let mainThemeStartedAt = 0;
let explosionBuffers: AudioBuffer[] = [];
let explosionLoadPromise: Promise<AudioBuffer[]> | null = null;
let hitBuffers: AudioBuffer[] = [];
let hitLoadPromise: Promise<AudioBuffer[]> | null = null;
let rockBuffers: AudioBuffer[] = [];
let rockLoadPromise: Promise<AudioBuffer[]> | null = null;
let rockBreakBuffers: AudioBuffer[] = [];
let rockBreakLoadPromise: Promise<AudioBuffer[]> | null = null;
let buttonClickBuffer: AudioBuffer | null = null;
let buttonClickLoadPromise: Promise<AudioBuffer | null> | null = null;
let laserBuffer: AudioBuffer | null = null;
let laserLoadPromise: Promise<AudioBuffer | null> | null = null;
let enemyLaserBuffer: AudioBuffer | null = null;
let enemyLaserLoadPromise: Promise<AudioBuffer | null> | null = null;
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
let invincibilityThemeResumeOffset = 0;
let invincibilityThemeStartedAt = 0;
let alarmBuffer: AudioBuffer | null = null;
let alarmLoadPromise: Promise<AudioBuffer | null> | null = null;

const EXPLOSION_URLS = [
  assetUrl('assets/explosion1.mp3'),
  assetUrl('assets/explosion2.mp3'),
  assetUrl('assets/explosion3.mp3'),
  assetUrl('assets/explosion4.mp3'),
];
const HIT_URLS = [
  assetUrl('assets/hit1.mp3'),
  assetUrl('assets/hit2.mp3'),
];
const ROCK_URLS = [
  assetUrl('assets/rock1.mp3'),
  assetUrl('assets/rock2.mp3'),
  assetUrl('assets/rock3.mp3'),
];
const ROCK_BREAK_URLS = [
  assetUrl('assets/rock-break1.mp3'),
  assetUrl('assets/rock-break2.mp3'),
  assetUrl('assets/rock-break3.mp3'),
];
const BUTTON_CLICK_URL = assetUrl('assets/button-click.mp3');
const LASER_URL = assetUrl('assets/laser.mp3');
const ENEMY_LASER_URL = assetUrl('assets/laser-enemy.mp3');
const ROCKET_ENGINE_URL = assetUrl('assets/rocket-engine.mp3');
const INVINCIBILITY_THEME_URL = assetUrl('assets/invincibility-theme.mp3');
const MAIN_THEME_URL = assetUrl('assets/main-theme.mp3');
const ALARM_URL = assetUrl('assets/alarm.mp3');
const ROCKET_ENGINE_VOLUME = 0.45;
const INVINCIBILITY_THEME_VOLUME = 0.35;
const MAIN_THEME_VOLUME = 0.20;
const BUTTON_CLICK_VOLUME = 0.85;
const LASER_VOLUME = 0.45;
const ENEMY_LASER_VOLUME = 0.5;
const HIT_VOLUME = 0.85;
const ALARM_VOLUME = 0.9;
const ROCK_VOLUME = 0.8;
const ROCK_BREAK_VOLUME = 0.9;

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

  return ctx;
}

/** Browsers require a user gesture before audio runs; Tauri/WebView is more lenient. */
async function getRunningAudioContext(): Promise<AudioContext | null> {
  const audioCtx = ensureContext();
  if (!audioCtx) return null;

  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
    } catch {
      return null;
    }
  }

  return audioCtx.state === 'running' ? audioCtx : null;
}

function getEffectiveMusicGain(): number {
  return getMusicVolume() / 100;
}

function wrapOffset(offsetSec: number, duration: number): number {
  if (duration <= 0) return 0;
  const wrapped = offsetSec % duration;
  return wrapped < 0 ? wrapped + duration : wrapped;
}

function captureMainThemeOffset(): number {
  if (!ctx || !mainThemeBuffer || !mainThemeSource || !musicPlaying) {
    return mainThemeResumeOffset;
  }
  return wrapOffset(ctx.currentTime - mainThemeStartedAt, mainThemeBuffer.duration);
}

function captureInvincibilityOffset(): number {
  if (!ctx || !invincibilityThemeBuffer || !invincibilityThemeSource || !invincibilityThemePlaying) {
    return invincibilityThemeResumeOffset;
  }
  return wrapOffset(ctx.currentTime - invincibilityThemeStartedAt, invincibilityThemeBuffer.duration);
}

function getEffectiveSfxGain(): number {
  return getSoundVolume() / 100;
}

export async function initAudio(): Promise<void> {
  const audioCtx = await getRunningAudioContext();
  if (!audioCtx) return;
  preloadExplosionSfx();
  preloadHitSfx();
  preloadRockSfx();
  preloadRockBreakSfx();
  preloadButtonClickSfx();
  preloadLaserSfx();
  preloadEnemyLaserSfx();
  preloadRocketEngineSfx();
  preloadInvincibilityTheme();
  preloadMainTheme();
  preloadAlarmSfx();
}

function loadMainThemeBuffer(): Promise<AudioBuffer | null> {
  if (mainThemeBuffer) {
    return Promise.resolve(mainThemeBuffer);
  }

  if (!mainThemeLoadPromise) {
    mainThemeLoadPromise = (async () => {
      const audioCtx = await getRunningAudioContext();
      if (!audioCtx) return null;

      try {
        const response = await fetch(MAIN_THEME_URL);
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        mainThemeBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        return mainThemeBuffer;
      } catch {
        return null;
      }
    })();
  }

  return mainThemeLoadPromise;
}

export function preloadMainTheme(): void {
  void loadMainThemeBuffer();
}

function loadExplosionBuffers(): Promise<AudioBuffer[]> {
  if (explosionBuffers.length > 0) {
    return Promise.resolve(explosionBuffers);
  }

  if (!explosionLoadPromise) {
    explosionLoadPromise = (async () => {
      const audioCtx = await getRunningAudioContext();
      if (!audioCtx) return [];

      const loaded: AudioBuffer[] = [];
      await Promise.all(
        EXPLOSION_URLS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (!response.ok) return;
            const arrayBuffer = await response.arrayBuffer();
            loaded.push(await audioCtx.decodeAudioData(arrayBuffer));
          } catch {
            // skip failed sample
          }
        }),
      );
      explosionBuffers = loaded;
      return explosionBuffers;
    })();
  }

  return explosionLoadPromise;
}

function pickRandomExplosionBuffer(buffers: AudioBuffer[]): AudioBuffer | null {
  if (buffers.length === 0) return null;
  return buffers[Math.floor(Math.random() * buffers.length)];
}

export function preloadExplosionSfx(): void {
  void loadExplosionBuffers();
}

function loadAlarmBuffer(): Promise<AudioBuffer | null> {
  if (alarmBuffer) {
    return Promise.resolve(alarmBuffer);
  }

  if (!alarmLoadPromise) {
    alarmLoadPromise = (async () => {
      const audioCtx = await getRunningAudioContext();
      if (!audioCtx) return null;

      try {
        const response = await fetch(ALARM_URL);
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        alarmBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        return alarmBuffer;
      } catch {
        return null;
      }
    })();
  }

  return alarmLoadPromise;
}

export function preloadAlarmSfx(): void {
  void loadAlarmBuffer();
}

function playAlarmSample(onComplete?: () => void): void {
  if (getSoundVolume() <= 0) return;

  void getRunningAudioContext().then((audioCtx) => {
    if (!audioCtx || !sfxGain || getSoundVolume() <= 0) return;

    void loadAlarmBuffer().then((buffer) => {
      if (!buffer || !ctx || !sfxGain) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.value = ALARM_VOLUME;
      source.connect(gain);
      gain.connect(sfxGain);
      source.onended = () => onComplete?.();
      source.start();
    });
  });
}

/** Single alarm clip (reset progress, low HP, etc.). */
export function playAlarmSfx(): void {
  playAlarmSample();
}

/** Low HP warning — plays once when HP drops to 4 or below from damage. */
export function playLowHpAlarmSfx(): void {
  playAlarmSfx();
}

/** Boss entrance — plays the alarm three times in sequence. */
export function playBossAppearAlarmSfx(): void {
  const playNext = (remaining: number) => {
    if (remaining <= 0 || getSoundVolume() <= 0) return;
    playAlarmSample(() => {
      if (remaining > 1) {
        window.setTimeout(() => playNext(remaining - 1), 120);
      }
    });
  };
  playNext(3);
}

function loadHitBuffers(): Promise<AudioBuffer[]> {
  if (hitBuffers.length > 0) {
    return Promise.resolve(hitBuffers);
  }

  if (!hitLoadPromise) {
    hitLoadPromise = (async () => {
      const audioCtx = await getRunningAudioContext();
      if (!audioCtx) return [];

      const loaded: AudioBuffer[] = [];
      await Promise.all(
        HIT_URLS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (!response.ok) return;
            const arrayBuffer = await response.arrayBuffer();
            loaded.push(await audioCtx.decodeAudioData(arrayBuffer));
          } catch {
            // skip failed sample
          }
        }),
      );
      hitBuffers = loaded;
      return hitBuffers;
    })();
  }

  return hitLoadPromise;
}

function pickRandomHitBuffer(buffers: AudioBuffer[]): AudioBuffer | null {
  if (buffers.length === 0) return null;
  return buffers[Math.floor(Math.random() * buffers.length)];
}

export function preloadHitSfx(): void {
  void loadHitBuffers();
}

function loadRockBuffers(): Promise<AudioBuffer[]> {
  if (rockBuffers.length > 0) {
    return Promise.resolve(rockBuffers);
  }

  if (!rockLoadPromise) {
    rockLoadPromise = (async () => {
      const audioCtx = await getRunningAudioContext();
      if (!audioCtx) return [];

      const loaded: AudioBuffer[] = [];
      await Promise.all(
        ROCK_URLS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (!response.ok) return;
            const arrayBuffer = await response.arrayBuffer();
            loaded.push(await audioCtx.decodeAudioData(arrayBuffer));
          } catch {
            // skip failed sample
          }
        }),
      );
      rockBuffers = loaded;
      return rockBuffers;
    })();
  }

  return rockLoadPromise;
}

function loadRockBreakBuffers(): Promise<AudioBuffer[]> {
  if (rockBreakBuffers.length > 0) {
    return Promise.resolve(rockBreakBuffers);
  }

  if (!rockBreakLoadPromise) {
    rockBreakLoadPromise = (async () => {
      const audioCtx = await getRunningAudioContext();
      if (!audioCtx) return [];

      const loaded: AudioBuffer[] = [];
      await Promise.all(
        ROCK_BREAK_URLS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (!response.ok) return;
            const arrayBuffer = await response.arrayBuffer();
            loaded.push(await audioCtx.decodeAudioData(arrayBuffer));
          } catch {
            // skip failed sample
          }
        }),
      );
      rockBreakBuffers = loaded;
      return rockBreakBuffers;
    })();
  }

  return rockBreakLoadPromise;
}

function pickRandomBuffer(buffers: AudioBuffer[]): AudioBuffer | null {
  if (buffers.length === 0) return null;
  return buffers[Math.floor(Math.random() * buffers.length)];
}

export function preloadRockSfx(): void {
  void loadRockBuffers();
}

export function preloadRockBreakSfx(): void {
  void loadRockBreakBuffers();
}

function playHitOscillatorFallback(audioCtx: AudioContext, output: GainNode, now: number): void {
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

export function playHitSfx(): void {
  if (getSoundVolume() <= 0) return;

  void getRunningAudioContext().then((audioCtx) => {
    if (!audioCtx || !sfxGain || getSoundVolume() <= 0) return;

    void loadHitBuffers().then((buffers) => {
      const buffer = pickRandomHitBuffer(buffers);
      playBufferedSample(buffer, HIT_VOLUME, sfxGain!, () => {
        playHitOscillatorFallback(audioCtx, sfxGain!, audioCtx.currentTime);
      });
    });
  });
}

/** Laser tick damage on asteroids/comets (randomized rock1–3). */
export function playRockSfx(): void {
  if (getSoundVolume() <= 0) return;

  void getRunningAudioContext().then((audioCtx) => {
    if (!audioCtx || !sfxGain || getSoundVolume() <= 0) return;

    void loadRockBuffers().then((buffers) => {
      const buffer = pickRandomBuffer(buffers);
      playBufferedSample(buffer, ROCK_VOLUME, sfxGain!, () => {
        playHitOscillatorFallback(audioCtx, sfxGain!, audioCtx.currentTime);
      });
    });
  });
}

/** Asteroid/comet destroyed by laser, shield, invuln, boost, or mine blast (randomized rock-break1–3). */
export function playRockBreakSfx(): void {
  if (getSoundVolume() <= 0) return;

  void getRunningAudioContext().then((audioCtx) => {
    if (!audioCtx || !sfxGain || getSoundVolume() <= 0) return;

    void loadRockBreakBuffers().then((buffers) => {
      const buffer = pickRandomBuffer(buffers);
      playBufferedSample(buffer, ROCK_BREAK_VOLUME, sfxGain!, () => {
        playHitOscillatorFallback(audioCtx, sfxGain!, audioCtx.currentTime);
      });
    });
  });
}

function loadButtonClickBuffer(): Promise<AudioBuffer | null> {
  if (buttonClickBuffer) {
    return Promise.resolve(buttonClickBuffer);
  }

  if (!buttonClickLoadPromise) {
    buttonClickLoadPromise = (async () => {
      const audioCtx = await getRunningAudioContext();
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

function loadLaserBuffer(): Promise<AudioBuffer | null> {
  if (laserBuffer) {
    return Promise.resolve(laserBuffer);
  }

  if (!laserLoadPromise) {
    laserLoadPromise = (async () => {
      const audioCtx = await getRunningAudioContext();
      if (!audioCtx) return null;

      try {
        const response = await fetch(LASER_URL);
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        laserBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        return laserBuffer;
      } catch {
        return null;
      }
    })();
  }

  return laserLoadPromise;
}

export function preloadLaserSfx(): void {
  void loadLaserBuffer();
}

function loadEnemyLaserBuffer(): Promise<AudioBuffer | null> {
  if (enemyLaserBuffer) {
    return Promise.resolve(enemyLaserBuffer);
  }

  if (!enemyLaserLoadPromise) {
    enemyLaserLoadPromise = (async () => {
      const audioCtx = await getRunningAudioContext();
      if (!audioCtx) return null;

      try {
        const response = await fetch(ENEMY_LASER_URL);
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        enemyLaserBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        return enemyLaserBuffer;
      } catch {
        return null;
      }
    })();
  }

  return enemyLaserLoadPromise;
}

export function preloadEnemyLaserSfx(): void {
  void loadEnemyLaserBuffer();
}

function playEnemyLaserOscillatorFallback(audioCtx: AudioContext, output: GainNode, now: number): void {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(280, now + 0.08);
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.connect(gain);
  gain.connect(output);
  osc.start(now);
  osc.stop(now + 0.09);
}

function loadRocketEngineBuffer(): Promise<AudioBuffer | null> {
  if (rocketEngineBuffer) {
    return Promise.resolve(rocketEngineBuffer);
  }

  if (!rocketEngineLoadPromise) {
    rocketEngineLoadPromise = (async () => {
      const audioCtx = await getRunningAudioContext();
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
  if (getSoundVolume() <= 0) return;
  if (rocketEnginePlaying) return;

  void getRunningAudioContext().then((audioCtx) => {
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
      const audioCtx = await getRunningAudioContext();
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

function beginInvincibilityTheme(offsetSec = 0): void {
  if (!invincibilityThemeDesired) return;
  if (getMusicVolume() <= 0) return;
  if (musicSuspended) return;
  if (invincibilityThemePlaying) return;

  void getRunningAudioContext().then((audioCtx) => {
    if (!audioCtx || !musicGain || !invincibilityThemeDesired) return;
    if (getMusicVolume() <= 0 || musicSuspended) return;
    if (invincibilityThemePlaying) return;

    // Invincibility replaces the main theme (restart main later from the start).
    musicSuspended = false;
    mainThemeResumeOffset = 0;
    stopMusicNodes();
    musicPlaying = false;

    void loadInvincibilityThemeBuffer().then((buffer) => {
      if (!buffer || !ctx || !musicGain || !invincibilityThemeDesired) return;
      if (getMusicVolume() <= 0 || musicSuspended) return;
      if (invincibilityThemePlaying) return;

      stopInvincibilityThemeNodes();

      const startOffset = wrapOffset(offsetSec, buffer.duration);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = INVINCIBILITY_THEME_VOLUME;
      source.connect(gain);
      gain.connect(musicGain);
      source.start(0, startOffset);

      invincibilityThemeSource = source;
      invincibilityThemeGain = gain;
      invincibilityThemePlaying = true;
      invincibilityThemeResumeOffset = startOffset;
      invincibilityThemeStartedAt = ctx.currentTime - startOffset;
    });
  });
}

export function startInvincibilityTheme(): void {
  invincibilityThemeDesired = true;
  invincibilityThemeResumeOffset = 0;
  beginInvincibilityTheme(0);
}

export function stopInvincibilityTheme(): void {
  const wasDesired = invincibilityThemeDesired;
  invincibilityThemeDesired = false;
  invincibilityThemeResumeOffset = 0;
  stopInvincibilityThemeNodes();

  if (wasDesired && !musicSuspended && getMusicVolume() > 0) {
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
  if (getSoundVolume() <= 0) return;

  void getRunningAudioContext().then((audioCtx) => {
    if (!audioCtx || !sfxGain || getSoundVolume() <= 0) return;

    void loadExplosionBuffers().then((buffers) => {
      const buffer = pickRandomExplosionBuffer(buffers);
      playBufferedSample(buffer, 0.9, sfxGain!, () => playSfx('explosion'));
    });
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
  const sliderVolume = channel === 'music' ? getMusicVolume() : getSoundVolume();
  if (sliderVolume <= 0) return;

  void getRunningAudioContext().then((audioCtx) => {
    if (!audioCtx || !ctx) return;

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
  });
}

export function applyAudioSettings(): void {
  if (sfxGain) sfxGain.gain.value = getEffectiveSfxGain();

  if (getSoundVolume() <= 0) {
    stopRocketEngineSfx();
  }

  if (musicGain) musicGain.gain.value = getEffectiveMusicGain();

  if (getMusicVolume() <= 0) {
    if (musicPlaying) {
      mainThemeResumeOffset = captureMainThemeOffset();
      stopMusicNodes();
      musicPlaying = false;
    }
    if (invincibilityThemePlaying) {
      invincibilityThemeResumeOffset = captureInvincibilityOffset();
      stopInvincibilityThemeNodes();
    }
    return;
  }

  // Suspended (pause/loot/victory/game over) or suppressed (launch cutscene).
  if (musicSuspended || musicSuppressed) return;

  if (invincibilityThemeDesired) {
    if (!invincibilityThemePlaying) {
      beginInvincibilityTheme(invincibilityThemeResumeOffset);
    }
    return;
  }

  if (!musicPlaying) {
    startMusic();
  }
}

function playShootOscillatorFallback(audioCtx: AudioContext, output: GainNode, now: number): void {
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
}

export function playSfx(type: SfxType): void {
  void getRunningAudioContext().then((audioCtx) => {
    if (!audioCtx) return;

    if (type === 'ui') {
      playUiClick('sound');
      return;
    }

    if (!sfxGain || getSoundVolume() <= 0) return;

    const now = audioCtx.currentTime;
    const output = sfxGain;

  if (type === 'shoot') {
    void loadLaserBuffer().then((buffer) => {
      if (!ctx || !sfxGain) return;
      playBufferedSample(buffer, LASER_VOLUME, sfxGain, () => {
        playShootOscillatorFallback(audioCtx, output, now);
      });
    });
    return;
  }

  if (type === 'enemyLaser') {
    void loadEnemyLaserBuffer().then((buffer) => {
      if (!ctx || !sfxGain) return;
      playBufferedSample(buffer, ENEMY_LASER_VOLUME, sfxGain, () => {
        playEnemyLaserOscillatorFallback(audioCtx, output, now);
      });
    });
    return;
  }

  if (type === 'explosion') {
    void loadExplosionBuffers().then((buffers) => {
      if (!ctx || !sfxGain) return;
      const sample = pickRandomExplosionBuffer(buffers);
      playBufferedSample(sample, 0.9, sfxGain, () => {
        const duration = 0.16;
        const bufferSize = Math.floor(audioCtx.sampleRate * duration);
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
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
      });
    });
    return;
  }

  if (type === 'hit') {
    void loadHitBuffers().then((buffers) => {
      if (!ctx || !sfxGain) return;
      const sample = pickRandomHitBuffer(buffers);
      playBufferedSample(sample, HIT_VOLUME, sfxGain, () => {
        playHitOscillatorFallback(audioCtx, output, now);
      });
    });
  }
  });
}

function stopMusicNodes(): void {
  if (mainThemeSource) {
    try {
      mainThemeSource.stop();
      mainThemeSource.disconnect();
    } catch {
      // source may already be stopped
    }
    mainThemeSource = null;
  }

  if (mainThemeGain) {
    try {
      mainThemeGain.disconnect();
    } catch {
      // already disconnected
    }
    mainThemeGain = null;
  }
}

function playMainThemeAt(offsetSec: number): void {
  if (getMusicVolume() <= 0) return;
  if (invincibilityThemeDesired) return;
  if (musicSuspended || musicSuppressed) return;

  void getRunningAudioContext().then((audioCtx) => {
    if (!audioCtx || !musicGain || getMusicVolume() <= 0) return;
    if (invincibilityThemeDesired || musicSuspended || musicSuppressed) return;

    void loadMainThemeBuffer().then((buffer) => {
      if (!buffer || !ctx || !musicGain || getMusicVolume() <= 0) return;
      if (invincibilityThemeDesired || musicSuspended || musicSuppressed) return;

      stopMusicNodes();

      const startOffset = wrapOffset(offsetSec, buffer.duration);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = MAIN_THEME_VOLUME;
      source.connect(gain);
      gain.connect(musicGain);
      source.start(0, startOffset);

      mainThemeSource = source;
      mainThemeGain = gain;
      musicPlaying = true;
      mainThemeResumeOffset = startOffset;
      mainThemeStartedAt = ctx.currentTime - startOffset;
      applyAudioSettings();
    });
  });
}

/** Start / restart the main theme from the beginning. */
export function startMusic(): void {
  musicSuspended = false;
  musicSuppressed = false;
  mainThemeResumeOffset = 0;

  if (getMusicVolume() <= 0) return;
  if (invincibilityThemeDesired) {
    // Keep invincibility if active; ensure it is audible from its saved/start offset.
    if (!invincibilityThemePlaying) {
      beginInvincibilityTheme(invincibilityThemeResumeOffset);
    }
    return;
  }

  stopMusicNodes();
  musicPlaying = false;
  playMainThemeAt(0);
}

/**
 * Keep music playing across menu navigation.
 * Restarts from the beginning only when returning from a suspended gameplay state
 * (pause / loot / victory / game over) or when nothing is playing yet.
 */
export function ensureMusic(): void {
  musicSuppressed = false;

  if (getMusicVolume() <= 0) return;

  if (musicSuspended) {
    startMusic();
    return;
  }

  if (invincibilityThemeDesired) {
    if (!invincibilityThemePlaying) {
      beginInvincibilityTheme(invincibilityThemeResumeOffset);
    }
    return;
  }

  if (musicPlaying && mainThemeSource) {
    applyAudioSettings();
    return;
  }

  startMusic();
}

/** Stop themes and keep them silent until the next startMusic() (launch cutscene). */
export function stopMusic(): void {
  stopMusicNodes();
  musicPlaying = false;
  musicSuspended = false;
  mainThemeResumeOffset = 0;
  musicSuppressed = true;
  if (invincibilityThemePlaying) {
    invincibilityThemeResumeOffset = 0;
    stopInvincibilityThemeNodes();
  }
}

/** Pause main / invincibility themes in place (no seek-to-start on resume). */
export function pauseMusic(): void {
  if (musicSuspended) return;

  if (invincibilityThemePlaying) {
    invincibilityThemeResumeOffset = captureInvincibilityOffset();
    stopInvincibilityThemeNodes();
  } else if (musicPlaying) {
    mainThemeResumeOffset = captureMainThemeOffset();
    stopMusicNodes();
    musicPlaying = false;
  }

  musicSuspended = true;
}

/** Resume the suspended theme from the saved playback position. */
export function resumeMusic(): void {
  if (!musicSuspended) return;

  musicSuspended = false;

  if (getMusicVolume() <= 0) {
    applyAudioSettings();
    return;
  }

  if (invincibilityThemeDesired) {
    beginInvincibilityTheme(invincibilityThemeResumeOffset);
    return;
  }

  playMainThemeAt(mainThemeResumeOffset);
}
