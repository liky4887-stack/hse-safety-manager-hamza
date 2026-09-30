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

const light: ColorScheme = {
  bg: '#E8ECF1',
  bgSecondary: '#DDE3EA',
  bgTertiary: '#CFD7E0',
  surface: '#FFFFFF',
  glassBg: 'rgba(255, 255, 255, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.7)',
  glassHighlight: 'rgba(255, 255, 255, 0.9)',
  text: '#1A2332',
  textSecondary: '#5A6B7E',
  textTertiary: '#8E9BA8',
  textOnPrimary: '#FFFFFF',
  primary: '#0A5C7A',
  primaryLight: '#1A7A9C',
  primaryDark: '#063E54',
  secondary: '#2D8F6B',
  accent: '#C9A227',
  success: '#2D8F6B',
  successLight: '#E8F5EE',
  warning: '#E89B2F',
  warningLight: '#FDF4E6',
  error: '#D94848',
  errorLight: '#FCEAEA',
  danger: '#D94848',
  info: '#3A7BC8',
  border: 'rgba(10, 92, 122, 0.12)',
  shadow: 'rgba(10, 30, 50, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  tabBg: 'rgba(255, 255, 255, 0.75)',
  chartColors: ['#0A5C7A', '#2D8F6B', '#E89B2F', '#D94848', '#3A7BC8', '#C9A227', '#7B5FC7', '#E8765A'],
};

const dark: ColorScheme = {
  bg: '#0A1622',
  bgSecondary: '#0F1D2E',
  bgTertiary: '#152838',
  surface: '#1A2D42',
  glassBg: 'rgba(30, 45, 65, 0.55)',
  glassBorder: 'rgba(80, 110, 140, 0.4)',
  glassHighlight: 'rgba(120, 150, 180, 0.3)',
  text: '#E8EEF4',
  textSecondary: '#9DB0C2',
  textTertiary: '#6B7E8E',
  textOnPrimary: '#FFFFFF',
  primary: '#1A8FB5',
  primaryLight: '#3AAFD0',
  primaryDark: '#0E6E8E',
  secondary: '#3DB888',
  accent: '#E8C24A',
  success: '#3DB888',
  successLight: 'rgba(61, 184, 136, 0.15)',
  warning: '#F0AC4A',
  warningLight: 'rgba(240, 172, 74, 0.15)',
  error: '#E85A5A',
  errorLight: 'rgba(232, 90, 90, 0.15)',
  danger: '#E85A5A',
  info: '#5A9BE0',
  border: 'rgba(120, 150, 180, 0.15)',
  shadow: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  tabBg: 'rgba(15, 29, 46, 0.8)',
  chartColors: ['#1A8FB5', '#3DB888', '#F0AC4A', '#E85A5A', '#5A9BE0', '#E8C24A', '#9B7FE0', '#F09078'],
};

export const themes: Record<'light' | 'dark', ColorScheme> = { light, dark };

export const getThemeColors = (mode: ThemeMode, systemDark: boolean): ColorScheme => {
  const isDark = mode === 'dark' || (mode === 'system' && systemDark);
  return isDark ? dark : light;
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
};

export const typography = {
  fontFamilyRegular: Platform.select({ ios: 'Cairo-Regular', android: 'Cairo-Regular', default: 'Cairo-Regular' }),
  fontFamilyMedium: Platform.select({ ios: 'Cairo-Medium', android: 'Cairo-Medium', default: 'Cairo-Medium' }),
  fontFamilyBold: Platform.select({ ios: 'Cairo-Bold', android: 'Cairo-Bold', default: 'Cairo-Bold' }),
  h1: 32,
  h2: 24,
  h3: 20,
  body: 16,
  caption: 14,
  small: 12,
};

export const animations = {
  spring: { damping: 20, stiffness: 200 },
  gentleSpring: { damping: 30, stiffness: 120 },
  fastSpring: { damping: 15, stiffness: 300 },
};
