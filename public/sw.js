/**
 * D-Mart PWA Service Worker (sw.js)
 * Provides offline caching, app shell precaching, and network fallback.
 */

const CACHE_VERSION = 'dmart-pwa-v1.0.0';
const STATIC_CACHE_NAME = `dmart-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `dmart-dynamic-${CACHE_VERSION}`;

// Core application shell assets precached on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/privacy.html',
];

// Install event: Precache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[D-Mart SW] Precache warning:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event: Clean up legacy caches and claim clients immediately
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName) && cacheName.startsWith('dmart-')) {
              console.log('[D-Mart SW] Removing legacy cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event: Network-first for navigations and APIs, Cache-first/Stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests and http/https schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Handle SPA Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // If offline, serve cached page or fallback to index.html
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const shellResponse = await caches.match('/index.html');
          if (shellResponse) {
            return shellResponse;
          }
          return caches.match('/');
        })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, images, icons, fonts)
  const isStaticAsset =
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff|woff2|ttf|ico|json)$/i) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Return cached version if found, update cache in background (Stale-While-Revalidate)
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Network with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

// Listen for message events (e.g. SKIP_WAITING from app)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
