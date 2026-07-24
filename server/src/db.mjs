// SQLite storage layer for the Pawductivity backend.
// Uses only node:sqlite (Node 24+). No external packages.

import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// server/data/pawductivity.db by default.
export const DEFAULT_DB_PATH = resolve(HERE, '..', 'data', 'pawductivity.db');

const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const CODE_PATTERN = /^PAW-[A-Z0-9]{4}$/;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS devices (
  device_id  TEXT PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS redemptions (
  device_id    TEXT PRIMARY KEY,
  code         TEXT NOT NULL,
  owner_device TEXT NOT NULL,
  coins        INTEGER NOT NULL,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_state (
  device_id     TEXT PRIMARY KEY,
  state         TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  updated_at_ms INTEGER NOT NULL
);
`;

/**
 * Derive a candidate code from a device id plus a salt round.
 * Deterministic: the same device id and round always yield the same code.
 */
export function deriveCode(deviceId, round = 0) {
  const digest = createHash('sha256')
    .update(`${deviceId}#${round}`, 'utf8')
    .digest();
  let out = 'PAW-';
  for (let i = 0; i < 4; i += 1) {
    out += CODE_ALPHABET[digest[i] % CODE_ALPHABET.length];
  }
  return out;
}

/**
 * Open (and migrate) the database. Creates the parent directory if missing.
 * Pass ':memory:' for a throwaway in-process database.
 */
export function openDb(dbPath = DEFAULT_DB_PATH) {
  if (dbPath !== ':memory:') {
    mkdirSync(dirname(resolve(dbPath)), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}

export function closeDb(db) {
  try {
    db.close();
  } catch {
    // already closed, nothing to do
  }
}

/* ------------------------------------------------------------------ */
/* referral queries                                                    */
/* ------------------------------------------------------------------ */

export function findDeviceByDeviceId(db, deviceId) {
  return (
    db
      .prepare('SELECT device_id, code, created_at FROM devices WHERE device_id = ?')
      .get(deviceId) ?? null
  );
}

export function findDeviceByCode(db, code) {
  return (
    db
      .prepare('SELECT device_id, code, created_at FROM devices WHERE code = ?')
      .get(code) ?? null
  );
}

/**
 * Return the stable invite code for a device, creating one on first call.
 * The code is deterministic per device and unique across devices: on the
 * (very rare) collision we re-derive with the next round until free.
 */
export function getOrCreateCode(db, deviceId, now = new Date().toISOString()) {
  const existing = findDeviceByDeviceId(db, deviceId);
  if (existing) return existing.code;

  const insert = db.prepare(
    'INSERT INTO devices (device_id, code, created_at) VALUES (?, ?, ?)'
  );

  for (let round = 0; round < 1000; round += 1) {
    const code = deriveCode(deviceId, round);
    if (findDeviceByCode(db, code)) continue;
    try {
      insert.run(deviceId, code, now);
      return code;
    } catch (err) {
      // Lost a race on the UNIQUE index: try the next round.
      if (!String(err?.message ?? '').includes('UNIQUE')) throw err;
      const raced = findDeviceByDeviceId(db, deviceId);
      if (raced) return raced.code;
    }
  }
  throw new Error('could not allocate a unique referral code');
}

export function findRedemption(db, deviceId) {
  return (
    db
      .prepare(
        'SELECT device_id, code, owner_device, coins, created_at FROM redemptions WHERE device_id = ?'
      )
      .get(deviceId) ?? null
  );
}

export function recordRedemption(
  db,
  { deviceId, code, ownerDevice, coins },
  now = new Date().toISOString()
) {
  db.prepare(
    'INSERT INTO redemptions (device_id, code, owner_device, coins, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(deviceId, code, ownerDevice, coins, now);
}

/* ------------------------------------------------------------------ */
/* sync queries                                                        */
/* ------------------------------------------------------------------ */

export function getSyncState(db, deviceId) {
  return (
    db
      .prepare(
        'SELECT device_id, state, updated_at, updated_at_ms FROM sync_state WHERE device_id = ?'
      )
      .get(deviceId) ?? null
  );
}

export function putSyncState(db, { deviceId, state, updatedAt, updatedAtMs }) {
  db.prepare(
    `INSERT INTO sync_state (device_id, state, updated_at, updated_at_ms)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(device_id) DO UPDATE SET
       state = excluded.state,
       updated_at = excluded.updated_at,
       updated_at_ms = excluded.updated_at_ms`
  ).run(deviceId, state, updatedAt, updatedAtMs);
}
