// ============================================
// JOSH ELECTRIC CONTROL - SERVICE WORKER
// Offline Support & Caching
// ============================================

const CACHE_NAME = 'joshelectric-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/dashboard.css',
    '/css/components.css',
    '/css/pages.css',
    '/css/auth.css',
    '/css/dark-mode.css',
    '/js/config.js',
    '/js/database.js',
    '/js/auth.js',
    '/js/dashboard.js',
    '/js/predictor.js',
    '/js/dark-mode.js',
    '/js/navigation.js',
    '/js/load-modelling.js',
    '/js/analytics.js',
    '/js/comparative.js',
    '/js/multi-user.js',
    '/js/history.js',
    '/js/reports.js',
    '/js/settings.js',
    '/pages/load-modelling.html',
    '/pages/analytics.html',
    '/pages/comparative-analysis.html',
    '/pages/multi-user.html',
    '/pages/history.html',
    '/pages/reports.html',
    '/pages/settings.html'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Strategy: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Offline fallback
                return caches.match(event.request);
            })
    );
});