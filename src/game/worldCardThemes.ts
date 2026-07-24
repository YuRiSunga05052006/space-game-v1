import type { BackgroundTheme } from './world1/backgrounds';

const WORLD_CARD_THEMES: Record<string, BackgroundTheme> = {
  world5: {
    id: 'stellarMaze1',
    skyTop: 0x0a0828,
    skyBottom: 0x181040,
    starColor: 0x88ccff,
    planetColor: 0x332266,
    planetSize: 0,
    planetX: 0.5,
    accentColor: 0x44ddff,
  },
  world6: {
    id: 'stellarMaze2',
    skyTop: 0x080618,
    skyBottom: 0x140830,
    starColor: 0xaa88cc,
    planetColor: 0x442255,
    planetSize: 0,
    planetX: 0.5,
    accentColor: 0xcc44aa,
  },
  world7: {
    id: 'galacticCenter',
    skyTop: 0x080810,
    skyBottom: 0x181018,
    starColor: 0xffdd88,
    planetColor: 0xffcc44,
    planetSize: 0,
    planetX: 0.5,
    accentColor: 0xffee66,
  },
  world8: {
    id: 'degenerateEra',
    skyTop: 0x020204,
    skyBottom: 0x040408,
    starColor: 0x111118,
    planetColor: 0xccccdd,
    planetSize: 0,
    planetX: 0.5,
    accentColor: 0xccddee,
  },
};

export function getWorldCardTheme(worldId: string): BackgroundTheme {
  return WORLD_CARD_THEMES[worldId] ?? WORLD_CARD_THEMES.world5;
}
