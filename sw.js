// ============================================
// JOSH ELECTRIC CONTROL - SERVICE WORKER
// Fixed for CSP compatibility
// ============================================

const CACHE_NAME = 'joshelectric-v3';
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
    '/js/settings.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching app shell');
                // Only cache local files, not CDN resources
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Skip waiting');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.warn('Service Worker: Cache failed for some resources:', error);
            })
    );
});

// Activate Service Worker
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
            console.log('Service Worker: Claiming clients');
            return self.clients.claim();
        })
    );
});

// Fetch Strategy: Network first for local files, network only for CDN
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Skip CDN resources - let browser handle them
    if (url.hostname.includes('cdnjs.cloudflare.com') || 
        url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')) {
        // Don't cache CDN resources, just fetch from network
        return;
    }
    
    // For local resources: Network first, fallback to cache
    if (url.hostname === self.location.hostname || url.hostname.includes('onrender.com')) {
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
    }
});