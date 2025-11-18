const CACHE_NAME = 'spirit-connect-v1';
const RUNTIME_CACHE = 'spirit-connect-runtime';

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/site.webmanifest',
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
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) => {
      return fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return cache.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If not in cache, return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return cache.match('/index.html');
            }
          });
        });
    })
  );
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
