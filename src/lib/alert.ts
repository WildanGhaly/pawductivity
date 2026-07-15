import { Alert, Platform } from 'react-native';

export type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

/**
 * Cross-platform alert.
 *
 * react-native-web ships `Alert` as a literal no-op (`class Alert { static alert() {} }`),
 * so on web a confirmation never renders AND — the real hazard — a button's `onPress` never
 * fires. Any navigation or mutation wired to a button (finish a Focus Session, delete a quest,
 * surface "Not enough coins") is silently lost. This helper falls back to the DOM
 * `window.alert`/`window.confirm` on web and always invokes the appropriate handler, so the
 * same call site behaves correctly on every platform.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;
  const hasWindow = typeof window !== 'undefined';

  if (!buttons || buttons.length === 0) {
    if (hasWindow) window.alert(text);
    return;
  }

  const confirmBtn = buttons.find((b) => b.style !== 'cancel') ?? buttons[0];
  const cancelBtn = buttons.find((b) => b.style === 'cancel');

  // A single actionable button is informational — acknowledge, then run its handler
  // (this is how the Focus-complete "Nice → router.back()" navigation reaches web).
  if (buttons.length === 1) {
    if (hasWindow) window.alert(text);
    confirmBtn.onPress?.();
    return;
  }

  const ok = hasWindow ? window.confirm(text) : true;
  if (ok) confirmBtn.onPress?.();
  else cancelBtn?.onPress?.();
}
