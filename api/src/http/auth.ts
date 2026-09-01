import { ApiError } from './errors.js';

export const requireUser = (userId: string | null): string => {
    if (!userId) {
        throw new ApiError('UNAUTHENTICATED', 'Please sign in to continue.');
    }
    return userId;
};
