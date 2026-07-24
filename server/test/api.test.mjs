// End to end API tests. Boots the real HTTP server on an ephemeral port
// against a temp SQLite file, then talks to it over fetch.
// Run with: node --test test/

import test, { after, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { startServer } from '../src/index.mjs';

let base;
let stop;
let tmpDir;

before(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'pawductivity-test-'));
  const started = await startServer({ port: 0, dbPath: join(tmpDir, 'test.db') });
  base = started.url;
  stop = started.close;
});

after(async () => {
  if (stop) await stop();
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

async function get(path) {
  const res = await fetch(`${base}${path}`);
  return { status: res.status, body: await res.json() };
}

async function post(path, payload, { raw = false } = {}) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? payload : JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() };
}

let deviceCounter = 0;
const newDevice = (label) => `device-${label}-${++deviceCounter}`;

/* ------------------------------------------------------------------ */

describe('GET /api/health', () => {
  test('reports the service as up', async () => {
    const { status, body } = await get('/api/health');
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.service, 'pawductivity');
    assert.ok(!Number.isNaN(Date.parse(body.time)), 'time should be an ISO timestamp');
  });

  test('sends permissive CORS headers for local dev', async () => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  });

  test('answers CORS preflight', async () => {
    const res = await fetch(`${base}/api/health`, { method: 'OPTIONS' });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  });

  test('answers HEAD like GET, with no body', async () => {
    const res = await fetch(`${base}/api/health`, { method: 'HEAD' });
    assert.equal(res.status, 200);
    assert.equal(await res.text(), '');
  });
});

describe('GET /api/referral/code', () => {
  test('returns a well formed code', async () => {
    const { status, body } = await get(`/api/referral/code?deviceId=${newDevice('fmt')}`);
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.match(body.code, /^PAW-[A-Z0-9]{4}$/);
  });

  test('is stable for the same device across calls', async () => {
    const device = newDevice('stable');
    const first = await get(`/api/referral/code?deviceId=${device}`);
    const second = await get(`/api/referral/code?deviceId=${device}`);
    assert.equal(first.body.code, second.body.code);
  });

  test('is unique across devices', async () => {
    const codes = new Set();
    for (let i = 0; i < 25; i += 1) {
      const { body } = await get(`/api/referral/code?deviceId=${newDevice('uniq')}`);
      assert.match(body.code, /^PAW-[A-Z0-9]{4}$/);
      codes.add(body.code);
    }
    assert.equal(codes.size, 25, 'every device should get its own code');
  });

  test('requires a deviceId', async () => {
    const { status, body } = await get('/api/referral/code');
    assert.equal(status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.error, 'missing_device_id');
  });
});

describe('POST /api/referral/claim', () => {
  test('grants 100 coins on a valid claim', async () => {
    const owner = newDevice('owner');
    const claimer = newDevice('claimer');
    const { body: codeBody } = await get(`/api/referral/code?deviceId=${owner}`);

    const { status, body } = await post('/api/referral/claim', {
      deviceId: claimer,
      code: codeBody.code,
    });
    assert.equal(status, 200);
    assert.deepEqual(body, { ok: true, coins: 100 });
  });

  test('bad_format when the code shape is wrong', async () => {
    const { status, body } = await post('/api/referral/claim', {
      deviceId: newDevice('badfmt'),
      code: 'NOPE-1',
    });
    assert.equal(status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.error, 'bad_format');
    assert.equal(typeof body.message, 'string');
    assert.ok(body.message.length > 0);
  });

  test('self_referral when a device claims its own code', async () => {
    const device = newDevice('self');
    const { body: codeBody } = await get(`/api/referral/code?deviceId=${device}`);

    const { status, body } = await post('/api/referral/claim', {
      deviceId: device,
      code: codeBody.code,
    });
    assert.equal(status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.error, 'self_referral');
  });

  test('unknown_code when nobody owns the code', async () => {
    // Well formed but not issued to any device in this database.
    const { status, body } = await post('/api/referral/claim', {
      deviceId: newDevice('unknown'),
      code: 'PAW-ZZZZ',
    });
    assert.equal(status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.error, 'unknown_code');
  });

  test('already_redeemed on a second redemption by the same device', async () => {
    const ownerA = newDevice('ownerA');
    const ownerB = newDevice('ownerB');
    const claimer = newDevice('twice');

    const { body: codeA } = await get(`/api/referral/code?deviceId=${ownerA}`);
    const { body: codeB } = await get(`/api/referral/code?deviceId=${ownerB}`);

    const first = await post('/api/referral/claim', { deviceId: claimer, code: codeA.code });
    assert.equal(first.status, 200);
    assert.equal(first.body.coins, 100);

    const second = await post('/api/referral/claim', { deviceId: claimer, code: codeB.code });
    assert.equal(second.status, 400);
    assert.equal(second.body.ok, false);
    assert.equal(second.body.error, 'already_redeemed');
  });

  test('rejects a malformed JSON body with bad_json', async () => {
    const { status, body } = await post('/api/referral/claim', '{ "deviceId": ', { raw: true });
    assert.equal(status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.error, 'bad_json');
  });

  test('requires a deviceId', async () => {
    const { status, body } = await post('/api/referral/claim', { code: 'PAW-AB12' });
    assert.equal(status, 400);
    assert.equal(body.error, 'missing_device_id');
  });

  test('normalises a lowercase, padded code', async () => {
    const owner = newDevice('lowerowner');
    const { body: codeBody } = await get(`/api/referral/code?deviceId=${owner}`);

    const { status, body } = await post('/api/referral/claim', {
      deviceId: newDevice('lowerclaimer'),
      code: `  ${codeBody.code.toLowerCase()}  `,
    });
    assert.equal(status, 200);
    assert.deepEqual(body, { ok: true, coins: 100 });
  });
});

