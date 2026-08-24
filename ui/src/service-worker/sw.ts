/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

/**
 * Injected at build time with every hashed asset webpack emitted. Filenames
 * carry a content hash, so a changed file is a new precache entry and the old
 * one is evicted.
 */
precacheAndRoute(self.__WB_MANIFEST);

/**
 * Every in-app route is client-side, so any navigation resolves to the shell.
 * The denylist keeps real files and the future API off this route.
 */
registerRoute(
    new NavigationRoute(createHandlerBoundToURL('/index.html'), {
        denylist: [/^\/api\//, /\/[^/?]+\.[^/]+$/],
    })
);

/**
 * Reads from the API: serve the cached copy immediately, refresh in the
 * background. Ready for when the backend lands; harmless until then.
 */
registerRoute(
    ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
    new StaleWhileRevalidate({
        cacheName: 'api-reads',
        plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 })],
    })
);

/** Remote imagery is immutable per URL and expensive to refetch. */
registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: 'images',
        plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 })],
    })
);

/** Google Fonts stylesheets change rarely but must not go stale forever. */
registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com',
    new StaleWhileRevalidate({ cacheName: 'font-styles' })
);

registerRoute(
    ({ url }) => url.origin === 'https://fonts.gstatic.com',
    new CacheFirst({
        cacheName: 'font-files',
        plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 })],
    })
);

/**
 * A new worker waits until the page asks it to take over, so nobody is
 * reloaded mid-checkout. The app prompts and posts this message.
 */
self.addEventListener('message', (event: ExtendableMessageEvent) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

clientsClaim();

export {};
