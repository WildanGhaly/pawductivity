# Pawductivity backend (local-first)

The one piece of Pawductivity that is not offline: referral code verification and optional
cloud backup/sync. Everything else in the app stays on the device.

This service is **local-first**. It runs on your machine, stores data in a local SQLite file,
and is **not deployed anywhere**. It never calls out to the internet and there is no cloud
configuration to fill in.

## Zero dependencies

There is nothing to install. No `npm install`, no lockfile, no `node_modules`. The service uses
only Node built-ins:

- `node:http` for the server
- `node:sqlite` for storage (requires Node 22.5+; developed on Node 24)
- `node:crypto` for deterministic referral codes
- `node:test` + `node:assert` for the tests

## Run it

```bash
cd server
node src/index.mjs          # or: npm start
```

It logs the listening URL on start. The port comes from `PORT`, default `4000`:

```bash
PORT=5001 node src/index.mjs          # bash
$env:PORT=5001; node src/index.mjs    # PowerShell
```

The SQLite file is created on first run at `server/data/pawductivity.db`. The `data/` directory
is created automatically and is gitignored.

## Test it

```bash
cd server
npm test                    # node --test "test/**/*.test.mjs"
```

Or without npm:

```bash
node --test                        # auto-discovers test/**/*.test.mjs
node --test "test/**/*.test.mjs"   # explicit
node --test test/api.test.mjs      # single file
```

Note: on Node 24 a bare directory argument (`node --test test/`) is treated as a file path, not a
directory to scan, and fails with `Cannot find module .../test`. Use one of the forms above.

The tests boot the real HTTP server on an ephemeral port against a throwaway SQLite file in the
OS temp directory, exercise every endpoint and every error case, then clean up. All data used is
synthetic.

## API

JSON in, JSON out. CORS is wide open for local dev (`Access-Control-Allow-Origin: *`), and
`OPTIONS` preflight returns 204. `HEAD` is answered exactly like `GET`, headers only. Every
response body carries an `ok` boolean.

### `GET /api/health`

```
200 { "ok": true, "service": "pawductivity", "time": "2026-07-24T09:00:00.000Z" }
```

### `GET /api/referral/code?deviceId=XXX`

Returns the device's stable invite code, creating it on first call. The code is derived from the
device id (same device, same code forever) and is unique across devices.

```
200 { "ok": true, "code": "PAW-AB12" }
400 { "ok": false, "error": "missing_device_id", "message": "..." }
```

### `POST /api/referral/claim`

Body: `{ "deviceId": "XXX", "code": "PAW-AB12" }`

```
200 { "ok": true, "coins": 100 }
```

The server records the redemption and returns the reward amount. The app is the one that applies
the coins to the local wallet.

Failures, all `400` with `{ ok: false, error, message }`:

| `error`            | when                                                  |
| ------------------ | ----------------------------------------------------- |
| `bad_format`       | code does not match `^PAW-[A-Z0-9]{4}$`               |
| `self_referral`    | the code belongs to the same device                   |
| `unknown_code`     | no device owns that code                              |
| `already_redeemed` | this device already redeemed a code (one per device)  |
| `missing_device_id`| no `deviceId` in the body                             |
| `missing_code`     | no `code` in the body                                 |

### `POST /api/sync/push`

Body: `{ "deviceId": "XXX", "state": { ... }, "updatedAt": "2026-07-24T10:00:00.000Z" }`

`state` is an opaque JSON blob, the server never looks inside it. `updatedAt` accepts an ISO
timestamp or epoch milliseconds; omit it and the server stamps "now".

A timestamp string is echoed back exactly as sent. Epoch milliseconds are normalised to ISO 8601
on the way in, so what `pull` returns is always something `Date.parse` can read. Values outside the
range a `Date` can represent (`|ms| > 8.64e15`) are rejected with `bad_updated_at` rather than
stored, which is what stops a bogus far-future stamp from pinning a device at "stale" forever.

```
200 { "ok": true, "updatedAt": "2026-07-24T10:00:00.000Z" }
400 { "ok": false, "error": "missing_state" | "bad_updated_at", "message": "..." }
409 { "ok": false, "error": "stale", "serverUpdatedAt": "2026-07-24T12:00:00.000Z", "message": "..." }
```

A `409` means the server already holds a newer state for that device, so the client should pull
and resolve before pushing again. A push with an equal or newer `updatedAt` overwrites.

### `GET /api/sync/pull?deviceId=XXX`

```
200 { "ok": true, "state": { ... }, "updatedAt": "2026-07-24T10:00:00.000Z" }
404 { "ok": false, "error": "not_found", "message": "..." }
```

### Anything else

```
404 { "ok": false, "error": "not_found", "message": "Unknown route." }
400 { "ok": false, "error": "bad_json", "message": "..." }     malformed request body
413 { "ok": false, "error": "body_too_large", "message": "..." } body over 1 MB
```

The 1 MB cap is enforced from `Content-Length` when the client sends one and from the byte count
otherwise, so a chunked upload is capped too. The 413 is written before the connection is closed
and the remainder of the upload is drained (bounded), so clients get the JSON error rather than a
reset socket.

## Layout

```
server/
  src/index.mjs      http server, routing, CORS, body parsing
  src/db.mjs         node:sqlite schema and queries, code derivation
  src/handlers.mjs   endpoint logic and rules, returns { status, body }
  test/api.test.mjs  node:test suite over the real server
  data/              SQLite file, created at runtime, gitignored
```

## Data model

- `devices(device_id PK, code UNIQUE, created_at)` one invite code per device
- `redemptions(device_id PK, code, owner_device, coins, created_at)` one redemption per device
- `sync_state(device_id PK, state, updated_at, updated_at_ms)` last pushed blob per device

Referral codes are derived with `sha256(deviceId + '#' + round)` mapped onto `A-Z0-9`, starting at
round 0 and bumping the round only if that code is already taken by another device. Deterministic
per device, unique across devices.
