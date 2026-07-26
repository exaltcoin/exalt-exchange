import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.exaltexchange.app',
  appName: 'Exalt Exchange',
  webDir: 'dist',

  server: {
    androidScheme: 'https',
    cleartext: false
  }
};

export default config;