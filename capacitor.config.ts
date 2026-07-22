import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.starblaster.game',
  appName: 'Star Blaster',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
