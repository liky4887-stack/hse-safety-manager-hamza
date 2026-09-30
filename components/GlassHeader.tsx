import React from 'react';
import { StyleSheet, Platform, View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolate, Extrapolate } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';

interface GlassHeaderProps {
  title: string;
  scrollY?: number;
  right?: React.ReactNode;
}

export function GlassHeader({ title, scrollY = 0, right }: GlassHeaderProps) {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const opacity = useSharedValue(0);
  opacity.value = withTiming(scrollY > 20 ? 1 : 0, { duration: 200 });

  const bgStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={60}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBg }]} />
        )}
        <LinearGradient
          colors={[colors.glassHighlight, 'transparent']}
          style={styles.bottomHighlight}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bottomHighlight: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  title: {
    fontFamily: 'Cairo-Bold',
    fontSize: 18,
    flex: 1,
  },
});
