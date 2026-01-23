// Service Worker for PWA with smart cache management
// Network First strategy ensures users always get the latest version
// Cache version updates when service worker file changes (on deployment)
const CACHE_VERSION = 'v2';
const CACHE_NAME = `star-journey-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `star-journey-static-${CACHE_VERSION}`;

// Static assets that change rarely
const staticAssets = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(staticAssets);
      })
      .catch((error) => {
        console.error('Cache install failed:', error);
      })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all old caches
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately to use new service worker
      return self.clients.claim();
    })
  );
});

// Fetch event - Network First strategy for always fresh content
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Firebase and external API requests - always use network
  if (
    request.url.includes('firebase') ||
    request.url.includes('googleapis') ||
    request.url.includes('gstatic') ||
    request.url.includes('vercel') ||
    request.url.includes('_next/static')
  ) {
    return;
  }

  // Network First strategy - always try network first for fresh content
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          
          // Determine which cache to use
          const cacheToUse = staticAssets.some(asset => request.url.includes(asset))
            ? STATIC_CACHE_NAME
            : CACHE_NAME;
          
          caches.open(cacheToUse).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed - try cache as fallback
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If no cache, return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          
          // For other requests, return error
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Listen for messages from the app to update cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    });
  }
});
