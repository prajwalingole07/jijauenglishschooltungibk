"use client";

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") {
    return true;
  }
  if (Notification.permission !== "denied") {
    try {
      const perm = await Notification.requestPermission();
      return perm === "granted";
    } catch {
      return false;
    }
  }
  return false;
}

export async function sendMobileDeviceNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    url?: string;
    data?: any;
  }
) {
  if (typeof window === "undefined") return;

  const hasPerm = await requestNotificationPermission();
  if (!hasPerm) return;

  const notifOptions: NotificationOptions = {
    body: options.body,
    icon: options.icon || "/school-logo.png",
    badge: options.badge || "/school-logo.png",
    tag: options.tag || "jijau-" + Date.now(),
    requireInteraction: true,
    data: { url: options.url || "/notices" },
  };

  // 1. Try Service Worker showNotification (Best for Mobile APK / Android notification bar)
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === "function") {
        await registration.showNotification(title, {
          ...notifOptions,
          // @ts-ignore
          vibrate: [200, 100, 200, 100, 200],
        });
        return;
      }
    } catch {}
  }

  // 2. Fallback to standard Window Notification
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const n = new Notification(title, notifOptions);
      n.onclick = () => {
        window.focus();
        if (options.url && typeof window !== "undefined") {
          window.location.href = options.url;
        }
      };
    } catch {}
  }
}
