/** Posted to a waiting worker to make it take over immediately. */
export const SKIP_WAITING = 'SKIP_WAITING';

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

/** Hands over to the waiting worker, then reloads once it is in control. */
export const applyUpdate = (waiting: ServiceWorker) => {
    let reloaded = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloaded) {
            reloaded = true;
            window.location.reload();
        }
    });

    waiting.postMessage({ type: SKIP_WAITING });
};
