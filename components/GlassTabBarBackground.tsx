import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/colors';

interface GlassTabBarBackgroundProps {
  children: React.ReactNode;
}

export function GlassTabBarBackground({ children }: GlassTabBarBackgroundProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
      <View style={[styles.inner, { borderColor: colors.glassBorder }]}>
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBg }]} />
        )}
        <LinearGradient
          colors={[colors.glassHighlight, 'transparent']}
          style={styles.topHighlight}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  inner: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
    zIndex: 1,
  },
});
