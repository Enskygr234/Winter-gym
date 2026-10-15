// Çevrimdışı çalışma için basit önbellek
const AD = "winter-gym-v1";
const DOSYALAR = ["./", "index.html", "style.css", "app.js", "program.js", "manifest.json", "icons/icon-192.png", "icons/icon-512.png",
  "fonts/bigshoulders.woff", "fonts/barlow-regular.woff", "fonts/barlow-medium.woff", "fonts/barlow-semibold.woff", "fonts/barlow-bold.woff"];
self.addEventListener("install", e => { e.waitUntil(caches.open(AD).then(c => c.addAll(DOSYALAR))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== AD).map(x => caches.delete(x))))); self.clients.claim(); });
self.addEventListener("fetch", e => { if (e.request.method === "GET") e.respondWith(fetch(e.request).then(r => { const k = r.clone(); caches.open(AD).then(c => c.put(e.request, k)); return r; }).catch(() => caches.match(e.request))); });
