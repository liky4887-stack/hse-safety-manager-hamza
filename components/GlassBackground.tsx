import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

interface GlassBackgroundProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function GlassBackground({ children, style }: GlassBackgroundProps) {
  const { colors, isDark } = useTheme();
  const { height } = useWindowDimensions();

  const gradients = useMemo(
    () =>
      isDark
        ? [
            { x: 0.1, y: 0.05, colors: ['rgba(26, 143, 181, 0.15)', 'transparent'] },
            { x: 0.9, y: 0.25, colors: ['rgba(61, 184, 136, 0.10)', 'transparent'] },
            { x: 0.5, y: 0.9, colors: ['rgba(90, 155, 224, 0.08)', 'transparent'] },
          ]
        : [
            { x: 0.1, y: 0.05, colors: ['rgba(10, 92, 122, 0.12)', 'transparent'] },
            { x: 0.9, y: 0.25, colors: ['rgba(45, 143, 107, 0.08)', 'transparent'] },
            { x: 0.5, y: 0.9, colors: ['rgba(201, 162, 39, 0.06)', 'transparent'] },
          ],
    [isDark]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }, style]}>
      {gradients.map((g, i) => (
        <LinearGradient
          key={i}
          colors={g.colors as [string, string]}
          style={[styles.gradient, { left: `${g.x * 100}%`, top: `${g.y * 100}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      ))}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
