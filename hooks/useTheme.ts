import { useColorScheme as useRNColorScheme } from 'react-native';
import { useStore } from '@/store';
import { getThemeColors } from '@/theme/colors';
import type { ColorScheme } from '@/theme/colors';

export function useTheme(): { colors: ColorScheme; isDark: boolean } {
  const themeMode = useStore((s) => s.themeMode);
  const system = useRNColorScheme();
  const isDark = themeMode === 'dark' || (themeMode === 'system' && system === 'dark');
  const colors = getThemeColors(themeMode, system === 'dark');
  return { colors, isDark };
}

export { useStore };
