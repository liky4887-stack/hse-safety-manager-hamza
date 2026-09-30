import { Platform } from 'react-native';
import type { ThemeMode } from '@/types';

export interface ColorScheme {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  surface: string;
  glassBg: string;
  glassBorder: string;
  glassHighlight: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textOnPrimary: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  danger: string;
  info: string;
  border: string;
  shadow: string;
  overlay: string;
  tabBg: string;
  chartColors: string[];
}

// ── Sky Blue · White · Silver ──────────────────────────────
const light: ColorScheme = {
  bg: '#F4F7FB',              // near-white
  bgSecondary: '#E9EEF4',     // soft silver
  bgTertiary: '#DCE3EB',      // silver
  surface: '#FFFFFF',
  glassBg: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(180, 195, 210, 0.55)',
  glassHighlight: 'rgba(255, 255, 255, 0.95)',
  text: '#1F2D3D',
  textSecondary: '#5E6E80',
  textTertiary: '#93A1B0',
  textOnPrimary: '#FFFFFF',
  primary: '#3B9EDB',         // sky blue
  primaryLight: '#7CC1E8',
  primaryDark: '#2878A8',
  secondary: '#5BA9D6',       // muted sky
  accent: '#A9C6DE',          // silver-blue
  success: '#4BA98B',
  successLight: '#E6F4EF',
  warning: '#D9A24A',
  warningLight: '#FBF3E4',
  error: '#D96A6A',
  errorLight: '#FBEBEB',
  danger: '#D96A6A',
  info: '#3B9EDB',
  border: 'rgba(60, 100, 140, 0.10)',
  shadow: 'rgba(40, 80, 120, 0.10)',
  overlay: 'rgba(20, 40, 60, 0.35)',
  tabBg: 'rgba(255, 255, 255, 0.92)',
  chartColors: ['#3B9EDB', '#7CC1E8', '#A9C6DE', '#5E6E80', '#93A1B0', '#4BA98B', '#D9A24A', '#D96A6A'],
};

const dark: ColorScheme = {
  bg: '#0F1926',              // deep slate (still cool, not navy-blue AI)
  bgSecondary: '#16222F',
  bgTertiary: '#1E2C3B',
  surface: '#1A2736',
  glassBg: 'rgba(30, 44, 60, 0.75)',
  glassBorder: 'rgba(120, 150, 180, 0.20)',
  glassHighlight: 'rgba(150, 180, 205, 0.15)',
  text: '#EEF3F8',
  textSecondary: '#A8B6C4',
  textTertiary: '#72828F',
  textOnPrimary: '#FFFFFF',
  primary: '#5BB4E3',
  primaryLight: '#8FCBEC',
  primaryDark: '#3893C4',
  secondary: '#7CC1E8',
  accent: '#A9C6DE',
  success: '#5BB89A',
  successLight: 'rgba(91, 184, 154, 0.15)',
  warning: '#E0B060',
  warningLight: 'rgba(224, 176, 96, 0.15)',
  error: '#E27C7C',
  errorLight: 'rgba(226, 124, 124, 0.15)',
  danger: '#E27C7C',
  info: '#5BB4E3',
  border: 'rgba(120, 150, 180, 0.12)',
  shadow: 'rgba(0, 0, 0, 0.45)',
  overlay: 'rgba(0, 0, 0, 0.55)',
  tabBg: 'rgba(22, 34, 47, 0.92)',
  chartColors: ['#5BB4E3', '#8FCBEC', '#A9C6DE', '#7CC1E8', '#5BB89A', '#E0B060', '#E27C7C', '#72828F'],
};

export const themes: Record<'light' | 'dark', ColorScheme> = { light, dark };

export const getThemeColors = (mode: ThemeMode, systemDark: boolean): ColorScheme => {
  const isDark = mode === 'dark' || (mode === 'system' && systemDark);
  return isDark ? dark : light;
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, pill: 999,
};

export const typography = {
  fontFamilyRegular: Platform.select({ ios: 'Cairo-Regular', android: 'Cairo-Regular', default: 'Cairo-Regular' }),
  fontFamilyMedium: Platform.select({ ios: 'Cairo-Medium', android: 'Cairo-Medium', default: 'Cairo-Medium' }),
  fontFamilyBold: Platform.select({ ios: 'Cairo-Bold', android: 'Cairo-Bold', default: 'Cairo-Bold' }),
  h1: 32, h2: 24, h3: 20, body: 16, caption: 14, small: 12,
};

export const animations = {
  spring: { damping: 20, stiffness: 200 },
  gentleSpring: { damping: 30, stiffness: 120 },
  fastSpring: { damping: 15, stiffness: 300 },
};
