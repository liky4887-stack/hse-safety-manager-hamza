import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('window');
const NAME_AR = 'شركة الفياض للنفط';
const NAME_EN = 'Al Fayadh Petroleum';
const CRIMSON = '#E5284B';


// ─────────────────────────────────────────────────────────
// One word — fades in + slides up, then stays visible
// ─────────────────────────────────────────────────────────
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
  const bg      = isDark ? '#1A1416' : '#FAF6EE';
  const subCol  = isDark ? '#C4B0B3' : '#6B5A5C';
  const highlightColor = isDark ? 'rgba(229, 40, 75, 0.28)' : 'rgba(229, 40, 75, 0.14)';

  // ── Root fade
  const containerOpacity = useSharedValue(1);

  // ── Words + highlight
  const highlightScale   = useSharedValue(0);
  const subOpacity       = useSharedValue(0);
  const subY             = useSharedValue(16);

  const words = useMemo(() => NAME_AR.split(' '), []);

  // Timing plan — highlight starts AFTER all words are fully revealed
  // 0.20s : words start revealing (شركة first)
  // 0.20, 0.65, 1.10 : three words appear
  // 1.55s : last word finishes settling
  // 1.85s : highlight sweep begins (after all words visible)
  // 2.85s : highlight sweep finishes
  // 3.10s : brand text fades in
  // 4.00s : whole splash fades out
  const WORDS_AT     = 200;
  const PER_WORD     = 450;
  const WORD_SETTLE  = 450;   // how long a word takes to fade in + settle
  const HIGHLIGHT_AT = WORDS_AT + 2 * PER_WORD + WORD_SETTLE + 300; // 1.85s
  const HIGHLIGHT_DURATION = 1000;
  const BRAND_AT     = HIGHLIGHT_AT + HIGHLIGHT_DURATION + 250;     // 3.10s
  const FADE_AT      = BRAND_AT + 900;                              // 4.00s

  const wordDelays = words.map((_, i) => WORDS_AT + i * PER_WORD);

  useEffect(() => {
    // Highlight sweep — left → right
    highlightScale.value = withDelay(
      HIGHLIGHT_AT,
      withTiming(1, { duration: HIGHLIGHT_DURATION, easing: Easing.out(Easing.cubic) }),
    );

    // Brand text
    subOpacity.value = withDelay(BRAND_AT, withTiming(1, { duration: 400 }));
    subY.value       = withDelay(BRAND_AT, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    // Hand off
    containerOpacity.value = withDelay(
      FADE_AT,
      withTiming(0, { duration: 420 }, (f) => { if (f) runOnJS(onFinish)(); }),
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: highlightScale.value }],
  }));
  const subStyle = useAnimatedStyle(() => ({
    opacity: subOpacity.value,
    transform: [{ translateY: subY.value }],
  }));

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: bg }, containerStyle]}
      pointerEvents="none"
    >
      {/* ── WORDS with highlight sweep ── */}
      <View style={styles.phraseRow}>
        <Animated.View
          style={[styles.highlightBar, { backgroundColor: highlightColor }, highlightStyle]}
        />
        <View style={styles.wordsRow}>
          {words.map((w, i) => (
            <RevealWord key={i} word={w} delay={wordDelays[i]} />
          ))}
        </View>
      </View>

      {/* ── BRAND TEXT ── */}
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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    paddingHorizontal: 24,
  },
  phraseRow: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginTop: 4,
    maxWidth: SCREEN_W - 40,
  },
  highlightBar: {
    position: 'absolute',
    left: -6,
    right: -6,
    top: 8,
    bottom: 8,
    borderRadius: 6,
    transformOrigin: 'left',
  },
  wordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  word: {
    fontFamily: 'Thmanyah-Display',
    fontSize: 42,
    lineHeight: 66,
    textAlign: 'center',
    includeFontPadding: false,
    marginHorizontal: 5,
  },
  brandWrap: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
    gap: 6,
  },
  brandAr: {
    fontFamily: 'Cairo-Bold',
    fontSize: 22,
    textAlign: 'center',
  },
  brandSub: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
    letterSpacing: 2,
    textAlign: 'center',
  },
});
