export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | undefined> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    return Notification.requestPermission().catch(() => "denied" as NotificationPermission);
  }

  return Notification.permission;
}

export async function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          registration.showNotification(title, {
            body,
            vibrate: [80, 40, 80],
            tag: "cg-notification",
            icon: "/pwa-192x192.png",
            badge: "/pwa-192x192.png"
          } as any);
          return;
        }
      }
      // Fallback for desktop/browsers without SW
      new Notification(title, {
        body,
        vibrate: [80, 40, 80],
        tag: "cg-notification",
      } as any);
    } catch (err) {
      console.error("Failed to show notification:", err);
      // Fallback
      new Notification(title, { body, tag: "cg-notification" });
    }
  }
}

export function playNotificationTone() {
  if (typeof window === "undefined" || (!window.AudioContext && !(window as any).webkitAudioContext)) return;

  const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
  const ctx = new AudioCtx();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.value = 880;
  gain.gain.value = 0.08;

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
  oscillator.stop(ctx.currentTime + 0.18);
}

export function vibrateNotification() {
  if (typeof window === "undefined" || !("navigator" in window) || !navigator.vibrate) return;
  navigator.vibrate([40, 20, 40]);
}
