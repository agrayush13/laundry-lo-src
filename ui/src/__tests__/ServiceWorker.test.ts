import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from '../utils/serviceWorkerUtils';

class FakeWorker extends EventTarget {
    state = 'installing';
    postMessage = vi.fn();

    settle(state: string) {
        this.state = state;
        this.dispatchEvent(new Event('statechange'));
    }
}

class FakeRegistration extends EventTarget {
    installing: FakeWorker | null = null;
    waiting: FakeWorker | null = null;

    deploy() {
        this.installing = new FakeWorker();
        this.dispatchEvent(new Event('updatefound'));
        return this.installing;
    }
}

const useServiceWorkerApi = (registration: FakeRegistration, controller: unknown) => {
    Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
            controller,
            register: vi.fn().mockResolvedValue(registration),
            addEventListener: vi.fn(),
        },
    });
};

afterEach(() => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
});

describe('registerServiceWorker', () => {
    it('does not prompt on a first install', async () => {
        const registration = new FakeRegistration();
        // No controller means nothing was cached before: this is a first visit.
        useServiceWorkerApi(registration, null);
        const onUpdate = vi.fn();

        await registerServiceWorker(onUpdate);
        registration.deploy().settle('installed');

        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('prompts when a new worker installs alongside an existing one', async () => {
        const registration = new FakeRegistration();
        useServiceWorkerApi(registration, {});
        const onUpdate = vi.fn();

        await registerServiceWorker(onUpdate);
        const installing = registration.deploy();
        installing.settle('installed');

        expect(onUpdate).toHaveBeenCalledWith(installing);
    });

    it('does not prompt while the new worker is still downloading', async () => {
        const registration = new FakeRegistration();
        useServiceWorkerApi(registration, {});
        const onUpdate = vi.fn();

        await registerServiceWorker(onUpdate);
        registration.deploy().settle('installing');

        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('prompts for a worker that was already waiting from an earlier visit', async () => {
        const registration = new FakeRegistration();
        registration.waiting = new FakeWorker();
        useServiceWorkerApi(registration, {});
        const onUpdate = vi.fn();

        await registerServiceWorker(onUpdate);

        expect(onUpdate).toHaveBeenCalledWith(registration.waiting);
    });

    it('stays silent when the browser has no service worker support', async () => {
        const onUpdate = vi.fn();

        await expect(registerServiceWorker(onUpdate)).resolves.toBeUndefined();
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('swallows a registration failure rather than breaking the page', async () => {
        Object.defineProperty(navigator, 'serviceWorker', {
            configurable: true,
            value: { controller: null, register: vi.fn().mockRejectedValue(new Error('nope')) },
        });

        await expect(registerServiceWorker(vi.fn())).resolves.toBeUndefined();
    });
});
