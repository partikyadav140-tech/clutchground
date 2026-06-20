/// <reference lib="WebWorker" />
/// <reference types="vite-plugin-pwa/client" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

// ── Workbox precache ──────────────────────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── Offline fallback HTML ─────────────────────────────────────────────────────
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ClutchGround - Offline</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #080c14;
    color: #fff;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
  }
  .logo {
    font-size: 2rem;
    font-weight: 800;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 2rem;
  }
  .icon {
    width: 80px;
    height: 80px;
    margin-bottom: 1.5rem;
    border-radius: 50%;
    background: rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .icon svg { width: 40px; height: 40px; stroke: #8b5cf6; }
  h1 { font-size: 1.5rem; margin-bottom: 0.75rem; }
  p { color: #94a3b8; max-width: 360px; line-height: 1.6; margin-bottom: 2rem; }
  button {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: #fff;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  button:hover { opacity: 0.9; }
</style>
</head>
<body>
  <div class="logo">ClutchGround</div>
  <div class="icon">
    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"></line>
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9"></path>
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
      <line x1="12" y1="20" x2="12.01" y2="20"></line>
    </svg>
  </div>
  <h1>You're offline</h1>
  <p>It looks like you've lost your connection. Check your internet and try again.</p>
  <button onclick="location.reload()">Try Again</button>
</body>
</html>`;

const CACHE_NAME = "offline-fallback";
const OFFLINE_URL = "/offline";

// Cache offline page on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.put(
        OFFLINE_URL,
        new Response(OFFLINE_HTML, {
          headers: { "Content-Type": "text/html" },
        }),
      ),
    ),
  );
  self.skipWaiting();
});

// Offline fallback — only intercept when fully offline
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate" && !navigator.onLine) {
    event.respondWith(
      caches.match(OFFLINE_URL).then(
        (cached) =>
          cached ||
          new Response(OFFLINE_HTML, {
            headers: { "Content-Type": "text/html" },
          }),
      ),
    );
  }
});

// ── Runtime caching: Cloudinary images (CacheFirst) ─────────────────────────
registerRoute(
  ({ url }) => url.hostname === "res.cloudinary.com",
  new CacheFirst({
    cacheName: "cloudinary-images",
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  }),
);

// ── Runtime caching: API responses (StaleWhileRevalidate) ───────────────────
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new StaleWhileRevalidate({
    cacheName: "api-cache",
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 5 * 60 })],
  }),
);

// ── Skip waiting (sent from VitePWA plugin on update) ────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Notification click → open / focus the app at the right URL ───────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = (event.notification.data?.url as string) || "/notifications";
  const action = event.action;

  // "open" action or default click — navigate to notification URL
  if (!action || action === "open") {
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        // If a window is already open, focus & navigate it
        for (const client of clientList) {
          if ("focus" in client && "navigate" in client) {
            const windowClient = client as WindowClient;
            windowClient.focus();
            windowClient.navigate(url);
            return;
          }
        }
        // Otherwise open a fresh window
        return self.clients.openWindow(url);
      }),
    );
  }

  // "dismiss" action — just close (already done above)
});

// ── Push event (future-proof for server-sent Web Push) ───────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; url?: string; icon?: string } = {};
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
      tag: `cg-push-${Date.now()}`,
      requireInteraction: false,
      actions: [
        { action: "open", title: "View" },
        { action: "dismiss", title: "Dismiss" },
      ],
    } as NotificationOptions),
  );
});
