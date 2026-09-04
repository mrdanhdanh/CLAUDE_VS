// WEB UNIVERSE — sw.js — stub Service Worker (Part 1)
// Part 6 sẽ thêm full cache. Hiện tại chỉ install/activate + offline indicator.
const CACHE = 'web-universe-v1';
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});
self.addEventListener('fetch', (e) => {
  // Part 1: network-first, không cache — chỉ để SW register thành công
  // Part 6 sẽ thêm Cache API + offline page
});
