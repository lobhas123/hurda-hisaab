/*
 * Zero-dependency web server for Hurda Hisaab — with shared cloud sync.
 * Run: node server.js
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

// Load the data layer for server-side merge/normalize
const Store = require('./js/store.js');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || '0.0.0.0';

// -------------------------------------------------------------------------
// Shared state — persisted to data/state.json
// -------------------------------------------------------------------------

const DATA_DIR = path.join(ROOT, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

let serverState = null;   // Authoritative shared state (null = no data yet)
let serverVersion = 0;    // Monotonically incremented on every change

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadServerState() {
  ensureDataDir();
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      serverState = data.state || null;
      serverVersion = Number(data.version) || 0;
    }
  } catch (e) {
    console.error('[sync] Could not load state.json:', e.message);
  }
}

function saveServerState() {
  ensureDataDir();
  try {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({ state: serverState, version: serverVersion }, null, 2)
    );
  } catch (e) {
    console.error('[sync] Could not save state.json:', e.message);
  }
}

/**
 * Merge an incoming client state into the current server state.
 *
 * Rules:
 *  - Transactions: union by ID; server keeps its version of existing IDs
 *    (preserves prior edits/deletes on server). New IDs from client are added.
 *  - Deleted IDs (tracked in state._deletedIds): accumulated from both sides;
 *    matching transactions are removed.
 *  - Products: client wins for existing IDs (handles name/price changes).
 *    New product IDs from client are added.
 *  - Settings: client wins (shop name, language, etc.)
 *
 * Returns the new merged+normalized state.
 */
function mergeIncoming(incoming) {
  if (!serverState) {
    // First client ever — accept their state directly
    const s = JSON.parse(JSON.stringify(incoming));
    Store.normalize(s);
    serverState = s;
    serverVersion += 1;
    saveServerState();
    return serverState;
  }

  const base = serverState;

  // Collect all deleted IDs from both sides
  const deletedIds = new Set([
    ...(Array.isArray(base._deletedIds) ? base._deletedIds : []),
    ...(Array.isArray(incoming._deletedIds) ? incoming._deletedIds : []),
  ]);

  // Transactions: server keeps its version; new ones from client are added
  const txnMap = new Map();
  for (const t of (base.transactions || [])) txnMap.set(t.id, t);
  for (const t of (incoming.transactions || [])) {
    if (!txnMap.has(t.id)) txnMap.set(t.id, t); // new from client
    // else keep server version (server is authoritative for existing entries)
  }
  // Remove deleted transactions
  for (const id of deletedIds) txnMap.delete(id);

  // Products: client wins for all (handles price / name edits)
  const productMap = new Map();
  for (const p of (base.products || [])) productMap.set(p.id, p);
  for (const p of (incoming.products || [])) productMap.set(p.id, p);

  const merged = {
    schema: base.schema || 1,
    settings: Object.assign({}, base.settings || {}, incoming.settings || {}),
    products: Array.from(productMap.values()),
    transactions: Array.from(txnMap.values()),
    _deletedIds: Array.from(deletedIds),
  };

  // Recalculate stock / cost from the merged transaction log
  Store.normalize(merged);

  serverState = merged;
  serverVersion += 1;
  saveServerState();
  return serverState;
}

// Load persisted state on startup
loadServerState();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({ 'X-Content-Type-Options': 'nosniff' }, headers));
  res.end(body);
}

const server = http.createServer(function (req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (error) {
    send(res, 400, 'Bad request', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  // -----------------------------------------------------------------------
  // Sync API
  // -----------------------------------------------------------------------
  const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  };

  if (pathname === '/api/state' && req.method === 'GET') {
    send(res, 200,
      JSON.stringify({ state: serverState, version: serverVersion }),
      JSON_HEADERS
    );
    return;
  }

  if (pathname === '/api/state' && req.method === 'HEAD') {
    res.writeHead(200, JSON_HEADERS);
    res.end();
    return;
  }

  if (pathname === '/api/sync' && req.method === 'POST') {
    let body = '';
    req.on('data', function (chunk) { body += chunk; });
    req.on('end', function () {
      try {
        const payload = JSON.parse(body);
        const incoming = payload.state;
        if (!incoming || typeof incoming !== 'object') {
          send(res, 400, JSON.stringify({ error: 'Invalid payload' }), JSON_HEADERS);
          return;
        }
        const merged = mergeIncoming(incoming);
        send(res, 200,
          JSON.stringify({ state: merged, version: serverVersion }),
          JSON_HEADERS
        );
      } catch (e) {
        send(res, 400, JSON.stringify({ error: e.message }), JSON_HEADERS);
      }
    });
    return;
  }

  if (pathname === '/') pathname = '/index.html';

  const filePath = path.resolve(ROOT, '.' + pathname);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  fs.stat(filePath, function (statError, stats) {
    if (statError || !stats.isFile()) {
      send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Content-Length': stats.size,
    };

    fs.readFile(filePath, function (readError, data) {
      if (readError) {
        send(res, 500, 'Could not read file', {
          'Content-Type': 'text/plain; charset=utf-8',
        });
        return;
      }
      send(res, 200, data, headers);
    });
  });
});

function lanAddresses() {
  const addresses = [];
  const interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach(function (name) {
    (interfaces[name] || []).forEach(function (item) {
      if (item.family === 'IPv4' && !item.internal) addresses.push(item.address);
    });
  });
  return addresses;
}

server.on('error', function (error) {
  if (error.code === 'EADDRINUSE') {
    console.error('Port ' + PORT + ' is already in use. Try: set PORT=4174 && node server.js');
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
});

server.listen(PORT, HOST, function () {
  console.log('');
  console.log('  Hurda Hisaab is running');
  console.log('  This computer:  http://localhost:' + PORT);
  lanAddresses().forEach(function (address) {
    console.log('  Phone (same Wi-Fi):  http://' + address + ':' + PORT);
  });
  console.log('');
  console.log('  Keep this window open while using the app.');
  console.log('  Press Ctrl+C to stop.');
  console.log('');

  if (process.argv.includes('--open') && process.platform === 'win32') {
    exec('start "" "http://localhost:' + PORT + '"');
  }
});
