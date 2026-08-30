/**
 * Shared by the service worker and the app, so the cache the worker fills and
 * the cache sign-out empties are provably the same one.
 */
export const API_CACHE_NAME = 'api-reads';

/**
 * The only API reads that may be cached: public partner data, the same for every
 * caller. Everything else the contract will add under `/api` - the profile,
 * addresses, the cart, orders - belongs to one account, and Cache Storage keys
 * on the URL alone. Caching those would serve one person's orders to the next
 * person signing in on the same device, and would outlive sign-out.
 *
 * An allowlist rather than a denylist, so a new endpoint is uncached until
 * somebody decides otherwise. That is the safe direction to be wrong in.
 */
export const CACHEABLE_API_PATH = /^\/api\/v1\/partners(\/|$)/;
