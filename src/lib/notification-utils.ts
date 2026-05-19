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
        let registration = await navigator.serviceWorker.getRegistration();
        
        // Force register if not found (needed for some mobile browsers or dev mode)
        if (!registration) {
          try {
            registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          } catch (e) {
            console.error('SW registration failed in notification-utils:', e);
          }
        }
        
        if (registration) {
          // Sometimes it takes a moment to be active
          if (!registration.active) {
            registration = await navigator.serviceWorker.ready;
          }
          
          if (registration.showNotification) {
            await registration.showNotification(title, {
              body,
              vibrate: [80, 40, 80],
              tag: `cg-${Date.now()}`,
              icon: "/pwa-192x192.png",
              badge: "/pwa-192x192.png"
            } as any);
            return;
          }
        }
      }
      // Fallback for desktop/browsers without SW
      new Notification(title, {
        body,
        vibrate: [80, 40, 80],
        tag: `cg-${Date.now()}`,
      } as any);
    } catch (err) {
      console.error("Failed to show notification:", err);
      // Fallback
      new Notification(title, { body, tag: `cg-${Date.now()}` });
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
