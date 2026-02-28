/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#1E40AF',
    primaryDark: '#1E3A8A',
    primaryLight: '#DBEAFE',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#111111',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#E5E5E5',
    headerBg: '#111111',
    headerText: '#FFFFFF',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#22C55E',
    // Legacy aliases for compatibility
    tint: '#1E40AF',
    icon: '#666666',
    tabIconDefault: '#999999',
    tabIconSelected: '#1E40AF',
  },
  dark: {
    primary: '#1E40AF',
    primaryDark: '#1E3A8A',
    primaryLight: '#1E3A8A',
    background: '#111111',
    surface: '#1A1A1A',
    text: '#F5F5F5',
    textSecondary: '#999999',
    textTertiary: '#666666',
    border: '#2A2A2A',
    headerBg: '#111111',
    headerText: '#FFFFFF',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#22C55E',
    // Legacy aliases for compatibility
    tint: '#1E40AF',
    icon: '#999999',
    tabIconDefault: '#666666',
    tabIconSelected: '#1E40AF',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
