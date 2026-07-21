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
  proxima: { id: 'proxima', skyTop: 0x080810, skyBottom: 0x181028, starColor: 0xff6644, planetColor: 0xcc3322, planetSize: 36, planetX: 0.7, accentColor: 0xff8866 },
  alphaCentauri: { id: 'alphaCentauri', skyTop: 0x0a1020, skyBottom: 0x1a2840, starColor: 0xffffcc, planetColor: 0xffdd88, planetSize: 42, planetX: 0.68, accentColor: 0xffeeaa },
  barnard: { id: 'barnard', skyTop: 0x100808, skyBottom: 0x281818, starColor: 0xff4422, planetColor: 0xaa2211, planetSize: 34, planetX: 0.72, accentColor: 0xff5533 },
  luhman: { id: 'luhman', skyTop: 0x0a0a10, skyBottom: 0x202028, starColor: 0xcc8866, planetColor: 0x884422, planetSize: 32, planetX: 0.74, accentColor: 0xdd9966 },
  wolf359: { id: 'wolf359', skyTop: 0x100808, skyBottom: 0x301818, starColor: 0xff2200, planetColor: 0xcc1100, planetSize: 30, planetX: 0.76, accentColor: 0xff4400 },
  sirius: { id: 'sirius', skyTop: 0x081020, skyBottom: 0x182840, starColor: 0xccddff, planetColor: 0xaaccff, planetSize: 48, planetX: 0.65, accentColor: 0xeeffff },
  epsilonEridani: { id: 'epsilonEridani', skyTop: 0x0a1018, skyBottom: 0x1a2830, starColor: 0xffcc88, planetColor: 0xddaa66, planetSize: 40, planetX: 0.7, accentColor: 0xffdd99 },
  procyon: { id: 'procyon', skyTop: 0x0a1020, skyBottom: 0x203048, starColor: 0xeeeeff, planetColor: 0xddddee, planetSize: 44, planetX: 0.68, accentColor: 0xffffff },
  vanMaanen: { id: 'vanMaanen', skyTop: 0x101018, skyBottom: 0x282830, starColor: 0xccccdd, planetColor: 0xaaaabb, planetSize: 38, planetX: 0.72, accentColor: 0xddddee },
  altair: { id: 'altair', skyTop: 0x081018, skyBottom: 0x182838, starColor: 0xccddff, planetColor: 0x88aacc, planetSize: 46, planetX: 0.66, accentColor: 0xaaccff },
  vega: { id: 'vega', skyTop: 0x081020, skyBottom: 0x182840, starColor: 0xccddee, planetColor: 0xaabbee, planetSize: 50, planetX: 0.64, accentColor: 0xddeeff },
  pollux: { id: 'pollux', skyTop: 0x100808, skyBottom: 0x302018, starColor: 0xffaa66, planetColor: 0xdd8844, planetSize: 52, planetX: 0.62, accentColor: 0xffbb77 },
  arcturus: { id: 'arcturus', skyTop: 0x100808, skyBottom: 0x302818, starColor: 0xff8844, planetColor: 0xdd6622, planetSize: 54, planetX: 0.6, accentColor: 0xff9955 },
  trappist: { id: 'trappist', skyTop: 0x080810, skyBottom: 0x181828, starColor: 0xff4422, planetColor: 0xcc2211, planetSize: 28, planetX: 0.75, accentColor: 0xff6644 },
  capella: { id: 'capella', skyTop: 0x101008, skyBottom: 0x302820, starColor: 0xffdd88, planetColor: 0xddbb66, planetSize: 56, planetX: 0.58, accentColor: 0xffee99 },
  alderamin: { id: 'alderamin', skyTop: 0x081018, skyBottom: 0x182830, starColor: 0xccddff, planetColor: 0x99bbdd, planetSize: 42, planetX: 0.7, accentColor: 0xbbddff },
  castor: { id: 'castor', skyTop: 0x0a1020, skyBottom: 0x203048, starColor: 0xccddee, planetColor: 0xaabbcc, planetSize: 44, planetX: 0.66, accentColor: 0xddeeff },
  aldebaran: { id: 'aldebaran', skyTop: 0x100404, skyBottom: 0x301010, starColor: 0xff4422, planetColor: 0xcc2200, planetSize: 80, planetX: 0.5, accentColor: 0xff6633 },
};

export function getBackgroundTheme(themeId: string): BackgroundTheme {
  return BACKGROUND_THEMES[themeId] ?? BACKGROUND_THEMES.proxima;
}
