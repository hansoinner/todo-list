const CACHE_NAME = "todo-list-v4";
const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css",
    "./drag.css",
    "./history.css",
    "./theme.css",
    "./toast.css",
    "./data-transfer.css",
    "./shortcuts.css",
    "./tags.css",
    "./pwa.css",
    "./due-date.css",
    "./toast.js",
    "./script.js",
    "./edit.js",
    "./drag.js",
    "./history.js",
    "./theme.js",
    "./data-transfer.js",
    "./shortcuts.js",
    "./tags.js",
    "./pwa.js",
    "./manifest.json"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("message", event => {
    if (event.data?.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === "opaque") {
                    return networkResponse;
                }

                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                return networkResponse;
            });
        })
    );
});
