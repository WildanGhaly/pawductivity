import { createMMKV, type MMKV } from 'react-native-mmkv';

/** Fast synchronous K/V store for settings, flags, entitlement cache, and ephemeral state. */
export const storage: MMKV = createMMKV({ id: 'pawductivity' });

/** Canonical MMKV keys (see context/data-model/state-and-mmkv.md). */
export const Keys = {
  onboardingComplete: 'settings.onboardingComplete',
  colorScheme: 'settings.colorScheme', // 'light' | 'dark' | 'system'
  activePetId: 'companion.activePetId',
  entitlementIsPremium: 'entitlement.isPremium', // cached; source of truth is the IAP SDK (stubbed for MVP)
  lastHealthDecayDate: 'maintenance.lastHealthDecayDate',
  timerActive: 'timer.active', // JSON: { taskId, startedAt } while a focus session runs
} as const;

export const kv = {
  getBool(key: string, fallback = false): boolean {
    const v = storage.getBoolean(key);
    return v === undefined ? fallback : v;
  },
  setBool(key: string, value: boolean): void {
    storage.set(key, value);
  },
  getNumber(key: string): number | undefined {
    return storage.getNumber(key);
  },
  setNumber(key: string, value: number): void {
    storage.set(key, value);
  },
  getString(key: string): string | undefined {
    return storage.getString(key);
  },
  setString(key: string, value: string): void {
    storage.set(key, value);
  },
};
