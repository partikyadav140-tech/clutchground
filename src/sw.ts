/// <reference lib="WebWorker" />
/// <reference types="vite-plugin-pwa/client" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

// ── Workbox precache ──────────────────────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

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
