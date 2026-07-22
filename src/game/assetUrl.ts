/** Resolve a public/ asset path for Vite base URL (web, Capacitor, Tauri). */
export function assetUrl(path: string): string {
  const trimmed = path.replace(/^\//, '');
  const base = import.meta.env.BASE_URL;
  const relative = `${base}${trimmed}`;
  if (typeof window === 'undefined') return relative;
  return new URL(relative, window.location.href).href;
}
