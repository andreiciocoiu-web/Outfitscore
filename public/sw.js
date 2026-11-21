// Service worker minim: pastreaza interfata disponibila offline; analiza necesita internet.
const CACHE = "outfitscore-v3";
const ASSETS = ["/", "/index.html", "/vendor/jspdf.umd.min.js", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/confidentialitate.html"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/")) return; // nu cache-uim analiza
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
