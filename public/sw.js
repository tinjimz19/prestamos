/* Service Worker - Prestamos SP (PWA) */
const VERSION = 'sp-v1';
const CORE = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // no tocar el API ni terceros

  // Navegacion: red primero, con pagina offline de respaldo
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match(req).then((r) => r || caches.match('/offline.html')))
    );
    return;
  }

  // Otros GET del mismo origen: red primero, cae a cache
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});

/* --- Notificaciones push (el servidor las envia; listo para cuando actives push) --- */
self.addEventListener('push', (e) => {
  let data = { title: 'Prestamos SP', body: 'Tienes una notificacion.' };
  try { if (e.data) data = e.data.json(); } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Prestamos SP', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
