// ClutchGround Service Worker
// Placed in public/ so it is always served at /sw.js regardless of build framework

const CACHE_NAME = 'clutchground-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
];

// ── Install: pre-cache shell assets ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently ignore cache failures on first install
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first with cache fallback ─────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin or cached assets
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip API calls — always network
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets
        if (
          response.ok &&
          (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2|webmanifest)$/) ||
            url.pathname === '/')
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: serve from cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, serve root
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// ── Push: receive server-sent Web Push notifications ─────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }

  const title = payload.title || 'ClutchGround';
  const body = payload.body || 'You have a new notification.';
  const url = payload.url || '/notifications';
  const icon = payload.icon || '/pwa-192x192.png';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/pwa-192x192.png',
      data: { url },
      vibrate: [100, 50, 100, 50, 200],
      tag: 'cg-push-' + Date.now(),
      requireInteraction: false,
      actions: [
        { action: 'open', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// ── Notification click: open or focus the app ─────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = (event.notification.data && event.notification.data.url) || '/notifications';
  const action = event.action;

  if (!action || action === 'open') {
    event.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if ('focus' in client && 'navigate' in client) {
              client.focus();
              client.navigate(url);
              return;
            }
          }
          return self.clients.openWindow(url);
        })
    );
  }
});

// ── Message: handle SKIP_WAITING from update prompts ─────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
