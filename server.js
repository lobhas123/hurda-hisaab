/*
 * Zero-dependency local web server for Hurda Hisaab.
 * Run: node server.js
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || '0.0.0.0';

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
