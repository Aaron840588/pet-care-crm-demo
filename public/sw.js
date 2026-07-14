/* public/sw.js — Pet Sitting CRM Service Worker */
const CACHE_NAME = 'petsitting-crm-v5';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/maskable-icon-512.png',
  '/kathleen-gonzales.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/').then((cached) => cached || Response.error()))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetched;
    })
  );
});

/* ── Push notification handler ─────────────────────────────── */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🐾 Kat\'s Pet Sitting';
  const options = {
    body:    data.body  || 'You have a visit today!',
    icon:    data.icon  || '/pwa-icon-192.png',
    badge:   '/pwa-icon-192.png',
    tag:     data.tag   || 'petsitting-reminder',
    renotify: true,
    data:    { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

/* ── Notification click — open/focus app ───────────────────── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data?.url || '/');
      }
    })
  );
});

/* ── Message from app — show a local notification ──────────── */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data;
    self.registration.showNotification(title || '🐾 Kat\'s Pet Sitting', {
      body:  body  || 'Reminder: you have a visit today!',
      icon:  '/pwa-icon-192.png',
      badge: '/pwa-icon-192.png',
      tag:   tag   || 'petsitting-local',
      renotify: true,
    });
  }
});
