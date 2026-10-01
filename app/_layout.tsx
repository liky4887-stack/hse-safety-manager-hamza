import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { I18nManager } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useStore } from '@/store';
import { useI18n } from '@/hooks/useI18n';
import { AnimatedSplash } from '@/components/AnimatedSplash';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const init = useStore((s) => s.init);
  const initialized = useStore((s) => s.initialized);
  const user = useStore((s) => s.user);
  const themeMode = useStore((s) => s.themeMode);
  const hasSeenSplash = useStore((s) => s.hasSeenSplash);
  const markSplashSeen = useStore((s) => s.markSplashSeen);
  const { rtl } = useI18n();
  const router = useRouter();
  const segments = useSegments();

  const [splashDone, setSplashDone] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    // Aliased to Cairo-* so every existing screen picks up Thmanyah with no edits
    'Cairo-Regular': require('../assets/fonts/thmanyahsans-Regular.otf'),
    'Cairo-Medium':  require('../assets/fonts/thmanyahsans-Medium.otf'),
    'Cairo-Bold':    require('../assets/fonts/thmanyahsans-Bold.otf'),

    // Direct names for serif/display usage
    'Thmanyah-Display':         require('../assets/fonts/thmanyahserifdisplay-Bold.otf'),
    'Thmanyah-Display-Regular': require('../assets/fonts/thmanyahserifdisplay-Regular.otf'),
    'Thmanyah-Text':            require('../assets/fonts/thmanyahseriftext-Regular.otf'),
    'Thmanyah-Text-Bold':       require('../assets/fonts/thmanyahseriftext-Bold.otf'),
    'Thmanyah-Sans':            require('../assets/fonts/thmanyahsans-Regular.otf'),
    'Thmanyah-Sans-Medium':     require('../assets/fonts/thmanyahsans-Medium.otf'),
    'Thmanyah-Sans-Bold':       require('../assets/fonts/thmanyahsans-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    init();
  }, [init]);

  // If user has already seen the splash on a previous launch, skip it
  useEffect(() => {
    if (initialized && hasSeenSplash) {
      setSplashDone(true);
    }
  }, [initialized, hasSeenSplash]);

  useEffect(() => {
    I18nManager.forceRTL(rtl);
  }, [rtl]);

  // Auth gate: redirect based on user presence once state has hydrated
  useEffect(() => {
    if (!initialized || !splashDone) return;
    const onLogin = segments[0] === 'login';
    if (user && onLogin) {
      router.replace('/(tabs)');
    } else if (!user && !onLogin) {
      router.replace('/login');
    }
  }, [initialized, user, segments, router, splashDone]);

  if (!initialized || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="report/safe" />
        <Stack.Screen name="report/unsafe" />
        <Stack.Screen name="report/details/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />

      {!splashDone && !hasSeenSplash && (
        <AnimatedSplash
          isDark={themeMode === 'dark'}
          onFinish={() => {
            setSplashDone(true);
            void markSplashSeen();
          }}
        />
      )}
    </>
  );
}
