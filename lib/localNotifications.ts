import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * expo-notifications crashes at import time in Expo Go on Android (SDK 53+)
 * because remote push was removed from Expo Go. We work around it by loading
 * the module lazily with require() and skipping it entirely in Expo Go.
 *
 * In dev builds / standalone APKs (EAS preview / production), the module
 * loads normally and notifications work.
 */

// Detect Expo Go — modern API, falls back to legacy appOwnership
function isExpoGo(): boolean {
  try {
    // `appOwnership === 'expo'` is deprecated but still works
    // @ts-ignore
    return Constants.appOwnership === 'expo';
  } catch {
    return false;
  }
}

let Notifications: any = null;
let initialized = false;

function loadNotifications(): any {
  if (initialized) return Notifications;
  initialized = true;

  // On Android Expo Go, skip entirely — importing crashes.
  if (isExpoGo() && Platform.OS === 'android') {
    console.log('[localNotifications] Expo Go (Android) — notifications disabled');
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Notifications = require('expo-notifications');

    // Foreground behaviour
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('[localNotifications] module load failed:', err);
    Notifications = null;
  }
  return Notifications;
}

let channelReady = false;

export async function ensureNotificationSetup(): Promise<boolean> {
  const N = loadNotifications();
  if (!N) return false;

  try {
    if (Platform.OS === 'android' && !channelReady) {
      await N.setNotificationChannelAsync('hse-reports', {
        name: 'HSE Reports',
        importance: N.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E5284B',
        sound: 'default',
      });
      channelReady = true;
    }

    const { status: existing } = await N.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await N.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('[localNotifications] setup failed:', err);
    return false;
  }
}

export async function showReportNotification(opts: {
  title: string;
  body: string;
  reportId: string;
}): Promise<void> {
  const N = loadNotifications();
  if (!N) return;

  try {
    await N.scheduleNotificationAsync({
      content: {
        title: opts.title,
        body: opts.body,
        sound: 'default',
        data: { reportId: opts.reportId },
        ...(Platform.OS === 'android' ? { channelId: 'hse-reports' } : {}),
      },
      trigger: null,
    });
  } catch (err) {
    console.warn('[localNotifications] fire failed:', err);
  }
}
