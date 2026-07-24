// Endpoint logic. Every handler is pure-ish: it takes the db plus the parsed
// request input and returns { status, body }. No node:http types in here, so
// the rules stay easy to unit test.

import {
  CODE_PATTERN,
  findDeviceByCode,
  findDeviceByDeviceId,
  findRedemption,
  getOrCreateCode,
  getSyncState,
  putSyncState,
  recordRedemption,
} from './db.mjs';

export const REFERRAL_REWARD_COINS = 100;

const ERROR_MESSAGES = {
  bad_format: 'Invite codes look like PAW-AB12.',
  self_referral: 'You cannot redeem your own invite code.',
  unknown_code: 'No one owns that invite code.',
  already_redeemed: 'This device has already redeemed an invite code.',
  missing_device_id: 'A deviceId is required.',
  missing_code: 'A code is required.',
  missing_state: 'A state object is required.',
  bad_updated_at: 'updatedAt must be an ISO timestamp or epoch milliseconds.',
  stale: 'The server has a newer state for this device.',
  not_found: 'Nothing found.',
  bad_json: 'Request body is not valid JSON.',
};

export function fail(status, error, message) {
  return {
    status,
    body: { ok: false, error, message: message ?? ERROR_MESSAGES[error] ?? error },
  };
}

function ok(status, body) {
  return { status, body: { ok: true, ...body } };
}

function cleanDeviceId(value) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

// Widest instant the ECMAScript Date type can represent. Anything past this is
// not a timestamp, and letting it through would pin updated_at_ms at a value no
// honest client can ever beat, locking the device out of sync forever.
export const MAX_EPOCH_MS = 8.64e15;

function inRange(ms) {
  return Number.isFinite(ms) && Math.abs(ms) <= MAX_EPOCH_MS ? Math.trunc(ms) : null;
}

/** Accepts an ISO 8601 string or epoch milliseconds. Returns null if neither. */
export function toMillis(value) {
  if (typeof value === 'number') return inRange(value);
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return inRange(parsed);
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return inRange(asNumber);
  }
  return null;
}

/**
 * What we store and echo back as `updatedAt`. A timestamp string round trips
 * exactly as the client wrote it; epoch milliseconds (number or numeric string)
 * become ISO 8601 so that `pull` always hands back something `Date.parse` can
 * read.
 */
export function normaliseUpdatedAt(raw, ms) {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed !== '' && Number.isNaN(Number(trimmed)) && !Number.isNaN(Date.parse(trimmed))) {
      return trimmed;
    }
  }
  return new Date(ms).toISOString();
}

/* ------------------------------------------------------------------ */

export function health() {
  return ok(200, { service: 'pawductivity', time: new Date().toISOString() });
}

/** GET /api/referral/code?deviceId=XXX */
export function referralCode(db, query) {
  const deviceId = cleanDeviceId(query?.deviceId);
  if (!deviceId) return fail(400, 'missing_device_id');
  return ok(200, { code: getOrCreateCode(db, deviceId) });
}

/** POST /api/referral/claim { deviceId, code } */
export function referralClaim(db, body) {
  const deviceId = cleanDeviceId(body?.deviceId);
  if (!deviceId) return fail(400, 'missing_device_id');

  const rawCode = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!rawCode) return fail(400, 'missing_code');
  if (!CODE_PATTERN.test(rawCode)) return fail(400, 'bad_format');

  // Make sure the claiming device exists so it has its own code too.
  getOrCreateCode(db, deviceId);

  const self = findDeviceByDeviceId(db, deviceId);
  if (self && self.code === rawCode) return fail(400, 'self_referral');

  const owner = findDeviceByCode(db, rawCode);
  if (!owner) return fail(400, 'unknown_code');
  if (owner.device_id === deviceId) return fail(400, 'self_referral');

  if (findRedemption(db, deviceId)) return fail(400, 'already_redeemed');

  recordRedemption(db, {
    deviceId,
    code: rawCode,
    ownerDevice: owner.device_id,
    coins: REFERRAL_REWARD_COINS,
  });

  return ok(200, { coins: REFERRAL_REWARD_COINS });
}

/** POST /api/sync/push { deviceId, state, updatedAt } */
export function syncPush(db, body) {
  const deviceId = cleanDeviceId(body?.deviceId);
  if (!deviceId) return fail(400, 'missing_device_id');
  if (body?.state === undefined || body.state === null) return fail(400, 'missing_state');

  const updatedAtRaw = body?.updatedAt ?? new Date().toISOString();
  const incomingMs = toMillis(updatedAtRaw);
  if (incomingMs === null) return fail(400, 'bad_updated_at');

  const existing = getSyncState(db, deviceId);
  if (existing && existing.updated_at_ms > incomingMs) {
    return {
      status: 409,
      body: {
        ok: false,
        error: 'stale',
        message: ERROR_MESSAGES.stale,
        serverUpdatedAt: existing.updated_at,
      },
    };
  }

  const updatedAt = normaliseUpdatedAt(updatedAtRaw, incomingMs);
  putSyncState(db, {
    deviceId,
    state: JSON.stringify(body.state),
    updatedAt,
    updatedAtMs: incomingMs,
  });

  return ok(200, { updatedAt });
}

/** GET /api/sync/pull?deviceId=XXX */
export function syncPull(db, query) {
  const deviceId = cleanDeviceId(query?.deviceId);
  if (!deviceId) return fail(400, 'missing_device_id');

  const row = getSyncState(db, deviceId);
  if (!row) return fail(404, 'not_found', 'No cloud backup for this device yet.');

  return ok(200, { state: JSON.parse(row.state), updatedAt: row.updated_at });
}

export function notFound() {
  return fail(404, 'not_found', 'Unknown route.');
}
