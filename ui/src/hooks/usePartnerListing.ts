import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Partner, PartnerTag } from '../models/partnerModels';
import { SERVICE_TYPES } from '../data/services';
import { PartnerQuery, listPartners } from '../services/partnerServices';
import { DEFAULT_SORT, LISTING_COPY, PARTNER_PAGE_SIZE, SortKey } from '../config/listingConfig';
import { useAsync } from './useAsync';

/**
 * Pin code and service come from the query string, tags and sort from the
 * controls, and all four go to the server: filtering and ordering happen where
 * the whole catalogue is, not over whichever page happened to arrive.
 */
export const usePartnerListing = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const pinCode = searchParams.get('pin') ?? '';

    // The homepage service cards arrive here, so an unknown slug in a shared or
    // hand-edited URL has to mean "no filter" rather than "no results".
    const requestedService = searchParams.get('service');
    const matched = SERVICE_TYPES.find(({ id }) => id === requestedService);
    const service = matched?.id ?? null;

    const [activeTags, setActiveTags] = useState<PartnerTag[]>([]);
    const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT);
    const effectiveSortKey = !pinCode && sortKey === 'distance' ? DEFAULT_SORT : sortKey;

    useEffect(() => {
        if (effectiveSortKey !== sortKey) {
            setSortKey(effectiveSortKey);
        }
    }, [effectiveSortKey, sortKey]);

    // Arrays are rebuilt every render, so the dependency is their content.
    const tagKey = [...activeTags].sort().join(',');
    const queryKey = [pinCode, service ?? '', tagKey, effectiveSortKey].join('|');

    const buildQuery = useCallback(
        (): PartnerQuery => ({
            pincode: pinCode || undefined,
            services: service ? [service] : undefined,
            tags: activeTags.length > 0 ? activeTags : undefined,
            sort: effectiveSortKey,
            limit: PARTNER_PAGE_SIZE,
        }),
        [pinCode, service, activeTags, effectiveSortKey]
    );

    const firstPage = useAsync(
        (signal) => listPartners(buildQuery(), signal),
        [pinCode, service, tagKey, effectiveSortKey]
    );

    // Pages beyond the first are appended rather than replacing what is shown.
    const [appended, setAppended] = useState<Partner[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [moreError, setMoreError] = useState<string | null>(null);
    const loadMoreRequest = useRef<AbortController | null>(null);

    // A new first page - a filter changed, or a retry - discards what was
    // appended to the old one.
    useEffect(() => {
        loadMoreRequest.current?.abort();
        loadMoreRequest.current = null;
        setAppended([]);
        setCursor(firstPage.data?.nextCursor ?? null);
        setIsLoadingMore(false);
        setMoreError(null);

        return () => loadMoreRequest.current?.abort();
    }, [firstPage.data, queryKey]);

    const partners = firstPage.data ? [...firstPage.data.data, ...appended] : [];

    const loadMore = async () => {
        if (!cursor || isLoadingMore) return;

        const controller = new AbortController();
        loadMoreRequest.current?.abort();
        loadMoreRequest.current = controller;
        setIsLoadingMore(true);
        setMoreError(null);
        try {
            const next = await listPartners({ ...buildQuery(), cursor }, controller.signal);
            if (controller.signal.aborted) return;

            setAppended((current) => [...current, ...next.data]);
            setCursor(next.nextCursor);
        } catch {
            if (controller.signal.aborted) return;

            // The partners already on screen are still good; only the button
            // failed, so it says so and stays available.
            setMoreError(LISTING_COPY.showMoreFailed);
        } finally {
            if (loadMoreRequest.current === controller) {
                loadMoreRequest.current = null;
                setIsLoadingMore(false);
            }
        }
    };

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
        state: firstPage,
        partners,
        hasMore: cursor !== null,
        isLoadingMore,
        moreError,
        loadMore,
        sortKey: effectiveSortKey,
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