describe('POST /api/sync/push and GET /api/sync/pull', () => {
  test('pushes a state blob and pulls it back', async () => {
    const device = newDevice('sync');
    const state = { coins: 320, pets: [{ id: 'p1', name: 'Mochi', level: 3 }], streak: 7 };
    const updatedAt = '2026-07-24T10:00:00.000Z';

    const push = await post('/api/sync/push', { deviceId: device, state, updatedAt });
    assert.equal(push.status, 200);
    assert.deepEqual(push.body, { ok: true, updatedAt });

    const pull = await get(`/api/sync/pull?deviceId=${device}`);
    assert.equal(pull.status, 200);
    assert.equal(pull.body.ok, true);
    assert.deepEqual(pull.body.state, state);
    assert.equal(pull.body.updatedAt, updatedAt);
  });

  test('a newer push overwrites the stored state', async () => {
    const device = newDevice('overwrite');
    await post('/api/sync/push', {
      deviceId: device,
      state: { coins: 1 },
      updatedAt: '2026-07-24T10:00:00.000Z',
    });
    const newer = await post('/api/sync/push', {
      deviceId: device,
      state: { coins: 2 },
      updatedAt: '2026-07-24T11:00:00.000Z',
    });
    assert.equal(newer.status, 200);

    const pull = await get(`/api/sync/pull?deviceId=${device}`);
    assert.deepEqual(pull.body.state, { coins: 2 });
    assert.equal(pull.body.updatedAt, '2026-07-24T11:00:00.000Z');
  });

  test('stale: rejects a push older than the stored state', async () => {
    const device = newDevice('stale');
    const serverUpdatedAt = '2026-07-24T12:00:00.000Z';
    await post('/api/sync/push', {
      deviceId: device,
      state: { coins: 500 },
      updatedAt: serverUpdatedAt,
    });

    const { status, body } = await post('/api/sync/push', {
      deviceId: device,
      state: { coins: 1 },
      updatedAt: '2026-07-24T09:00:00.000Z',
    });
    assert.equal(status, 409);
    assert.equal(body.ok, false);
    assert.equal(body.error, 'stale');
    assert.equal(body.serverUpdatedAt, serverUpdatedAt);

    // The stored state must be untouched.
    const pull = await get(`/api/sync/pull?deviceId=${device}`);
    assert.deepEqual(pull.body.state, { coins: 500 });
  });

  test('not_found when a device has never pushed', async () => {
    const { status, body } = await get(`/api/sync/pull?deviceId=${newDevice('empty')}`);
    assert.equal(status, 404);
    assert.equal(body.ok, false);
    assert.equal(body.error, 'not_found');
  });

  test('pull requires a deviceId', async () => {
    const { status, body } = await get('/api/sync/pull');
    assert.equal(status, 400);
    assert.equal(body.error, 'missing_device_id');
  });

  test('push rejects malformed JSON with bad_json', async () => {
    const { status, body } = await post('/api/sync/push', 'not json at all', { raw: true });
    assert.equal(status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.error, 'bad_json');
  });

  test('push requires a state', async () => {
    const { status, body } = await post('/api/sync/push', {
      deviceId: newDevice('nostate'),
      updatedAt: '2026-07-24T10:00:00.000Z',
    });
    assert.equal(status, 400);
    assert.equal(body.error, 'missing_state');
  });

  test('epoch milliseconds round trip as a parseable ISO timestamp', async () => {
    const device = newDevice('epoch');
    const ms = Date.parse('2026-07-24T10:00:00.000Z');

    const push = await post('/api/sync/push', { deviceId: device, state: { a: 1 }, updatedAt: ms });
    assert.equal(push.status, 200);
    assert.equal(push.body.updatedAt, '2026-07-24T10:00:00.000Z');

    const pull = await get(`/api/sync/pull?deviceId=${device}`);
    assert.equal(pull.body.updatedAt, '2026-07-24T10:00:00.000Z');
    assert.ok(
      !Number.isNaN(Date.parse(pull.body.updatedAt)),
      'a client must be able to parse what pull returns'
    );
  });

  test('rejects an out of range updatedAt instead of locking the device out', async () => {
    const device = newDevice('poison');

    const poison = await post('/api/sync/push', {
      deviceId: device,
      state: { a: 1 },
      updatedAt: 1e300,
    });
    assert.equal(poison.status, 400);
    assert.equal(poison.body.error, 'bad_updated_at');

    // The device can still sync normally afterwards.
    const normal = await post('/api/sync/push', {
      deviceId: device,
      state: { a: 2 },
      updatedAt: '2026-07-24T10:00:00.000Z',
    });
    assert.equal(normal.status, 200);

    const pull = await get(`/api/sync/pull?deviceId=${device}`);
    assert.deepEqual(pull.body.state, { a: 2 });
  });

  test('rejects an oversized body with a real 413 body, not a dropped socket', async () => {
    const payload = JSON.stringify({
      deviceId: newDevice('oversize'),
      state: { pad: 'x'.repeat(2 * 1024 * 1024) },
      updatedAt: '2026-07-24T10:00:00.000Z',
    });
    const res = await fetch(`${base}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    assert.equal(res.status, 413);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.error, 'body_too_large');
  });

  test('accepts a large but legal state blob', async () => {
    const device = newDevice('biglegal');
    const state = { pad: 'y'.repeat(200 * 1024) };
    const push = await post('/api/sync/push', {
      deviceId: device,
      state,
      updatedAt: '2026-07-24T10:00:00.000Z',
    });
    assert.equal(push.status, 200);

    const pull = await get(`/api/sync/pull?deviceId=${device}`);
    assert.equal(pull.body.state.pad.length, 200 * 1024);
  });
});

describe('routing', () => {
  test('unknown route returns not_found', async () => {
    const { status, body } = await get('/api/does-not-exist');
    assert.equal(status, 404);
    assert.equal(body.ok, false);
    assert.equal(body.error, 'not_found');
  });

  test('right path with the wrong method returns not_found', async () => {
    const { status, body } = await post('/api/health', {});
    assert.equal(status, 404);
    assert.equal(body.ok, false);
    assert.equal(body.error, 'not_found');
  });
});

describe('hardening', () => {
  test('a SQL injection payload in deviceId is treated as plain text', async () => {
    const nasty = `x'; DROP TABLE devices;--`;
    const first = await get(`/api/referral/code?deviceId=${encodeURIComponent(nasty)}`);
    assert.equal(first.status, 200);
    assert.match(first.body.code, /^PAW-[A-Z0-9]{4}$/);

    // Tables are intact and the id round trips as its own device.
    const again = await get(`/api/referral/code?deviceId=${encodeURIComponent(nasty)}`);
    assert.equal(again.body.code, first.body.code);
    assert.equal((await get('/api/health')).status, 200);
  });

  test('concurrent claims by one device cannot double redeem', async () => {
    const ownerA = newDevice('raceA');
    const ownerB = newDevice('raceB');
    const claimer = newDevice('raceC');
    const { body: a } = await get(`/api/referral/code?deviceId=${ownerA}`);
    const { body: b } = await get(`/api/referral/code?deviceId=${ownerB}`);

    const [one, two] = await Promise.all([
      post('/api/referral/claim', { deviceId: claimer, code: a.code }),
      post('/api/referral/claim', { deviceId: claimer, code: b.code }),
    ]);
    const statuses = [one.status, two.status].sort();
    assert.deepEqual(statuses, [200, 400], 'exactly one claim should win');
    const loser = one.status === 400 ? one : two;
    assert.equal(loser.body.error, 'already_redeemed');
  });

  test('concurrent code lookups for one new device return a single code', async () => {
    const device = newDevice('racecode');
    const bodies = await Promise.all(
      Array.from({ length: 10 }, () => get(`/api/referral/code?deviceId=${device}`))
    );
    const codes = new Set(bodies.map((r) => r.body.code));
    assert.equal(codes.size, 1, 'a device must never end up with two codes');
  });
});

describe('persistence', () => {
  test('data survives a server restart on the same db file', async () => {
    const dbPath = join(tmpDir, 'restart.db');
    const device = newDevice('restart');

    const first = await startServer({ port: 0, dbPath });
    const codeRes = await fetch(`${first.url}/api/referral/code?deviceId=${device}`);
    const { code } = await codeRes.json();
    await fetch(`${first.url}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: device,
        state: { coins: 42 },
        updatedAt: '2026-07-24T10:00:00.000Z',
      }),
    });
    await first.close();

    const second = await startServer({ port: 0, dbPath });
    const againRes = await fetch(`${second.url}/api/referral/code?deviceId=${device}`);
    const again = await againRes.json();
    assert.equal(again.code, code);

    const pullRes = await fetch(`${second.url}/api/sync/pull?deviceId=${device}`);
    const pull = await pullRes.json();
    assert.deepEqual(pull.state, { coins: 42 });
    await second.close();
  });
});
