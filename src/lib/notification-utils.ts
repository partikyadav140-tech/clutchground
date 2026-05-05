export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | undefined> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    return Notification.requestPermission().catch(() => "denied");
  }

  return Notification.permission;
}

export function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      vibrate: [80, 40, 80],
      tag: "cg-notification",
    });
  }
}

export function playNotificationTone() {
  if (typeof window === "undefined" || !window.AudioContext && !window.webkitAudioContext) return;

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
