import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp, TextStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/colors';

interface LiquidGlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function LiquidGlassButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  disabled = false,
  icon,
  fullWidth = true,
}: LiquidGlassButtonProps) {
  const { colors, isDark } = useTheme();
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.03 }],
    opacity: 1 - pressed.value * 0.1,
  }));

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 20, stiffness: 400 });
  };
  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 20, stiffness: 400 });
  };

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13 },
    md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15 },
    lg: { paddingVertical: 16, paddingHorizontal: 28, fontSize: 17 },
  };

  const getGradient = (): [string, string] => {
    if (disabled) return [colors.bgTertiary, colors.bgTertiary];
    switch (variant) {
      case 'primary':
        return [colors.primary, colors.primaryDark];
      case 'secondary':
        return [colors.secondary, colors.secondary];
      case 'danger':
        return [colors.error, colors.error];
      case 'ghost':
        return ['transparent', 'transparent'];
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textTertiary;
    if (variant === 'ghost') return colors.primary;
    return colors.textOnPrimary;
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        fullWidth && { width: '100%' },
        !disabled && variant !== 'ghost' && {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        },
        animatedStyle,
        style,
      ]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
      onResponderRelease={() => !disabled && onPress()}
    >
      <View style={[styles.container, { borderColor: variant === 'ghost' ? colors.border : colors.glassBorder }]}>
        {Platform.OS === 'ios' && variant !== 'ghost' && (
          <BlurView
            intensity={30}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}
        {variant !== 'ghost' && (
          <LinearGradient
            colors={getGradient()}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        )}
        <LinearGradient
          colors={[colors.glassHighlight, 'transparent']}
          style={styles.topHighlight}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <Animated.View style={[styles.content, sizeStyles[size]]}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Animated.Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: sizeStyles[size].fontSize },
              textStyle,
            ]}
          >
            {title}
          </Animated.Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  container: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    opacity: 0.3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 1,
  },
  iconWrap: {
    marginRight: 2,
  },
  text: {
    fontFamily: 'Cairo-Bold',
    textAlign: 'center',
  },
});
