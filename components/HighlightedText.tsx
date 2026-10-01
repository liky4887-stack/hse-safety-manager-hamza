import React from 'react';
import { Text, TextStyle, StyleProp, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface HighlightedTextProps {
  children: React.ReactNode;
  highlightColor?: string;
  textColor?: string;
  fontFamily?: string;
  size?: number;
  lineHeight?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Text with a marker-pen highlight behind it.
 *
 *   <Text>
 *     عادي <HighlightedText>كلمة مهمة</HighlightedText> عادي
 *   </Text>
 */
export function HighlightedText({
  children,
  highlightColor,
  textColor,
  fontFamily = 'Thmanyah-Display',
  size = 20,
  lineHeight,
  style,
}: HighlightedTextProps) {
  const { colors } = useTheme();

  return (
    <Text
      style={[
        styles.base,
        {
          fontFamily,
          fontSize: size,
          lineHeight: lineHeight ?? Math.round(size * 1.55),
          color: textColor ?? colors.primary,
          backgroundColor: highlightColor ?? colors.highlight,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
