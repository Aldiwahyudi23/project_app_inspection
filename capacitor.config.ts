import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'inspection_frontend',
  webDir: 'dist',
  android: {
    backgroundColor: '#00000000' // ← transparan agar kamera terlihat
  }
};

export default config;


// 🔥 Penjelasan singkat biar makin paham
// npm run build → compile Vue jadi HTML (dist)
// npx cap sync → kirim hasil ke project Android
// npx cap open android → buka di Android Studio