const CACHE_NAME = 'st-pwa-v1';
const PRECACHE_URLS = [
    '/',
    '/manifest.json',
    '/img/apple-icon-192x192.png',
    '/img/apple-icon-512x512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name)),
            ))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Bypass API calls, streaming endpoints, and dynamic character assets
    if (
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/thumbnail') ||
        url.pathname.startsWith('/characters/') ||
        url.pathname.startsWith('/backgrounds/')
    ) {
        return;
    }

    // Network-first strategy with cache fallback for static app shell
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request)),
    );
});
