// ─────────────────────────────────────────────────────────────────────────────
// notification-utils.ts
// Professional mobile / browser push-notification helpers for ClutchGround
// ─────────────────────────────────────────────────────────────────────────────

/** Ask the OS for notification permission (only prompts on "default") */
export async function requestBrowserNotificationPermission(): Promise<
  NotificationPermission | undefined
> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    return Notification.requestPermission().catch(() => "denied" as NotificationPermission);
  }
  return Notification.permission;
}

/** Options for a rich notification */
export interface NotificationOptions {
  body: string;
  url?: string; // where to navigate on tap
  tag?: string; // dedup key (same tag = replace old notification)
  important?: boolean; // use longer vibration / requireInteraction
}

/**
 * Show a professional OS-level notification via the active Service Worker.
 * Falls back to the Notification constructor on browsers without SW support.
 */
export async function showBrowserNotification(
  title: string,
  options: NotificationOptions | string,
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // Normalise: accept plain string (legacy) or options object
  const opts: NotificationOptions = typeof options === "string" ? { body: options } : options;

  const url = opts.url ?? "/notifications";
  const tag = opts.tag ?? `cg-${Date.now()}`;
  const important = opts.important ?? false;

  const notifPayload: NotificationOptions = {
    body: opts.body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag,
    data: { url }, // SW reads this on click
    silent: false,
    vibrate: important ? [200, 100, 200, 100, 400] : [80, 40, 80],
    requireInteraction: important,
    // Action buttons shown in notification shade on Android
    actions: [
      { action: "open", title: "View" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  try {
    // Prefer SW-based notification (works on mobile even when tab is hidden)
    if ("serviceWorker" in navigator) {
      let reg = await navigator.serviceWorker.getRegistration("/");
      if (!reg) {
        try {
          reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        } catch (e) {
          console.warn("SW registration failed:", e);
        }
      }
      if (reg) {
        // Wait until SW is active
        if (!reg.active) reg = await navigator.serviceWorker.ready;
        if (reg?.showNotification) {
          await reg.showNotification(title, notifPayload);
          return;
        }
      }
    }
    // Fallback – desktop browsers without SW
    new Notification(title, notifPayload);
  } catch (err) {
    console.warn("showBrowserNotification error:", err);
    try {
      new Notification(title, { body: opts.body, tag });
    } catch {
      // ignore errors during fallback notification creation
    }
  }
}

/** Short dual-beep using the Web Audio API */
export function playNotificationTone(important = false) {
  if (typeof window === "undefined") return;
  const Ctx = (window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
    | typeof AudioContext
    | undefined;
  if (!Ctx) return;

  const ctx = new Ctx();

  const beep = (freq: number, start: number, duration: number, volume = 0.07) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
    osc.stop(ctx.currentTime + start + duration + 0.01);
  };

  if (important) {
    // Three ascending beeps for important notifications
    beep(660, 0, 0.12, 0.1);
    beep(880, 0.15, 0.12, 0.1);
    beep(1100, 0.3, 0.18, 0.1);
  } else {
    // Soft double-beep
    beep(880, 0, 0.1);
    beep(1100, 0.13, 0.1);
  }
}

/** Vibrate the device with a professional pattern */
export function vibrateNotification(important = false) {
  if (typeof window === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(important ? [200, 100, 200, 100, 400] : [40, 20, 80]);
}
