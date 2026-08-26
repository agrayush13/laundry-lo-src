import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PARTNERS, PartnerTag } from '../data/partners';
import { SERVICE_TYPES } from '../data/services';
import { SORTERS, SortKey } from '../config/listingConfig';

/** Pin code and service from the query string, plus the tag/sort controls. */
export const usePartnerListing = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const pinCode = searchParams.get('pin') ?? '';

    // The homepage service cards arrive here, so an unknown slug in a shared or
    // hand-edited URL has to mean "no filter" rather than "no results".
    const requestedService = searchParams.get('service');
    const matched = SERVICE_TYPES.find(({ id }) => id === requestedService);
    const service = matched?.id ?? null;

    const [activeTags, setActiveTags] = useState<PartnerTag[]>([]);
    const [sortKey, setSortKey] = useState<SortKey>('relevance');

    const partners = useMemo(
        () =>
            PARTNERS.filter(
                (partner) =>
                    (!service || partner.services.includes(service)) &&
                    activeTags.every((tag) => partner.tags.includes(tag))
            ).sort(SORTERS[sortKey]),
        [activeTags, service, sortKey]
    );

    const clearService = useCallback(() => {
        setSearchParams(
            (params) => {
                params.delete('service');
                return params;
            },
            { replace: true }
        );
    }, [setSearchParams]);

    return {
        pinCode,
        service,
        serviceName: matched?.name ?? '',
        clearService,
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
