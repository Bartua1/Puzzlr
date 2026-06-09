import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gonzalo.puzzlr',
  appName: 'puzzlr',
  webDir: 'dist',
  // Sets the native webview wrapper background to match bg-slate-50
  backgroundColor: '#f8fafc',
  server: {
    iosScheme: 'com.gonzalo.puzzlr',
    androidScheme: 'com.gonzalo.puzzlr',
  },
  ios: {
    // Specifically sets iOS webview background to match
    backgroundColor: '#f8fafc',
  },
  plugins: {
    CapacitorShareTarget: {
      appGroupId: 'group.com.gonzalo.puzzlr'
    }
  }
};

export default config;