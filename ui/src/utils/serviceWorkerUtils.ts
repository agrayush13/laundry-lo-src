import { API_CACHE_NAME } from '../config/cacheConfig';

/** Posted to a waiting worker to make it take over immediately. */
export const SKIP_WAITING = 'SKIP_WAITING';
const UPDATE_RELOAD_FALLBACK_MS = 5_000;

type OnUpdate = (waiting: ServiceWorker) => void;

export const isSupported = () => typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

/**
 * Registers the worker and reports back when a new one is parked in `waiting`,
 * which is the moment a fresh deploy is downloaded but not yet in charge.
 */
export const registerServiceWorker = async (onUpdate: OnUpdate) => {
    if (!isSupported()) {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');

        // A new version can already be waiting from an earlier visit.
        if (registration.waiting && navigator.serviceWorker.controller) {
            onUpdate(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
            const installing = registration.installing;
            if (!installing) {
                return;
            }

            installing.addEventListener('statechange', () => {
                // With no controller this is the first install, not an update.
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                    onUpdate(installing);
                }
            });
        });
    } catch {
        // An unavailable worker must never break the page.
    }
};

let updateReloadPending = false;

/** Hands over to the waiting worker, then reloads once it is in control. */
export const applyUpdate = (waiting: ServiceWorker) => {
    if (updateReloadPending) return;
    updateReloadPending = true;

    // All other tabs may have closed since the prompt appeared, allowing the
    // worker to activate by itself. There is no future controllerchange then.
    if (waiting.state === 'activated') {
        window.location.reload();
        return;
    }

    const reload = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', reload);
        window.clearTimeout(fallback);
        window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
    // A browser can lose the lifecycle event while suspending a PWA. The button
    // must still eventually do what it promised.
    const fallback = window.setTimeout(reload, UPDATE_RELOAD_FALLBACK_MS);
    waiting.postMessage({ type: SKIP_WAITING });
};

/**
 * Empties the API response cache. Called whenever the signed-in identity
 * changes, because Cache Storage keys on the URL and knows nothing about who
 * asked: without this, a cached read outlives the session that produced it.
 *
 * Only public partner data is cacheable today (see config/cacheConfig.ts), so
 * this currently discards nothing sensitive. It is here so that the sign-out
 * path is already correct when the first per-account read ships.
 */
export const clearApiCache = async () => {
    if (typeof caches === 'undefined') {
        return;
    }

    try {
        await caches.delete(API_CACHE_NAME);
    } catch {
        // A browser that refuses the cache API must not break signing out.
    }
};
