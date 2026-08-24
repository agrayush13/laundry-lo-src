import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PARTNERS, PartnerTag } from '../data/partners';
import { SORTERS, SortKey } from '../config/listingConfig';

/** Pin code from the query string plus the tag/sort controls for the listing. */
export const usePartnerListing = () => {
    const [searchParams] = useSearchParams();
    const pinCode = searchParams.get('pin') ?? '';

    const [activeTags, setActiveTags] = useState<PartnerTag[]>([]);
    const [sortKey, setSortKey] = useState<SortKey>('relevance');

    const partners = useMemo(
        () =>
            PARTNERS.filter((partner) =>
                activeTags.every((tag) => partner.tags.includes(tag))
            ).sort(SORTERS[sortKey]),
        [activeTags, sortKey]
    );

    return {
        pinCode,
        partners,
        sortKey,
        setSortKey,
        activeCount: activeTags.length,
        isTagActive: (tag: PartnerTag) => activeTags.includes(tag),
        clearTags: () => setActiveTags([]),
        toggleTag: (tag: PartnerTag) =>
            setActiveTags((tags) =>
                tags.includes(tag) ? tags.filter((current) => current !== tag) : [...tags, tag]
            ),
    };
};
