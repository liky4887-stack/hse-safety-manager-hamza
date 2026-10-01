import { useColorScheme as useRNColorScheme } from 'react-native';
import { useStore } from '@/store';
import { getThemeColors } from '@/theme/colors';
import type { ColorScheme } from '@/theme/colors';

export function useTheme(): { colors: ColorScheme; isDark: boolean } {
  const themeMode = useStore((s) => s.themeMode);
  const lastPickedTheme = useStore((s) => s.lastPickedTheme);
  const system = useRNColorScheme();

  // Resolve what the app should actually use:
  // - 'light'  → always light
  // - 'dark'   → always dark
  // - 'system' → use the user's LAST EXPLICIT PICK (not the OS theme).
  //              This is the behavior the user asked for: "make the system
  //              the color he chose."
  const effective: 'light' | 'dark' =
    themeMode === 'light' ? 'light'
    : themeMode === 'dark' ? 'dark'
    : lastPickedTheme;

  const isDark = effective === 'dark';
  const colors = getThemeColors(effective, system === 'dark');
  return { colors, isDark };
}

export { useStore };
