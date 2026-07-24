// Client for the Pawductivity backend (referral verification + optional cloud backup).
// Everything else in the app is offline-first; these are the only networked calls.
// The base URL is configurable so a real host can be pointed at later without code changes.
// Base URL resolution, deliberately conservative:
//   1. EXPO_PUBLIC_API_URL when set (the only way to enable the backend in a release build)
//   2. otherwise, in DEVELOPMENT ONLY, the local loopback service
//   3. otherwise nothing at all, and the client makes ZERO network calls
//
// We only ever use 127.0.0.1 (loopback), never a private LAN address. An Android
// emulator or device reaches the host service through `adb reverse tcp:4000 tcp:4000`,
// the same mechanism used for Metro. This matters: a hardcoded 10.x.x.x address is a
// routable private address on a real handset, so on a corporate LAN or VPN it could
// resolve to somebody else's machine. Loopback cannot leave the device.
const DEV_LOOPBACK = 'http://127.0.0.1:4000';

const configured = (process.env.EXPO_PUBLIC_API_URL as string | undefined)?.trim();
const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

let baseUrl: string | null = configured || (isDev ? DEV_LOOPBACK : null);

export function getApiBaseUrl(): string | null {
  return baseUrl;
}
export function isApiConfigured(): boolean {
  return !!baseUrl;
}
export function setApiBaseUrl(url: string | null): void {
  baseUrl = url ? url.replace(/\/+$/, '') : null;
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
  // No backend configured: do not touch the network at all. The app is offline-first,
  // so callers already handle this exactly like being offline.
  if (!baseUrl) {
    return { ok: false, error: 'not_configured', message: 'No backend is configured.' };
  }
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

  // Records and (in a real deployment) verifies a Google Play purchase token against
  // the Play Developer API. When the backend is unreachable the caller trusts Play,
  // which has already confirmed the purchase on device.
  verifyPurchase: (deviceId: string, productId: string, purchaseToken: string) =>
    request<{ valid: boolean; premium: boolean }>('/api/billing/verify', {
      method: 'POST',
      body: JSON.stringify({ deviceId, productId, purchaseToken, platform: 'android' }),
    }),
};

// Human-readable text for the machine error codes the backend returns.
export function referralErrorText(error: string, message?: string): string {
  switch (error) {
    case 'bad_format': return 'That code does not look right';
    case 'self_referral': return 'That is your own code';
    case 'unknown_code': return 'No one owns that code';
    case 'already_redeemed': return 'You have already redeemed a code';
    case 'offline':
    case 'timeout':
    case 'not_configured': return 'You are offline. Connect to redeem a code.';
    default: return message || 'Could not redeem that code';
  }
}
