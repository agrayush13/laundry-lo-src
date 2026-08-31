/// <reference lib="webworker" />
import { ExpirationPlugin } from 'workbox-expiration';
import { createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { API_CACHE_NAME, CACHEABLE_API_PATH } from '../config/cacheConfig';

declare const self: ServiceWorkerGlobalScope;

/**
 * Injected at build time with every hashed asset webpack emitted. Filenames
 * carry a content hash, so a changed file is a new precache entry and the old
 * one is evicted.
 */
precacheAndRoute(self.__WB_MANIFEST);

/**
 * Every in-app route is client-side, so any navigation resolves to the shell.
 * The denylist keeps real files and the API off this route.
 */
registerRoute(
    new NavigationRoute(createHandlerBoundToURL('/index.html'), {
        denylist: [/^\/api\//, /\/[^/?]+\.[^/]+$/],
    })
);

/**
 * Availability is never served from a cache. A day-old slot list offers windows
 * that are full or already past, and the whole reason slots come from the server
 * is that only it knows which are real.
 */
registerRoute(
    ({ url, request }) => url.pathname.endsWith('/slots') && request.method === 'GET',
    new NetworkOnly()
);

/**
 * Public partner reads, and only those: serve the cached copy immediately,
 * refresh in the background. The window is minutes rather than a day because
 * `is_open` is a switch a partner can throw, and a shop that just closed must
 * stop taking orders promptly. See api-contract.md decision 2.
 *
 * The match is an allowlist rather than `/api/`, because Cache Storage keys on
 * the URL and ignores `Authorization`. A prefix match would silently adopt
 * `/me`, `/cart` and `/orders` the day they ship, and hand one account's data to
 * the next account on the same device. See config/cacheConfig.ts.
 */
registerRoute(
    ({ url, request }) => request.method === 'GET' && CACHEABLE_API_PATH.test(url.pathname),
    new StaleWhileRevalidate({
        cacheName: API_CACHE_NAME,
        plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 5 * 60 })],
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

export {};
