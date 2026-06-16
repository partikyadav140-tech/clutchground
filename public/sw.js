// ClutchGround Service Worker
// Placed in public/ so it is always served at /sw.js regardless of build framework

const CACHE_NAME = "clutchground-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/logo-transparent.png",
];

// ── Install: pre-cache shell assets ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently ignore cache failures on first install
      });
    }),
  );
  self.skipWaiting();
});

// ── Activate: clean up all caches ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
  self.clients.claim();
});

// ── Push: receive server-sent Web Push notifications ─────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }

  const title = payload.title || "ClutchGround";
  const body = payload.body || "You have a new notification.";
  const url = payload.url || "/notifications";
  const origin = self.location.origin;
  const icon = new URL(payload.icon || "/logo-transparent.png", origin).href;
  const badge = new URL("/logo-transparent.png", origin).href;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: { url },
      vibrate: [100, 50, 100, 50, 200],
      tag: "cg-push-" + Date.now(),
      requireInteraction: false,
      actions: [
        { action: "open", title: "View" },
        { action: "dismiss", title: "Dismiss" },
      ],
    }),
  );
});

// ── Notification click: open or focus the app ─────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = (event.notification.data && event.notification.data.url) || "/notifications";
  const action = event.action;

  if (!action || action === "open") {
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client && "navigate" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        return self.clients.openWindow(url);
      }),
    );
  }
});

// ── Message: handle SKIP_WAITING from update prompts ─────────────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
