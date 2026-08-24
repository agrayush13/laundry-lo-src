/** "Wash & Fold" -> "/wash-fold" */
export const toSlugPath = (label: string) =>
    `/${label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}`;
