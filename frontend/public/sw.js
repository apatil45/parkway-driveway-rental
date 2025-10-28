// Simple Service Worker for Parkway.com
const CACHE_NAME = 'parkway-v10'; // Updated cache name to force refresh
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.svg'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  console.log('Service Worker: Current origin:', self.location.origin);
  console.log('Service Worker: Cache version v10 - Fresh deployment');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Cache installation failed:', error);
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip service worker for navigation requests (client-side routing)
  if (event.request.mode === 'navigate') {
    return;
  }
  
  // Skip service worker for API calls and other non-cacheable requests
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('socket.io') ||
      event.request.url.includes('/sw.js') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).catch(() => {
          // If fetch fails, return a fallback response
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});
