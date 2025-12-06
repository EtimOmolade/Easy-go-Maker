const CACHE_NAME = 'spirit-connect-v2';
const RUNTIME_CACHE = 'spirit-connect-runtime-v2';
const IMAGE_CACHE = 'spirit-connect-images';
const AUDIO_CACHE = 'spirit-connect-audio';

// Assets to cache on install (critical for FCP/LCP)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/logo-192.png',
  '/logo-512.png',
  '/favicon.png',
  '/assets/music/Ambient_Music.mp3',
];

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE, AUDIO_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('🧹 Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper: Determine cache strategy based on request
function getCacheStrategy(request) {
  const url = new URL(request.url);

  // Static assets (JS, CSS, fonts) - Cache First
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)
  ) {
    return 'cache-first';
  }

  // Images - Cache First with long expiration
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)
  ) {
    return 'cache-first-images';
  }

  // Audio files - Cache First
  if (
    request.destination === 'audio' ||
    url.pathname.match(/\.(mp3|wav|ogg|m4a)$/)
  ) {
    return 'cache-first-audio';
  }

  // API calls to Supabase - Network First
  if (url.hostname.includes('supabase')) {
    return 'network-first';
  }

  // Pages/HTML - Stale While Revalidate
  if (request.destination === 'document' || request.mode === 'navigate') {
    return 'stale-while-revalidate';
  }

  // Default - Network First
  return 'network-first';
}

// Cache First Strategy (for static assets)
async function cacheFirst(request, cacheName = RUNTIME_CACHE) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Cache first failed:', request.url);
    throw error;
  }
}

// Network First Strategy (for dynamic content)
async function networkFirst(request, cacheName = RUNTIME_CACHE) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      console.log('📦 Serving from cache (offline):', request.url);
      return cached;
    }

    // For navigation requests, return index.html
    if (request.mode === 'navigate') {
      const indexCached = await cache.match('/index.html');
      if (indexCached) return indexCached;
    }

    throw error;
  }
}

// Stale While Revalidate Strategy (for pages)
async function staleWhileRevalidate(request, cacheName = RUNTIME_CACHE) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Start fetch in background
  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.log('Fetch failed during revalidate:', request.url);
    return null;
  });

  // Return cached immediately if available
  if (cached) {
    return cached;
  }

  // Wait for fetch if no cache
  return fetchPromise || cached;
}

// Fetch event - Use appropriate strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const strategy = getCacheStrategy(event.request);

  switch (strategy) {
    case 'cache-first':
      event.respondWith(cacheFirst(event.request, RUNTIME_CACHE));
      break;

    case 'cache-first-images':
      event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
      break;

    case 'cache-first-audio':
      event.respondWith(cacheFirst(event.request, AUDIO_CACHE));
      break;

    case 'stale-while-revalidate':
      event.respondWith(staleWhileRevalidate(event.request, RUNTIME_CACHE));
      break;

    case 'network-first':
    default:
      event.respondWith(networkFirst(event.request, RUNTIME_CACHE));
      break;
  }
});

// Background sync for pending requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-prayers') {
    event.waitUntil(syncPrayers());
  }
  if (event.tag === 'sync-journal') {
    event.waitUntil(syncJournal());
  }
});

async function syncPrayers() {
  // This will be triggered when connection is restored
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_PRAYERS',
      message: 'Syncing prayer data...',
    });
  });
}

async function syncJournal() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_JOURNAL',
      message: 'Syncing journal entries...',
    });
  });
}

// Handle push events
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push notification data:', data);
    
    const options = {
      body: data.body || data.message,
      icon: data.icon || '/logo-192.png',
      badge: data.badge || '/logo-192.png',
      tag: data.tag || data.type,
      data: data.data || { url: data.url, type: data.type },
      actions: data.actions || [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      vibrate: [200, 100, 200],
      requireInteraction: data.requireInteraction || false
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/dashboard';
  const notificationId = event.notification.data?.notificationId;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .then(() => {
        // Mark notification as read if it has an ID
        if (notificationId) {
          console.log('Notification opened, ID:', notificationId);
        }
      })
  );
});
