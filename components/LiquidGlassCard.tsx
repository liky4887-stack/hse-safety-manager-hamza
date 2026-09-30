import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp, LayoutChangeEvent } from 'react-native';
import { BlurView, BlurViewProps } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/colors';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface LiquidGlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  onPress?: () => void;
  highlight?: boolean;
  shadow?: boolean;
}

export function LiquidGlassCard({
  children,
  style,
  intensity = 60,
  onPress,
  highlight = true,
  shadow = true,
}: LiquidGlassCardProps) {
  const { colors, isDark } = useTheme();
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.02 }],
  }));

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 20, stiffness: 300 });
  };
  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 20, stiffness: 300 });
  };

  const blurIntensity = isDark ? Math.min(intensity + 20, 100) : intensity;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        shadow && { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
        animatedStyle,
        style,
      ]}
    >
      <View style={[styles.container, { borderColor: colors.glassBorder, borderWidth: 1 }]}>
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={blurIntensity}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassBg }]} />
        )}
        {highlight && (
          <LinearGradient
            colors={[colors.glassHighlight, 'transparent']}
            style={styles.topHighlight}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        )}
        <View style={[StyleSheet.absoluteFill, styles.borderInner, { borderColor: colors.glassHighlight }]} />
        <Animated.View
          style={styles.content}
          onTouchStart={handlePressIn}
          onTouchEnd={handlePressOut}
          onTouchCancel={handlePressOut}
          onResponderRelease={() => onPress?.()}
        >
          {children}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 56,
    padding: 0,
    margin: 0,
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: 'transparent',
    width: '100%',
    alignSelf: 'stretch',
    maxWidth: '100%',
    minWidth: 0,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    opacity: 0.5,
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
    flex: 0,
  },
});
