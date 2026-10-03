import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are shown while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let channelReady = false;

/**
 * Ask for notification permission and set up the Android channel.
 * Safe to call multiple times — it's a no-op after the first success.
 */
export async function ensureNotificationSetup(): Promise<boolean> {
  try {
    if (Platform.OS === 'android' && !channelReady) {
      await Notifications.setNotificationChannelAsync('hse-reports', {
        name: 'HSE Reports',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E5284B',
        sound: 'default',
      });
      channelReady = true;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('[localNotifications] setup failed:', err);
    return false;
  }
}

/**
 * Fire an immediate OS notification (banner + vibration + sound).
 */
export async function showReportNotification(opts: {
  title: string;
  body: string;
  reportId: string;
}): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: opts.title,
        body: opts.body,
        sound: 'default',
        data: { reportId: opts.reportId },
        ...(Platform.OS === 'android' ? { channelId: 'hse-reports' } : {}),
      },
      trigger: null, // immediate
    });
  } catch (err) {
    console.warn('[localNotifications] fire failed:', err);
  }
}
