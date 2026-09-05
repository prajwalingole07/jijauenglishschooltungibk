// Simple service worker for PWA - JIJAU Portal
const CACHE = "jijau-v7-2026-09-04";
self.addEventListener("install", (e) => {
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Never intercept navigation / RSC requests - let Next.js router do soft navigation
  // RSC fetches use accept: text/x-component, navigations use text/html
  const accept = e.request.headers.get("accept") || "";
  if (e.request.mode === "navigate" || accept.includes("text/html") || accept.includes("text/x-component")) {
    return;
  }
  const url = new URL(e.request.url);
  // Only cache static assets - NOT RSC data fetches
  if (url.pathname.startsWith("/_next/static/") || url.pathname.match(/\.(png|jpg|jpeg|svg|css|js|woff2?)$/)) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(res =>
          res ? res : fetch(e.request).then(r => { if(r.ok) cache.put(e.request, r.clone()); return r; })
        )
      )
    );
  }
});
