import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/colors';

interface LiquidGlassPanelProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function LiquidGlassPanel({ children, style, intensity = 50 }: LiquidGlassPanelProps) {
  const { colors, isDark } = useTheme();
  const blurIntensity = isDark ? Math.min(intensity + 20, 100) : intensity;

  return (
    <View style={[styles.container, { borderColor: colors.glassBorder }, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassBg }]} />
      )}
      <LinearGradient
        colors={[colors.glassHighlight, 'transparent']}
        style={styles.topHighlight}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={[StyleSheet.absoluteFill, styles.borderInner, { borderColor: colors.glassHighlight }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    opacity: 0.4,
  },
  borderInner: {
    borderRadius: radius.lg - 1,
    borderWidth: 0.5,
    opacity: 0.3,
    pointerEvents: 'none',
  },
  content: {
    padding: 16,
    zIndex: 1,
  },
});
