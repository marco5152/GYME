const CACHE = "tabulky-v2";
const ASSETS = [
  "./", "index.html", "style.css", "lib.js", "services.js", "app.js", "foods.json", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "vendor/zxing.min.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Vlastné súbory: najprv sieť (vždy čerstvá verzia), pri offline alebo pomalom pripojení cache. Externé API sa necachuje.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    new Promise((resolve) => {
      const fromCache = () => caches.match(req, { ignoreSearch: true }).then((c) => c || Response.error());
      const timer = setTimeout(() => fromCache().then(resolve), 4000);
      fetch(req)
        .then((res) => {
          clearTimeout(timer);
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          resolve(res);
        })
        .catch(() => { clearTimeout(timer); fromCache().then(resolve); });
    })
  );
});
