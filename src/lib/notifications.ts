/**
 * Local notification helpers (reminders + focus alerts).
 * All local — no push server. Native-only; safely no-ops on web.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

/** Create the Android channel + set the foreground handler. Call once on startup. */
export async function setupNotifications(): Promise<void> {
  if (!isNative) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () =>
        ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }) as any,
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }
  } catch {}
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

/** Schedule a one-shot reminder. Returns the OS notification id (or null on web/failure). */
export async function scheduleReminder(title: string, remindAtMs: number): Promise<string | null> {
  if (!isNative) return null;
  if (remindAtMs <= Date.now()) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title: 'Pawductivity 🐾', body: title, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(remindAtMs),
        channelId: 'reminders',
      },
    });
  } catch {
    return null;
  }
}

export async function cancelReminder(notifId: string): Promise<void> {
  if (!isNative || !notifId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notifId);
  } catch {}
}
