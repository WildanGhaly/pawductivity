// HTTP server and routing for the Pawductivity local backend.
// Built on node:http only. No external packages.

import { createServer } from 'node:http';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEFAULT_DB_PATH, closeDb, openDb } from './db.mjs';
import {
  billingVerify,
  fail,
  health,
  notFound,
  referralClaim,
  referralCode,
  syncPull,
  syncPush,
} from './handlers.mjs';

const MAX_BODY_BYTES = 1024 * 1024; // 1 MB is plenty for a save file.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    ...CORS_HEADERS,
  });
  // Node omits the body for HEAD automatically, so this is safe for every method.
  res.end(payload);
}

/**
 * The client is still uploading a body we refused. Read and discard the rest so
 * the response we just wrote actually reaches it, but stop after a bounded
 * amount so a hostile stream cannot keep us reading forever.
 */
function drainRequest(req, limit = MAX_BODY_BYTES * 8) {
  if (req.readableEnded || req.destroyed) return;
  let drained = 0;
  req.on('data', (chunk) => {
    drained += chunk.length;
    if (drained > limit) req.destroy();
  });
  req.resume();
}

function tooLarge() {
  return Object.assign(new Error('body too large'), { code: 'too_large' });
}

/**
 * Buffer the request body, capped at MAX_BODY_BYTES.
 *
 * On overflow we pause the stream instead of destroying it: destroying kills
 * the socket before the 413 can be written, so the client sees ECONNRESET
 * rather than the documented error body. The caller closes the connection
 * once the response has been flushed.
 */
function readBody(req) {
  return new Promise((resolvePromise, rejectPromise) => {
    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      req.pause();
      rejectPromise(tooLarge());
      return;
    }

    const chunks = [];
    let size = 0;
    let settled = false;

    req.on('data', (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        settled = true;
        req.pause();
        rejectPromise(tooLarge());
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolvePromise(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', (err) => {
      if (settled) return;
      settled = true;
      rejectPromise(err);
    });
  });
}

function parseJson(raw) {
  if (raw.trim() === '') return {};
  return JSON.parse(raw);
}

/**
 * Build the request listener bound to an open database handle.
 */
export function createHandler(db) {
  return async function handle(req, res) {
    let url;
    try {
      url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    } catch {
      sendJson(res, 404, notFound().body);
      return;
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    const path = url.pathname.replace(/\/+$/, '') || '/';
    const query = Object.fromEntries(url.searchParams.entries());
    // HEAD is GET without a body; Node strips the payload for us.
    const method = req.method === 'HEAD' ? 'GET' : req.method;

    try {
      if (method === 'GET' && path === '/api/health') {
        const { status, body } = health();
        sendJson(res, status, body);
        return;
      }

      if (method === 'GET' && path === '/api/referral/code') {
        const { status, body } = referralCode(db, query);
        sendJson(res, status, body);
        return;
      }

      if (method === 'GET' && path === '/api/sync/pull') {
        const { status, body } = syncPull(db, query);
        sendJson(res, status, body);
        return;
      }

      if (
        method === 'POST' &&
        (path === '/api/referral/claim' || path === '/api/sync/push' || path === '/api/billing/verify')
      ) {
        let payload;
        try {
          payload = parseJson(await readBody(req));
        } catch (err) {
          if (err?.code === 'too_large') {
            const { status, body } = fail(413, 'body_too_large', 'Request body is too large.');
            sendJson(res, status, body);
            drainRequest(req);
            return;
          }
          const { status, body } = fail(400, 'bad_json');
          sendJson(res, status, body);
          return;
        }
        if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
          const { status, body } = fail(400, 'bad_json', 'Request body must be a JSON object.');
          sendJson(res, status, body);
          return;
        }

        const { status, body } =
          path === '/api/referral/claim'
            ? referralClaim(db, payload)
            : path === '/api/billing/verify'
              ? billingVerify(db, payload)
              : syncPush(db, payload);
        sendJson(res, status, body);
        return;
      }

      const { status, body } = notFound();
      sendJson(res, status, body);
    } catch (err) {
      console.error('[pawductivity] unhandled error:', err);
      const { status, body } = fail(500, 'server_error', 'Something went wrong on the server.');
      sendJson(res, status, body);
    }
  };
}

/**
 * Start an HTTP server. Pass port 0 for an ephemeral port (tests do this).
 * Returns { server, db, port, url, close }.
 */
export async function startServer({ port = Number(process.env.PORT ?? 4000), dbPath = DEFAULT_DB_PATH, host = '127.0.0.1' } = {}) {
  const db = openDb(dbPath);
  const server = createServer(createHandler(db));

  await new Promise((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise);
    server.listen(port, host, () => {
      server.removeListener('error', rejectPromise);
      resolvePromise();
    });
  });

  const actualPort = server.address().port;
  const url = `http://${host}:${actualPort}`;

  const close = () =>
    new Promise((resolvePromise) => {
      server.close(() => {
        closeDb(db);
        resolvePromise();
      });
      server.closeAllConnections?.();
    });

  return { server, db, port: actualPort, url, close };
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(resolve(entry)) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return resolve(entry) === fileURLToPath(import.meta.url);
  }
}

if (isMain()) {
  const { url, close } = await startServer();
  console.log(`[pawductivity] backend listening on ${url}`);
  console.log('[pawductivity] local-first service, nothing is deployed and nothing leaves this machine.');

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      console.log(`\n[pawductivity] ${signal} received, shutting down.`);
      close().then(() => process.exit(0));
    });
  }
}
