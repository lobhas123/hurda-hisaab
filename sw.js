/*
 * Hurda Hisaab service worker.
 * Network-first so updates arrive immediately, with an offline cache fallback.
 */
const CACHE_NAME = 'hurda-hisaab-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/store.js',
  './js/i18n.js',
  './js/app.js',
  './icons/icon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(APP_SHELL);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key !== CACHE_NAME) return caches.delete(key);
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function (event) {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(function (response) {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      })
      .catch(function () {
        return caches.match(request).then(function (cached) {
          if (cached) return cached;
          if (request.mode === 'navigate') {
            return caches.match('./index.html').then(function (page) {
              return page || caches.match('./');
            });
          }
          return new Response('Offline', {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      })
  );
});
