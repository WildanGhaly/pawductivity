// Web stub: native scheduled notifications are Android/iOS only. Every entry point
// is a no-op so the web build behaves as if notifications are unavailable.
export type ReminderLike = {
  id: number;
  name: string;
  time: string;
  rep: string;
  y?: number;
  mo?: number;
  day?: number;
};

export function isNotifSupported(): boolean {
  return false;
}
export async function initNotifications(): Promise<void> {
  /* no-op */
}
export async function hasNotifPermission(): Promise<boolean> {
  return false;
}
export async function requestNotifPermission(): Promise<boolean> {
  return false;
}
export async function scheduleFocusEnd(): Promise<void> {
  /* no-op */
}
export async function cancelFocusEnd(): Promise<void> {
  /* no-op */
}
export async function showOngoingFocus(): Promise<void> {
  /* no-op */
}
export async function clearOngoingFocus(): Promise<void> {
  /* no-op */
}
export async function syncReminders(): Promise<void> {
  /* no-op */
}
