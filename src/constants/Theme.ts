import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#F7F4EC',
    surface: '#FFFFFF',
    surfaceMuted: '#EFEADE',
    text: '#2B2A25',
    textSecondary: '#6B6558',
    plantPrimary: '#4C7A5E',
    plantPrimaryDark: '#365943',
    onPlantPrimary: '#FFFFFF',
    plantAccent: '#8FB08A',
    droplet: '#6FA8C9',
    warmthAccent: '#D98E5B',
    warningSoft: '#C97B5A',
    warning: '#C97B5A',
    dangerMuted: '#B5533F',
    plantGlow: '#4C7A5E',
    dropletGlow: '#6FA8C9',
    // Template compatibility tokens
    backgroundElement: '#EFEADE',
    backgroundSelected: '#E0DCD2',
  },
  dark: {
    background: '#171A16',
    surface: '#20241E',
    surfaceMuted: '#292E26',
    text: '#EDEAE0',
    textSecondary: '#A8A296',
    plantPrimary: '#7CAE8A',
    plantPrimaryDark: '#5B8C69',
    onPlantPrimary: '#171A16',
    plantAccent: '#9EC4A9',
    droplet: '#8FC3E0',
    warmthAccent: '#E3A470',
    warningSoft: '#C97B5A',
    warning: '#C97B5A',
    dangerMuted: '#B5533F',
    plantGlow: '#7CAE8A',
    dropletGlow: '#8FC3E0',
    // Template compatibility tokens
    backgroundElement: '#20241E',
    backgroundSelected: '#2E332B',
  },
  session: {
    background: '#000000',
    surface: '#000000',
    surfaceMuted: '#0D0E0D',
    text: '#D8D8D2',
    textSecondary: '#8A8A84',
    plantPrimary: '#7CD9A0',
    plantPrimaryDark: '#5BAE7D',
    onPlantPrimary: '#05140C',
    plantAccent: '#7CD9A0',
    plantGlow: '#7CD9A0',
    droplet: '#7EC8E3',
    dropletGlow: '#7EC8E3',
    warmthAccent: '#E3A17A',
    warningSoft: '#E3A17A',
    warning: '#E3A17A',
    dangerMuted: '#B5533F',
    // Template compatibility tokens
    backgroundElement: '#121412',
    backgroundSelected: '#222521',
  },
} as const;

export type ThemeMode = keyof typeof Colors;
export type ThemeColor =
  | keyof typeof Colors.light
  | keyof typeof Colors.dark
  | keyof typeof Colors.session;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    serif: 'var(--font-serif, Georgia, serif)',
    rounded: 'var(--font-rounded, Quicksand, Nunito, sans-serif)',
    mono: 'var(--font-mono, monospace)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

/** Radius for the pill-shaped primary actions (STYLE_GUIDE.md section 4). */
export const PillRadius = 999;
/** Minimum tappable size, STYLE_GUIDE.md section 8. */
export const MinTapTarget = 44;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
