const CACHE_VERSION = 'omojosh-v1';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon/icon-192.png',
  './assets/icon/icon-512.png'
];

// Install - precache app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Fetch - Network first for navigations, Cache-first for assets, fallback to index
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== location.origin) return;

  // Navigation requests: network first, fallback to cache, then index.html
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    );
    return;
  }

  // For CSS, JS, images, icons: cache first, then network
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // cache successful GET
        if (req.method === 'GET' && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, clone));
        }
        return res;
      });
    })
  );
});
self.addEventListener('message', (e)=>{ if(e.data && e.data.type==='SKIP_WAITING'){ self.skipWaiting(); } });
