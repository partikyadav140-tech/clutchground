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
            return caches.match('/').then((rootCached) => {
              if (rootCached) return rootCached;
              // Return a fallback Response instead of undefined to prevent TypeError: Failed to convert value to 'Response'
              return new Response(
                '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline — CLUTCHGROUND</title><style>body{background:#0a0a0c;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px}h1{font-size:24px;margin-bottom:8px;color:#f97316}p{color:#a1a1aa;font-size:14px;margin-top:0}</style></head><body><h1>Connection Error</h1><p>It looks like you are offline or the server took too long to respond. Please check your network connection and try again.</p></body></html>',
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            });
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
  const origin = self.location.origin;
  const icon = new URL(payload.icon || '/logo-transparent.png', origin).href;
  const badge = new URL('/logo-transparent.png', origin).href;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
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
