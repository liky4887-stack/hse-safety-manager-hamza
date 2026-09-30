import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_700Bold,
} from '@expo-google-fonts/cairo';
import * as SplashScreen from 'expo-splash-screen';
import { I18nManager } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useStore } from '@/store';
import { useI18n } from '@/hooks/useI18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const init = useStore((s) => s.init);
  const initialized = useStore((s) => s.initialized);
  const user = useStore((s) => s.user);
  const { rtl } = useI18n();
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded, fontError] = useFonts({
    'Cairo-Regular': Cairo_400Regular,
    'Cairo-Medium': Cairo_500Medium,
    'Cairo-Bold': Cairo_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    I18nManager.forceRTL(rtl);
  }, [rtl]);

  // Auth gate: redirect based on user presence once state has hydrated
  useEffect(() => {
    if (!initialized) return;
    const onLogin = segments[0] === 'login';
    if (user && onLogin) {
      router.replace('/(tabs)');
    } else if (!user && !onLogin) {
      router.replace('/login');
    }
  }, [initialized, user, segments, router]);

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
    </>
  );
}
