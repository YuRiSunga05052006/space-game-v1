import { isTauri } from '@tauri-apps/api/core';

export async function quitGame(): Promise<void> {
  if (isTauri()) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
    return;
  }

  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { App } = await import('@capacitor/app');
      await App.exitApp();
      return;
    }
  } catch {
    // Capacitor not available
  }

  window.close();
}
