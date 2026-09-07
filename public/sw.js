// Service Worker for QLCN 12.7 - Optimized for Instant Mobile Synchronization
const CACHE_NAME = 'qlcn-v2026-clean';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always use Network-Only for API and database calls
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase.co')) {
    return event.respondWith(fetch(event.request));
  }

  // Network-First strategy for HTML and assets with offline fallback
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
