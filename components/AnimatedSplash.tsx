import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('window');
const NAME_AR = 'شركة الفياض للنفط';
const NAME_EN = 'Al Fayadh Petroleum';
const CRIMSON = '#E5284B';

function RevealWord({ word, delay }: { word: string; delay: number }) {
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [delay, opacity, translateY]);

  const s = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[styles.word, { color: CRIMSON }, s]} allowFontScaling={false}>
      {word}
    </Animated.Text>
  );
}

interface Props { isDark: boolean; onFinish: () => void; }

export function AnimatedSplash({ isDark, onFinish }: Props) {
  const bg = isDark ? '#1A1416' : '#FAF6EE';
  const subCol = isDark ? '#C4B0B3' : '#6B5A5C';
  const highlightColor = isDark ? 'rgba(229, 40, 75, 0.28)' : 'rgba(229, 40, 75, 0.14)';

  const containerOpacity = useSharedValue(1);
  const subOpacity       = useSharedValue(0);
  const subY             = useSharedValue(16);
  const highlightScale   = useSharedValue(0);

  // Array order: [شركة, الفياض, للنفط]
  // Visual (row, LTR): شركة | الفياض | للنفط
  const words = useMemo(() => NAME_AR.split(' '), []);

  const PER_WORD = 450;
  const START    = 200;
  // Left-to-right reveal: index 0 first, then 1, then 2
  const wordDelays = words.map((_, i) => START + i * PER_WORD);
  const allDoneAt  = START + (words.length - 1) * PER_WORD + 500;

  useEffect(() => {
    // Highlight sweeps left → right after all words visible
    highlightScale.value = withDelay(
      allDoneAt,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );

    const brandAt = allDoneAt + 1000;
    subOpacity.value = withDelay(brandAt, withTiming(1, { duration: 400 }));
    subY.value       = withDelay(brandAt, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    const fadeAt = brandAt + 900;
    containerOpacity.value = withDelay(
      fadeAt,
      withTiming(0, { duration: 420 }, (f) => { if (f) runOnJS(onFinish)(); }),
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const highlightStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: highlightScale.value }] }));
  const subStyle       = useAnimatedStyle(() => ({
    opacity: subOpacity.value,
    transform: [{ translateY: subY.value }],
  }));

  return (
    <Animated.View style={[styles.container, { backgroundColor: bg }, containerStyle]} pointerEvents="none">
      <View style={styles.phraseRow}>
        {/* Highlight bar — anchored left, expands to the right */}
        <Animated.View
          style={[
            styles.highlightBar,
            { backgroundColor: highlightColor },
            highlightStyle,
          ]}
        />

        <View style={styles.wordsRow}>
          {words.map((w, i) => (
            <RevealWord key={i} word={w} delay={wordDelays[i]} />
          ))}
        </View>
      </View>

      <Animated.View style={[styles.brandWrap, subStyle]}>
        <Text style={[styles.brandAr, { color: CRIMSON }]}>إدارة السلامة المهنية</Text>
        <Text style={[styles.brandSub, { color: subCol }]}>{NAME_EN} · HSE</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  },
  phraseRow: {
    position: 'relative', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, maxWidth: SCREEN_W - 32,
  },
  highlightBar: {
    position: 'absolute',
    left: -8, right: -8, top: 8, bottom: 8,
    borderRadius: 6,
    transformOrigin: 'left',   // ← sweeps left → right
  },
  wordsRow: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
  },
  word: {
    fontFamily: 'Thmanyah-Display', fontSize: 42, lineHeight: 70,
    textAlign: 'center', includeFontPadding: false, marginHorizontal: 6,
  },
  brandWrap: { position: 'absolute', bottom: 140, alignItems: 'center', gap: 6 },
  brandAr: { fontFamily: 'Cairo-Bold', fontSize: 26, textAlign: 'center' },
  brandSub: { fontFamily: 'Cairo-Regular', fontSize: 13, letterSpacing: 2, textAlign: 'center' },
});
