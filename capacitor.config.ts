import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.soup.tip-tracker',
  appName: 'Tip Tracker',
  webDir: 'out',
  plugins: {
    Keyboard: {
      resize: KeyboardResize.None,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
  },
  ios: {
    scheme: 'Tip Tracker',
  },
};

export default config;
