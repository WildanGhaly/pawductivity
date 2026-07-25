import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// expo-notifications is a native module: it is absent in Expo Go (SDK 53+) and on
// web. Everything here is lazily required and guarded so the app can never crash
// when the module is unavailable (same pattern as billing.ts / google.ts).
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let N: any = null;
let inited = false;

function mod(): any | null {
  if (Platform.OS === 'web' || isExpoGo) return null;
  if (N) return N;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    N = require('expo-notifications');
    return N;
  } catch {
    return null;
  }
}

export function isNotifSupported(): boolean {
  return !!mod();
}

export type ReminderLike = {
  id: number;
  name: string;
  time: string; // HH:MM (24h)
  rep: string; // once | daily | weekdays | weekly | monthly
  y?: number;
  mo?: number;
  day?: number;
};

const FOCUS_ID = 'pawductivity-focus-end';
const ONGOING_ID = 'pawductivity-focus-ongoing';

// Foreground presentation handler + Android channels. Safe to call repeatedly.
export async function initNotifications(): Promise<void> {
  const m = mod();
  if (!m || inited) return;
  inited = true;
  try {
    m.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      const chan = (id: string, name: string) =>
        m.setNotificationChannelAsync(id, {
          name,
          importance: m.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility: m.AndroidNotificationVisibility?.PUBLIC,
        });
      await chan('focus', 'Focus timer');
      await chan('reminders', 'Reminders');
    }
  } catch (e) {
    console.warn('[notif] init failed', e);
  }
}

export async function hasNotifPermission(): Promise<boolean> {
  const m = mod();
  if (!m) return false;
  try {
    const p = await m.getPermissionsAsync();
    return !!p.granted;
  } catch {
    return false;
  }
}

// Requests the OS notification permission (Android 13+ prompt). Returns the result.
export async function requestNotifPermission(): Promise<boolean> {
  const m = mod();
  if (!m) return false;
  try {
    await initNotifications();
    const cur = await m.getPermissionsAsync();
    if (cur.granted) return true;
    const req = await m.requestPermissionsAsync();
    return !!req.granted;
  } catch {
    return false;
  }
}

// ---------- Focus timer ----------

// Schedules the end-of-phase alert at `atMs` (epoch ms). Replaces any prior focus
// alert. This is what fires when the session ends while the app is backgrounded or
// even fully killed (the OS holds the scheduled notification).
export async function scheduleFocusEnd(atMs: number, title: string, body: string): Promise<void> {
  const m = mod();
  if (!m) return;
  try {
    await m.cancelScheduledNotificationAsync(FOCUS_ID).catch(() => {});
    const seconds = Math.max(1, Math.round((atMs - Date.now()) / 1000));
    await m.scheduleNotificationAsync({
      identifier: FOCUS_ID,
      content: { title, body, sound: 'default', data: { type: 'focus' } },
      trigger: {
        type: m.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
        seconds,
        channelId: 'focus',
      },
    });
  } catch (e) {
    console.warn('[notif] scheduleFocusEnd', e);
  }
}

export async function cancelFocusEnd(): Promise<void> {
  const m = mod();
  if (!m) return;
  try {
    await m.cancelScheduledNotificationAsync(FOCUS_ID);
  } catch {
    /* ignore */
  }
}

// A sticky "focus in progress" notification so the running timer is visible in the
// shade while the app is backgrounded (Android only; best-effort).
export async function showOngoingFocus(title: string, body: string): Promise<void> {
  const m = mod();
  if (!m || Platform.OS !== 'android') return;
  try {
    await m.scheduleNotificationAsync({
      identifier: ONGOING_ID,
      content: { title, body, data: { type: 'focus-ongoing' }, sticky: true, autoDismiss: false },
      trigger: null,
    });
  } catch (e) {
    console.warn('[notif] ongoing', e);
  }
}

export async function clearOngoingFocus(): Promise<void> {
  const m = mod();
  if (!m) return;
  try {
    await m.cancelScheduledNotificationAsync(ONGOING_ID).catch(() => {});
    await m.dismissNotificationAsync(ONGOING_ID).catch(() => {});
  } catch {
    /* ignore */
  }
}

// ---------- Reminders ----------

function reminderTriggers(m: any, r: ReminderLike, hh: number, mm: number): any[] {
  const T = m.SchedulableTriggerInputTypes;
  const ch = 'reminders';
  const now = new Date();
  switch (r.rep) {
    case 'daily':
      return [{ type: T.DAILY, hour: hh, minute: mm, channelId: ch }];
    case 'weekly': {
      const anchor = new Date(r.y ?? now.getFullYear(), r.mo ?? now.getMonth(), r.day ?? now.getDate());
      return [{ type: T.WEEKLY, weekday: anchor.getDay() + 1, hour: hh, minute: mm, channelId: ch }];
    }
    case 'weekdays':
      // expo weekday: 1=Sunday .. 7=Saturday, so Mon-Fri = 2..6.
      return [2, 3, 4, 5, 6].map((weekday) => ({ type: T.WEEKLY, weekday, hour: hh, minute: mm, channelId: ch }));
    case 'monthly':
      return [{ type: T.MONTHLY, day: r.day ?? 1, hour: hh, minute: mm, channelId: ch }];
    default: {
      // one-off: fire on the anchored date; skip if it is already in the past.
      const d = new Date(r.y ?? now.getFullYear(), r.mo ?? now.getMonth(), r.day ?? now.getDate(), hh, mm, 0, 0);
      if (d.getTime() <= Date.now()) return [];
      return [{ type: T.DATE, date: d, channelId: ch }];
    }
  }
}

// Reschedules every reminder notification from the current list. Cancels only our
// reminder notifications (tagged data.type='reminder'), leaving the focus alert.
export async function syncReminders(reminders: ReminderLike[], enabled: boolean): Promise<void> {
  const m = mod();
  if (!m) return;
  try {
    const all = await m.getAllScheduledNotificationsAsync().catch(() => []);
    for (const n of all as any[]) {
      if (n?.content?.data?.type === 'reminder') {
        await m.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
      }
    }
    if (!enabled) return;
    if (!(await hasNotifPermission())) return;
    for (const r of reminders) {
      const parts = (r.time || '00:00').split(':');
      const hh = parseInt(parts[0], 10) || 0;
      const mm = parseInt(parts[1], 10) || 0;
      for (const trigger of reminderTriggers(m, r, hh, mm)) {
        await m
          .scheduleNotificationAsync({
            content: { title: 'Pawductivity reminder', body: r.name, sound: 'default', data: { type: 'reminder', id: r.id } },
            trigger,
          })
          .catch(() => {});
      }
    }
  } catch (e) {
    console.warn('[notif] syncReminders', e);
  }
}
