import { useCallback, useEffect, useState } from 'react';
import { applyUpdate, registerServiceWorker } from '../utils/serviceWorkerUtils';

/** Tracks whether a newer build is downloaded and waiting to take over. */
export const useServiceWorker = () => {
    const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        registerServiceWorker(setWaiting);
    }, []);

    return {
        hasUpdate: waiting !== null,
        update: useCallback(() => waiting && applyUpdate(waiting), [waiting]),
        dismiss: useCallback(() => setWaiting(null), []),
    };
};
