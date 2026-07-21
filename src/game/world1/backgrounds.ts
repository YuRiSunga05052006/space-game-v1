export interface BackgroundTheme {
  id: string;
  skyTop: number;
  skyBottom: number;
  starColor: number;
  planetColor: number;
  planetSize: number;
  /** Horizontal position as fraction of screen width (0â€“1). */
  planetX: number;
  accentColor: number;
}

export const BACKGROUND_THEMES: Record<string, BackgroundTheme> = {
  earth: {
    id: 'earth',
    skyTop: 0x0a1a3a,
    skyBottom: 0x1a3a6a,
    starColor: 0xaaccff,
    planetColor: 0x2266cc,
    planetSize: 72,
    planetX: 0.78,
    accentColor: 0x44aaff,
  },
  moon: {
    id: 'moon',
    skyTop: 0x080810,
    skyBottom: 0x1a1a28,
    starColor: 0xccccdd,
    planetColor: 0x888899,
    planetSize: 56,
    planetX: 0.72,
    accentColor: 0x99aabb,
  },
  venus: {
    id: 'venus',
    skyTop: 0x2a1808,
    skyBottom: 0x6a4010,
    starColor: 0xffcc88,
    planetColor: 0xcc8833,
    planetSize: 64,
    planetX: 0.75,
    accentColor: 0xffaa44,
  },
  mercury: {
    id: 'mercury',
    skyTop: 0x1a1008,
    skyBottom: 0x3a2810,
    starColor: 0xffddaa,
    planetColor: 0x998877,
    planetSize: 48,
    planetX: 0.8,
    accentColor: 0xffcc66,
  },
  mars: {
    id: 'mars',
    skyTop: 0x1a0808,
    skyBottom: 0x4a1810,
    starColor: 0xffaa88,
    planetColor: 0xcc4422,
    planetSize: 68,
    planetX: 0.76,
    accentColor: 0xff6644,
  },
  beltEntry: {
    id: 'beltEntry',
    skyTop: 0x0a0a12,
    skyBottom: 0x1a1820,
    starColor: 0xbb9988,
    planetColor: 0x665544,
    planetSize: 40,
    planetX: 0.7,
    accentColor: 0xaa8866,
  },
  vesta: {
    id: 'vesta',
    skyTop: 0x100c0a,
    skyBottom: 0x281a14,
    starColor: 0xccaa88,
    planetColor: 0xaa6644,
    planetSize: 44,
    planetX: 0.74,
    accentColor: 0xcc8855,
  },
  pallas: {
    id: 'pallas',
    skyTop: 0x0a0c14,
    skyBottom: 0x141a28,
    starColor: 0x8899cc,
    planetColor: 0x556688,
    planetSize: 42,
    planetX: 0.73,
    accentColor: 0x6688bb,
  },
  ceres: {
    id: 'ceres',
    skyTop: 0x0a1018,
    skyBottom: 0x182030,
    starColor: 0xaabbcc,
    planetColor: 0x778899,
    planetSize: 50,
    planetX: 0.77,
    accentColor: 0x88aacc,
  },
  beltFinale: {
    id: 'beltFinale',
    skyTop: 0x060608,
    skyBottom: 0x121018,
    starColor: 0x998877,
    planetColor: 0x443322,
    planetSize: 80,
    planetX: 0.5,
    accentColor: 0xcc6644,
  },
  iss: {
    id: 'iss',
    skyTop: 0x020208,
    skyBottom: 0x0c1a3a,
    starColor: 0xccccff,
    planetColor: 0x8899aa,
    planetSize: 0,
    planetX: 0.5,
    accentColor: 0x00d4ff,
  },
  dawn: {
    id: 'dawn',
    skyTop: 0x080810,
    skyBottom: 0x182838,
    starColor: 0xaabbcc,
    planetColor: 0x667788,
    planetSize: 0,
    planetX: 0.5,
    accentColor: 0x88aacc,
  },
  survival: {
    id: 'survival',
    skyTop: 0x0a0e27,
    skyBottom: 0x0a0e27,
    starColor: 0xffffff,
    planetColor: 0x0a0e27,
    planetSize: 0,
    planetX: 0.5,
    accentColor: 0xffcc00,
  },
};

export function getBackgroundTheme(themeId: string): BackgroundTheme {
  return BACKGROUND_THEMES[themeId] ?? BACKGROUND_THEMES.earth;
}
