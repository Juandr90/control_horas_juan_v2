const CACHE_NAME = 'control-horas-juan-v2-v1';
const FILES_TO_CACHE = ['/', '/index.html', '/styles.css', '/app_v2.js', '/manifest.json', '/icon.png'];
self.addEventListener('install', evt=>{ evt.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(FILES_TO_CACHE))); });
self.addEventListener('fetch', evt=>{ evt.respondWith(caches.match(evt.request).then(resp=>resp||fetch(evt.request))); });
