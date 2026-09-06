// OmniPOS Service Worker — PWA Offline Support
// Caches static assets and provides offline fallback

const CACHE_NAME = 'omnios-v1';
const STATIC_CACHE = 'omnios-static-v1';
const API_CACHE = 'omnios-api-v1';

// Static assets to pre-cache
const PRE_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRE_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful GET responses
          if (event.request.method === 'GET' && response.status === 200) {
            const cloned = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => {
          // Offline: try cache
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            // Return offline response for API calls
            return new Response(JSON.stringify({
              error: 'Offline — data may be stale',
              offline: true,
              cached: false,
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.status === 200) {
          const cloned = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback for navigation
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
      return new Response('Offline', { status: 503 });
    })
  );
});

// Background sync for offline POS transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'pos-sync') {
    event.waitUntil(syncOfflineTransactions());
  }
});

async function syncOfflineTransactions() {
  // IndexedDB offline transactions would be synced here
  // Using Dexie.js on the client side to store pending transactions
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_STARTED' });
  });
}

// Push notifications (for delivery updates, alerts)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'OmniPOS', {
      body: data.body || 'New update',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data || '/')
  );
});
