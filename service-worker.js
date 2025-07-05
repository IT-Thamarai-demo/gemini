// Service Worker Version - Update this to force cache refresh
const CACHE_VERSION = 'v2.1.0-pro';
const CACHE_NAME = `gemini-flash-promode-cache-${CACHE_VERSION}`;
const OFFLINE_CACHE = `gemini-flash-offline-${CACHE_VERSION}`;

// Pre-cache these resources (matches your manifest icons and core files)
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.ico',
  '/images/icon-48x48.png',
  '/images/icon-72x72.png',
  '/images/icon-96x96.png',
  '/images/icon-128x128.png',
  '/images/icon-144x144.png',
  '/images/icon-152x152.png',
  '/images/icon-192x192.png',
  '/images/icon-256x256.png',
  '/images/icon-384x384.png',
  '/images/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/javascript.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/python.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/html.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/css.min.js'
];

// Network-first resources (API calls)
const NETWORK_FIRST_URLS = [
  /^https:\/\/generativelanguage\.googleapis\.com/
];

// Cache-first resources (static assets)
const CACHE_FIRST_URLS = [
  /\/images\/icon-.+\.png$/,
  /\.(?:js|css|png|jpg|jpeg|svg|gif|ico|woff2?)$/,
  /https:\/\/cdn\.jsdelivr\.net/,
  /https:\/\/cdnjs\.cloudflare\.com/
];

// Install Event - Pre-cache critical resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing ProMode...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('[Service Worker] Caching app shell and content');
          return cache.addAll(PRECACHE_RESOURCES);
        }),
      caches.open(OFFLINE_CACHE)
        .then(cache => cache.add('/offline.html'))
    ]).then(() => {
      console.log('[Service Worker] Skip waiting on install');
      return self.skipWaiting();
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating ProMode...');
  const cacheWhitelist = [CACHE_NAME, OFFLINE_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch Event - Advanced caching strategies
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Special handling for image assets from manifest
  if (/\/images\/icon-.+\.png$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(networkResponse => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, responseToCache));
          return networkResponse;
        });
      })
    );
    return;
  }

  // Network-first strategy for API calls
  if (NETWORK_FIRST_URLS.some(regex => regex.test(url.href))) {
    event.respondWith(
      fetchAndCache(request).catch(() => {
        return caches.match(request).then(response => {
          return response || caches.match('/offline.html');
        });
      })
    );
    return;
  }

  // Cache-first strategy for static assets
  if (CACHE_FIRST_URLS.some(regex => regex.test(url.href))) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetchAndCache(request);
      })
    );
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, responseToCache));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
        return caches.match(request);
      })
  );
});

// Helper function to fetch and cache a request
function fetchAndCache(request) {
  return fetch(request).then(response => {
    // Check if we received a valid response
    if (!response || response.status !== 200 || response.type !== 'basic') {
      return response;
    }

    // Clone the response to cache it
    const responseToCache = response.clone();

    caches.open(CACHE_NAME)
      .then(cache => {
        cache.put(request, responseToCache);
      });

    return response;
  });
}

// Background Sync for ProMode
self.addEventListener('sync', event => {
  if (event.tag === 'sync-promode-data') {
    console.log('[Service Worker] ProMode background sync');
    event.waitUntil(
      // Implement your ProMode-specific sync logic here
      console.log('Syncing ProMode data in background...')
    );
  }
});

// Push Notifications for ProMode
self.addEventListener('push', event => {
  const title = 'Gemini Flash ProMode';
  const options = {
    body: event.data?.text() || 'New ProMode update available',
    icon: '/images/icon-192x192.png',
    badge: '/images/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler with ProMode enhancements
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(windowClients => {
    let matchingClient = null;
    
    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url.includes('/')) {
        matchingClient = windowClient;
        break;
      }
    }
    
    if (matchingClient) {
      return matchingClient.focus();
    } else {
      return clients.openWindow('/');
    }
  });
  
  event.waitUntil(promiseChain);
});

// Listen for messages from the main thread
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // ProMode specific message handling
  if (event.data.type === 'PRO_MODE_ACTIVATED') {
    console.log('ProMode activated - updating service worker behavior');
    // Add any ProMode specific logic here
  }
});

// Periodic Sync (for ProMode features)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-promode-content') {
    console.log('[Service Worker] Periodic sync for ProMode content');
    event.waitUntil(
      // Implement your periodic sync logic here
      console.log('Updating ProMode content in background...')
    );
  }
});