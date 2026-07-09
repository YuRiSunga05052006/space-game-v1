export interface BackgroundTheme {
  id: string;
  skyTop: number;
  skyBottom: number;
  starColor: number;
  planetColor: number;
  planetSize: number;
  planetX: number;
  accentColor: number;
}

export const BACKGROUND_THEMES: Record<string, BackgroundTheme> = {
  jupiter: {
    id: 'jupiter',
    skyTop: 0x0a1028,
    skyBottom: 0x1a2848,
    starColor: 0xaaccff,
    planetColor: 0xcc8844,
    planetSize: 80,
    planetX: 0.72,
    accentColor: 0xddaa55,
  },
  saturn: {
    id: 'saturn',
    skyTop: 0x101018,
    skyBottom: 0x282838,
    starColor: 0xccccdd,
    planetColor: 0xddbb88,
    planetSize: 70,
    planetX: 0.68,
    accentColor: 0xeecc99,
  },
  titan: {
    id: 'titan',
    skyTop: 0x181008,
    skyBottom: 0x3a2818,
    starColor: 0xffcc88,
    planetColor: 0xaa7744,
    planetSize: 58,
    planetX: 0.74,
    accentColor: 0xff9944,
  },
  uranus: {
    id: 'uranus',
    skyTop: 0x081820,
    skyBottom: 0x183848,
    starColor: 0x88ccdd,
    planetColor: 0x66bbcc,
    planetSize: 64,
    planetX: 0.76,
    accentColor: 0x88ddff,
  },
  neptune: {
    id: 'neptune',
    skyTop: 0x080818,
    skyBottom: 0x182848,
    starColor: 0x8899ff,
    planetColor: 0x2244aa,
    planetSize: 66,
    planetX: 0.7,
    accentColor: 0x4466ff,
  },
  kuiper: {
    id: 'kuiper',
    skyTop: 0x060610,
    skyBottom: 0x141828,
    starColor: 0x99aabb,
    planetColor: 0x556677,
    planetSize: 44,
    planetX: 0.65,
    accentColor: 0x778899,
  },
  pluto: {
    id: 'pluto',
    skyTop: 0x080810,
    skyBottom: 0x1a1a28,
    starColor: 0xbbccdd,
    planetColor: 0x998877,
    planetSize: 40,
    planetX: 0.78,
    accentColor: 0xaabbcc,
  },
  eris: {
    id: 'eris',
    skyTop: 0x100818,
    skyBottom: 0x281830,
    starColor: 0xcc88aa,
    planetColor: 0x884466,
    planetSize: 38,
    planetX: 0.72,
    accentColor: 0xcc6699,
  },
  sedna: {
    id: 'sedna',
    skyTop: 0x100808,
    skyBottom: 0x281818,
    starColor: 0xdd9988,
    planetColor: 0xaa5544,
    planetSize: 36,
    planetX: 0.8,
    accentColor: 0xdd7766,
  },
  oort: {
    id: 'oort',
    skyTop: 0x040408,
    skyBottom: 0x101018,
    starColor: 0xccccff,
    planetColor: 0x334466,
    planetSize: 90,
    planetX: 0.5,
    accentColor: 0x88aaff,
  },
};

export function getBackgroundTheme(themeId: string): BackgroundTheme {
  return BACKGROUND_THEMES[themeId] ?? BACKGROUND_THEMES.jupiter;
}
