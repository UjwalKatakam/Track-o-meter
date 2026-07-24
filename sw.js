const CACHE_NAME = 'wfo-tracker-v2';
const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'working-man.png',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('Failed to cache asset:', asset, err);
        }
      }
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Optional: Skip non-GET requests so we don't interfere with POSTs/APIs
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        // If the network fetch is successful, update the cache with the fresh file
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // If the network fails (user is offline), fall back to the cache
        return caches.match(e.request).then(cachedResponse => {
          return cachedResponse || caches.match('index.html');
        });
      })
  );
});
