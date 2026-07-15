/* Service Worker de TSI Vault — permite abrir la app sin conexión a internet.
   Estrategia: si hay internet, siempre trae la versión más nueva (y la guarda en caché
   de paso); si no hay internet, sirve la última copia guardada. Nunca toca las llamadas
   a Google (Drive / Identity) — esas necesitan conexión real y ya manejan su propio error. */
const CACHE_NAME = 'tsi-vault-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './logo.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // deja pasar Google Drive / Google Identity tal cual

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(cache => cache.put(e.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
