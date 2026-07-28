export interface WeaponLoadout {
  fireCooldownMs: number;
  bulletSpeed: number;
  bulletDamage: number;
  pierce: number;
  speedMultiplier: number;
  twinCannons: boolean;
  triShot: boolean;
  sideLasers: boolean;
  plasmaStream: boolean;
  scatterBurst: boolean;
  heavySlug: boolean;
}

export interface BulletSpawn {
  offsetX: number;
  offsetY: number;
  angle: number;
  speed: number;
  damage: number;
  pierce: number;
  texture: string;
}

export interface Weapon {
  id: string;
  name: string;
  description: string;
  color: number;
  apply: (loadout: WeaponLoadout) => void;
}

export function createDefaultLoadout(): WeaponLoadout {
  return {
    fireCooldownMs: 180,
    bulletSpeed: 500,
    bulletDamage: 1,
    pierce: 0,
    speedMultiplier: 1,
    twinCannons: false,
    triShot: false,
    sideLasers: false,
    plasmaStream: false,
    scatterBurst: false,
    heavySlug: false,
  };
}

const DEG = Math.PI / 180;

export const WEAPONS: Weapon[] = [
  {
    id: 'twin-cannons',
    name: 'Twin Cannons',
    description: '+1 parallel bullet',
    color: 0x00d4ff,
    apply: (l) => { l.twinCannons = true; },
  },
  {
    id: 'tri-shot',
    name: 'Tri-Shot',
    description: '3 bullets in a 20° spread',
    color: 0x00ffcc,
    apply: (l) => { l.triShot = true; },
  },
  {
    id: 'rapid-pulse',
    name: 'Rapid Pulse',
    description: 'Fire rate +25%',
    color: 0xffcc00,
    apply: (l) => { l.fireCooldownMs *= 0.75; },
  },
  {
    id: 'heavy-slug',
    name: 'Heavy Slug',
    description: '+1 bullet damage',
    color: 0xff8844,
    apply: (l) => {
      l.heavySlug = true;
      l.bulletDamage += 1;
    },
  },
  {
    id: 'piercing-beam',
    name: 'Piercing Beam',
    description: 'Bullets pierce 1 enemy',
    color: 0xaa66ff,
    apply: (l) => { l.pierce += 1; },
  },
  {
    id: 'side-lasers',
    name: 'Side Lasers',
    description: '+2 wing bullets at ±35°',
    color: 0x44ff88,
    apply: (l) => { l.sideLasers = true; },
  },
  {
    id: 'plasma-stream',
    name: 'Plasma Stream',
    description: '+1 bullet, +15% speed',
    color: 0xff44aa,
    apply: (l) => {
      l.plasmaStream = true;
      l.bulletSpeed *= 1.15;
    },
  },
  {
    id: 'scatter-burst',
    name: 'Scatter Burst',
    description: '+4 wide fan',
    color: 0xff6644,
    apply: (l) => {
      l.scatterBurst = true;
    },
  },
  {
    id: 'turbo-engine',
    name: 'Turbo Engine',
    description: 'Move speed +20%',
    color: 0x66aaff,
    apply: (l) => { l.speedMultiplier *= 1.2; },
  },
  {
    id: 'overcharger',
    name: 'Overcharger',
    description: 'Fire rate +15%, bullet speed +30%',
    color: 0xffee44,
    apply: (l) => {
      l.fireCooldownMs *= 0.85;
      l.bulletSpeed *= 1.3;
    },
  },
];

export function getWeaponById(id: string): Weapon | undefined {
  return WEAPONS.find((w) => w.id === id);
}

export function rollWeaponChoices(ownedIds: string[], count = 3): Weapon[] {
  const available = WEAPONS.filter((w) => !ownedIds.includes(w.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function computePlayerPowerScore(loadout: WeaponLoadout, weaponCount: number): number {
  const pattern = buildFirePattern(loadout);
  const shotsPerVolley = pattern.length;
  const fireRateFactor = 180 / loadout.fireCooldownMs;
  const dpsScore = shotsPerVolley * loadout.bulletDamage * fireRateFactor;
  const weaponBonus = weaponCount * 1.5;
  return dpsScore + weaponBonus;
}

export function buildFirePattern(loadout: WeaponLoadout): BulletSpawn[] {
  const shots: BulletSpawn[] = [];
  const baseAngle = -Math.PI / 2;
  const speed = loadout.bulletSpeed;
  const damage = loadout.bulletDamage;
  const pierce = loadout.pierce;
  const texture = loadout.heavySlug ? 'bullet-heavy' : 'bullet';

  const addShot = (offsetX: number, offsetY: number, angleOffset: number, tex = texture) => {
    shots.push({
      offsetX,
      offsetY,
      angle: baseAngle + angleOffset,
      speed,
      damage,
      pierce,
      texture: tex,
    });
  };

  addShot(0, 0, 0);

  if (loadout.twinCannons) {
    addShot(-10, 0, 0);
  }

  if (loadout.triShot) {
    addShot(0, 0, -10 * DEG);
    addShot(0, 0, 0);
    addShot(0, 0, 10 * DEG);
  }

  if (loadout.sideLasers) {
    addShot(-8, 4, -35 * DEG);
    addShot(8, 4, 35 * DEG);
  }

  if (loadout.plasmaStream) {
    addShot(0, -4, 0);
  }

  if (loadout.scatterBurst) {
    const spread = 60 * DEG;
    const steps = 4;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1) - 0.5;
      addShot(t * 12, 0, t * spread);
    }
  }

  return shots;
}
