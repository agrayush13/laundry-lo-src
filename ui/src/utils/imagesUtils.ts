const UNSPLASH_BASE = 'https://images.unsplash.com';

/** Builds a sized, crop-optimised Unsplash URL from a photo id. */
export const unsplashImage = (photoId: string, width: number) =>
    `${UNSPLASH_BASE}/${photoId}?auto=format&fit=crop&w=${width}&q=80`;
