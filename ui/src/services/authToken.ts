let accessToken: string | null = null;

/** Kept in memory; Supabase owns persistence and refresh-token rotation. */
export const setAuthAccessToken = (next: string | null) => {
    accessToken = next;
};

export const getAuthAccessToken = () => accessToken;
