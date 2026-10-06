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
  hamal: { id: 'hamal', skyTop: 0x100808, skyBottom: 0x301810, starColor: 0xffaa66, planetColor: 0xdd7722, planetSize: 180, planetX: 0.66, accentColor: 0xffbb77 },
  alphecca: { id: 'alphecca', skyTop: 0x0a1020, skyBottom: 0x1a2848, starColor: 0xeeeeff, planetColor: 0xccddee, planetSize: 160, planetX: 0.64, accentColor: 0xffffff },
  kausBorealis: { id: 'kausBorealis', skyTop: 0x100808, skyBottom: 0x281810, starColor: 0xff9944, planetColor: 0xcc6622, planetSize: 175, planetX: 0.68, accentColor: 0xffaa55 },
  regulus: { id: 'regulus', skyTop: 0x081018, skyBottom: 0x182848, starColor: 0xaaccff, planetColor: 0x88aaee, planetSize: 170, planetX: 0.62, accentColor: 0xddeeff },
  ankaa: { id: 'ankaa', skyTop: 0x140808, skyBottom: 0x301410, starColor: 0xff7744, planetColor: 0xdd5522, planetSize: 185, planetX: 0.6, accentColor: 0xff8866 },
  southernCross: { id: 'southernCross', skyTop: 0x060818, skyBottom: 0x101830, starColor: 0x99bbff, planetColor: 0x6688dd, planetSize: 168, planetX: 0.58, accentColor: 0xaaccff },
  cursa: { id: 'cursa', skyTop: 0x081018, skyBottom: 0x182838, starColor: 0xccddee, planetColor: 0x99bbee, planetSize: 172, planetX: 0.7, accentColor: 0xddeeff },
  algol: { id: 'algol', skyTop: 0x100810, skyBottom: 0x281828, starColor: 0xddccff, planetColor: 0xaa88dd, planetSize: 176, planetX: 0.64, accentColor: 0xccaaee },
  alpheratz: { id: 'alpheratz', skyTop: 0x081020, skyBottom: 0x182040, starColor: 0xbbccff, planetColor: 0x8899ee, planetSize: 170, planetX: 0.66, accentColor: 0xccddee },
  corCaroli: { id: 'corCaroli', skyTop: 0x101018, skyBottom: 0x282838, starColor: 0xeeeeff, planetColor: 0xddddee, planetSize: 168, planetX: 0.62, accentColor: 0xffffff },
  alnair: { id: 'alnair', skyTop: 0x061018, skyBottom: 0x102030, starColor: 0x99ccff, planetColor: 0x66aaee, planetSize: 178, planetX: 0.68, accentColor: 0xaaddff },
  bigDipper: { id: 'bigDipper', skyTop: 0x080c18, skyBottom: 0x141828, starColor: 0xccddee, planetColor: 0xaabbdd, planetSize: 190, planetX: 0.54, accentColor: 0xddeeff },
};

export function getBackgroundTheme(themeId: string): BackgroundTheme {
  return BACKGROUND_THEMES[themeId] ?? BACKGROUND_THEMES.hamal;
}
