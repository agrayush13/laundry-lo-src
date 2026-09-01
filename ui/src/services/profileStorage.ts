import type { SavedAddress, User } from '../data/user';
import { STORAGE_KEYS } from '../config/commonConfig';

const PROFILE_STORAGE_VERSION = 1;

interface StoredProfile {
    version: number;
    addresses: SavedAddress[];
    preferences: User['preferences'];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isSavedAddress = (value: unknown): value is SavedAddress =>
    isRecord(value) &&
    ['id', 'label', 'recipientName', 'phone', 'building', 'street', 'landmark', 'pincode'].every(
        (field) => typeof value[field] === 'string'
    );

const isStoredProfile = (value: unknown): value is StoredProfile => {
    if (!isRecord(value) || value['version'] !== PROFILE_STORAGE_VERSION) return false;
    const preferences = value['preferences'];
    return (
        Array.isArray(value['addresses']) &&
        value['addresses'].every(isSavedAddress) &&
        isRecord(preferences) &&
        typeof preferences['sms'] === 'boolean' &&
        typeof preferences['email'] === 'boolean'
    );
};

const storageKey = (userId: string) => `${STORAGE_KEYS.profile}.${userId}`;

/**
 * Temporary, user-scoped persistence for app profile fields whose API routes
 * are still staged. It never stores credentials, tokens or proof of a session.
 */
export const readStoredProfile = (userId: string): Omit<StoredProfile, 'version'> | null => {
    try {
        const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey(userId)) ?? '');
        return isStoredProfile(parsed)
            ? { addresses: parsed.addresses, preferences: parsed.preferences }
            : null;
    } catch {
        return null;
    }
};

export const writeStoredProfile = (user: User) => {
    try {
        const profile: StoredProfile = {
            version: PROFILE_STORAGE_VERSION,
            addresses: user.addresses,
            preferences: user.preferences,
        };
        window.localStorage.setItem(storageKey(user.id), JSON.stringify(profile));
    } catch {
        // Storage can be unavailable. Auth and the in-memory profile still work.
    }
};
