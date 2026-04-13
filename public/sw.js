/* public/sw.js — Pet Sitting CRM Service Worker */
const CACHE_NAME = 'petsitting-crm-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/* ── Push notification handler ─────────────────────────────── */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🐾 Kat\'s Pet Sitting';
  const options = {
    body:    data.body  || 'You have a visit today!',
    icon:    data.icon  || '/favicon.svg',
    badge:   '/favicon.svg',
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
      icon:  '/favicon.svg',
      badge: '/favicon.svg',
      tag:   tag   || 'petsitting-local',
      renotify: true,
    });
  }
});
