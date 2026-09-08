// WEB UNIVERSE — sw.js — v2: Real PWA (Part 8)
// Precache core assets · cache-first cho static · network-first cho HTML · offline fallback.
const CACHE = 'web-universe-v2';
const PRECACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/layout.css',
  './css/windows.css',
  './css/modules.css',
  './js/app.js',
  './js/state.js',
  './js/event-bus.js',
  './js/logger.js',
  './js/module-manager.js',
  './js/window-manager.js',
  './js/resource-manager.js',
  './js/workspace-manager.js',
  './js/permission-manager.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => {/* precache best-effort — app vẫn chạy */}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // chỉ cache same-origin (fonts CDN bỏ qua)

  // HTML navigation: network-first, fallback cache, cuối cùng là offline.html
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('./offline.html'))
        )
    );
    return;
  }

  // Static same-origin: cache-first, stale-while-revalidate
  e.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
