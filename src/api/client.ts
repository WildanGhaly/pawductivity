// Client for the Pawductivity backend (referral verification + optional cloud backup).
// Everything else in the app is offline-first; these are the only networked calls.
// The base URL is configurable so a real host can be pointed at later without code changes.
import { Platform } from 'react-native';

// Local development default. Android emulators reach the host loopback through
// 10.0.2.2, unless `adb reverse tcp:4000 tcp:4000` is set up (then 127.0.0.1 works too).
const DEFAULT_BASE =
  Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://127.0.0.1:4000';

let baseUrl: string =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) || DEFAULT_BASE;

export function getApiBaseUrl(): string {
  return baseUrl;
}
export function setApiBaseUrl(url: string): void {
  baseUrl = url.replace(/\/+$/, '');
}

export interface ApiError {
  ok: false;
  error: string;
  message?: string;
  serverUpdatedAt?: string | number;
}
export type ApiResult<T> = ({ ok: true } & T) | ApiError;

const TIMEOUT_MS = 6000;

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
    const text = await res.text();
    let body: any = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      return { ok: false, error: 'bad_response', message: 'The server sent something unreadable.' };
    }
    if (!res.ok && body && body.ok !== true) {
      return {
        ok: false,
        error: body.error || `http_${res.status}`,
        message: body.message,
        serverUpdatedAt: body.serverUpdatedAt,
      };
    }
    return body as ApiResult<T>;
  } catch (e: any) {
    // Offline, server not running, or timed out. Callers fall back to local behaviour.
    return {
      ok: false,
      error: e?.name === 'AbortError' ? 'timeout' : 'offline',
      message: 'Could not reach the server.',
    };
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  health: () => request<{ service: string; time: string }>('/api/health'),

  referralCode: (deviceId: string) =>
    request<{ code: string }>(`/api/referral/code?deviceId=${encodeURIComponent(deviceId)}`),

  claimReferral: (deviceId: string, code: string) =>
    request<{ coins: number }>('/api/referral/claim', {
      method: 'POST',
      body: JSON.stringify({ deviceId, code }),
    }),

  syncPush: (deviceId: string, state: unknown, updatedAt: number) =>
    request<{ updatedAt: string | number }>('/api/sync/push', {
      method: 'POST',
      body: JSON.stringify({ deviceId, state, updatedAt }),
    }),

  syncPull: (deviceId: string) =>
    request<{ state: unknown; updatedAt: string | number }>(
      `/api/sync/pull?deviceId=${encodeURIComponent(deviceId)}`,
    ),
};

// Human-readable text for the machine error codes the backend returns.
export function referralErrorText(error: string, message?: string): string {
  switch (error) {
    case 'bad_format': return 'That code does not look right';
    case 'self_referral': return 'That is your own code';
    case 'unknown_code': return 'No one owns that code';
    case 'already_redeemed': return 'You have already redeemed a code';
    case 'offline':
    case 'timeout': return 'You are offline. Connect to redeem a code.';
    default: return message || 'Could not redeem that code';
  }
}
