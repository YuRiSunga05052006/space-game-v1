import { getMusicVolume, getSoundVolume } from './settings';

export type SfxType = 'shoot' | 'explosion' | 'hit' | 'ui';

let ctx: AudioContext | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicOscillators: OscillatorNode[] = [];
let musicArpTimer: ReturnType<typeof setInterval> | null = null;
let musicPlaying = false;
let musicMutedByPause = false;
let playerExplosionBuffer: AudioBuffer | null = null;
let playerExplosionLoadPromise: Promise<AudioBuffer | null> | null = null;

const PLAYER_EXPLOSION_URL = '/assets/player-explosion.mp3';

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
  preloadPlayerExplosionSfx();
}

function loadPlayerExplosionBuffer(): Promise<AudioBuffer | null> {
  if (playerExplosionBuffer) {
    return Promise.resolve(playerExplosionBuffer);
  }

  if (!playerExplosionLoadPromise) {
    playerExplosionLoadPromise = (async () => {
      const audioCtx = ensureContext();
      if (!audioCtx) return null;

      try {
        const response = await fetch(PLAYER_EXPLOSION_URL);
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        playerExplosionBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        return playerExplosionBuffer;
      } catch {
        return null;
      }
    })();
  }

  return playerExplosionLoadPromise;
}

export function preloadPlayerExplosionSfx(): void {
  void loadPlayerExplosionBuffer();
}

export function playPlayerExplosionSfx(): void {
  const audioCtx = ensureContext();
  if (!audioCtx || !sfxGain || getSoundVolume() <= 0) return;

  void loadPlayerExplosionBuffer().then((buffer) => {
    if (!buffer || !ctx || !sfxGain) {
      playSfx('explosion');
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = 0.9;
    source.connect(gain);
    gain.connect(sfxGain);
    source.start();
  });
}

export function applyAudioSettings(): void {
  if (sfxGain) sfxGain.gain.value = getEffectiveSfxGain();

  if (getMusicVolume() <= 0) {
    if (musicPlaying) stopMusic();
    return;
  }

  if (musicGain) musicGain.gain.value = getEffectiveMusicGain();
  if (!musicPlaying && !musicMutedByPause) {
    startMusic();
  }
}

export function playSfx(type: SfxType): void {
  const audioCtx = ensureContext();
  if (!audioCtx || !sfxGain || getSoundVolume() <= 0) return;

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
    return;
  }

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
