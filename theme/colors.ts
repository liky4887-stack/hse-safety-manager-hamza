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
  highlight: string;
  chartColors: string[];
}

// ═══════════════════════════════════════════════════════════
//  Kangaro palette — creamy ivory canvas, crimson ink
//  Rule: cream/white = 90% of surface. Crimson = only on
//  interactive + active states. Never as a large background.
// ═══════════════════════════════════════════════════════════

const light: ColorScheme = {
  // ── Canvas: pure warm cream, no tint ──
  bg: '#FAF6EE',              // main background — warm ivory
  bgSecondary: '#F2EBDD',     // slightly deeper cream
  bgTertiary: '#E8DFCB',      // borders / muted areas
  surface: '#FFFFFF',         // cards — pure white for contrast
  glassBg: 'rgba(255, 255, 255, 0.88)',
  glassBorder: 'rgba(180, 165, 140, 0.28)',
  glassHighlight: 'rgba(255, 255, 255, 0.98)',

  // ── Text: warm dark, never pure black ──
  text: '#2A1F22',            // warm near-black
  textSecondary: '#6B5A5C',
  textTertiary: '#A08C8E',
  textOnPrimary: '#FFFFFF',

  // ── Accent: crimson — used sparingly ──
  primary: '#E5284B',         // Kangaro crimson
  primaryLight: '#F26A82',
  primaryDark: '#B81A3A',

  // ── Secondary: muted warm neutrals (not competing reds) ──
  secondary: '#7A6B54',       // warm taupe
  accent: '#C9B99A',          // soft tan

  // ── Status colors — kept muted, not crimson ──
  success: '#3E7A52',         // forest green
  successLight: '#E3EFE6',
  warning: '#C77D2A',         // burnt amber
  warningLight: '#F7EDD9',
  error: '#B81A3A',           // deep crimson (distinct from primary)
  errorLight: '#F7E2E6',
  danger: '#B81A3A',
  info: '#6B5A5C',            // neutral warm gray

  // ── Structural ──
  border: 'rgba(90, 70, 60, 0.10)',
  shadow: 'rgba(60, 40, 30, 0.08)',
  overlay: 'rgba(40, 25, 20, 0.40)',
  tabBg: 'rgba(255, 255, 255, 0.94)',
  highlight: 'rgba(229, 40, 75, 0.14)',

  // ── Chart: mostly warm neutrals with crimson as first accent ──
  chartColors: [
    '#E5284B',   // crimson
    '#7A6B54',   // taupe
    '#C77D2A',   // amber
    '#3E7A52',   // green
    '#C9B99A',   // tan
    '#B81A3A',   // deep crimson
    '#A08C8E',   // mauve gray
    '#6B5A5C',   // dark taupe
  ],
};

const dark: ColorScheme = {
  // ── Deep warm charcoal canvas (neutral, no red tint) ──
  bg: '#1A1416',              // near-black with warm undertone
  bgSecondary: '#241B1E',
  bgTertiary: '#2E2326',
  surface: '#2A1F22',         // card surface
  glassBg: 'rgba(42, 31, 34, 0.80)',
  glassBorder: 'rgba(180, 150, 155, 0.18)',
  glassHighlight: 'rgba(200, 170, 175, 0.10)',

  // ── Text: warm cream ──
  text: '#F6EFE2',
  textSecondary: '#C4B0B3',
  textTertiary: '#8A7478',
  textOnPrimary: '#FFFFFF',   // white on red buttons

  // ── Primary: SAME Kangaro crimson as light theme ──
  primary: '#E5284B',
  primaryLight: '#F05573',
  primaryDark: '#B81A3A',

  // ── Secondary / accent ──
  secondary: '#C9304F',
  accent: '#D9C9A8',

  // ── Status (tuned for dark bg) ──
  success: '#5BB89A',
  successLight: 'rgba(91, 184, 154, 0.15)',
  warning: '#E5A052',
  warningLight: 'rgba(229, 160, 82, 0.15)',
  error: '#F05573',
  errorLight: 'rgba(240, 85, 115, 0.15)',
  danger: '#F05573',
  info: '#B8A89C',

  // ── Structural ──
  border: 'rgba(200, 170, 175, 0.12)',
  shadow: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  tabBg: 'rgba(36, 27, 30, 0.94)',
  highlight: 'rgba(229, 40, 75, 0.28)',

  // ── Charts ──
  chartColors: [
    '#E5284B', '#F05573', '#C9304F', '#D9C9A8',
    '#5BB89A', '#E5A052', '#B8A89C', '#8A7478',
  ],
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
