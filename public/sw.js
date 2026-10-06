/* Service worker for Spray Foam Bid Builder (working name). Works under any basePath via registration scope. */
const VERSION = 'sfbb-v1';
const SCOPE = self.registration.scope; // e.g. https://joshuaread.github.io/sprayfoam-bid-mvp/
const PRECACHE = ['', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'].map((p) => new URL(p, SCOPE).toString());

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!url.href.startsWith(SCOPE)) return;
  const isStatic = url.pathname.includes('/_next/static/') || url.pathname.includes('/icons/');
  if (isStatic) {
    // cache-first for hashed build assets
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            if (res.ok) caches.open(VERSION).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }
  // network-first for pages and everything else, fall back to cache when offline
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        if (res.ok) caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match(SCOPE))),
  );
});
