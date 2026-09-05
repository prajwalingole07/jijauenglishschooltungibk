// Service worker for PWA & Mobile Notifications - JIJAU School Portal
const CACHE = "jijau-v7-2026-08-31";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache strategy: network-first for pages/api, cache-first for static assets
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.pathname.startsWith("/_next/") || url.pathname.match(/\.(png|jpg|svg|css|js|woff2?)$/)) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(e.request).then((res) =>
          res || fetch(e.request).then((r) => { cache.put(e.request, r.clone()); return r; })
        )
      )
    );
  }
});

// Push notification received
self.addEventListener("push", (event) => {
  let data = { title: "Jijau School Notification", body: "New update from school", url: "/notices" };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/school-logo.png",
    badge: "/school-logo.png",
    vibrate: [200, 100, 200, 100, 200],
    data: { url: data.url || "/notices" },
    actions: [
      { action: "open", title: "View Notice" }
    ],
    tag: "jijau-notice-" + Date.now(),
    renotify: true,
    requireInteraction: true
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click -> focus or open app window
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/notices";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ("focus" in client) {
          if (client.url.includes(targetUrl)) {
            return client.focus();
          }
          if ("navigate" in client) {
            return client.navigate(targetUrl).then(() => client.focus());
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
