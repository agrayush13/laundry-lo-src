import { useCallback, useEffect, useRef, useState } from 'react';
import type { PartnerOperationsSummary, PartnerOrderSummary } from '../models/partnerOrderModels';
import { ApiError } from '../services/apiClient';
import { getPartnerOperationsSummary, getPartnerOrders } from '../services/partnerOrderServices';
import type { PartnerOrderFilter } from '../config/partnerOrdersConfig';

const PAGE_SIZE = 20;

const asApiError = (error: unknown) =>
    error instanceof ApiError
        ? error
        : new ApiError('INTERNAL_ERROR', 'Something went wrong. Try again in a moment.');

export interface PartnerOrdersState {
    data: PartnerOrderSummary[] | null;
    isLoading: boolean;
    isLoadingMore: boolean;
    error: ApiError | null;
    loadMoreError: ApiError | null;
    nextCursor: string | null;
    summary: PartnerOperationsSummary | null;
    reload: () => void;
    loadMore: () => Promise<void>;
}

export const usePartnerOrders = (filter: PartnerOrderFilter): PartnerOrdersState => {
    const [data, setData] = useState<PartnerOrderSummary[] | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [summary, setSummary] = useState<PartnerOperationsSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<ApiError | null>(null);
    const [loadMoreError, setLoadMoreError] = useState<ApiError | null>(null);
    const [attempt, setAttempt] = useState(0);
    const loadMoreController = useRef<AbortController | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        loadMoreController.current?.abort();
        setData(null);
        setNextCursor(null);
        setSummary(null);
        setIsLoading(true);
        setIsLoadingMore(false);
        setError(null);
        setLoadMoreError(null);

        Promise.all([
            getPartnerOrders(
                {
                    ...(filter === 'all' ? {} : { status: filter }),
                    limit: PAGE_SIZE,
                },
                controller.signal
            ),
            getPartnerOperationsSummary(controller.signal).catch(() => null),
        ]).then(
            ([page, loadedSummary]) => {
                if (controller.signal.aborted) return;
                setData(page.data);
                setNextCursor(page.nextCursor);
                setSummary(loadedSummary);
                setIsLoading(false);
            },
            (loadError: unknown) => {
                if (controller.signal.aborted) return;
                setError(asApiError(loadError));
                setIsLoading(false);
            }
        );

        return () => controller.abort();
    }, [attempt, filter]);

    useEffect(
        () => () => {
            loadMoreController.current?.abort();
        },
        []
    );

    const loadMore = useCallback(async () => {
        if (!nextCursor || isLoadingMore) return;

        const controller = new AbortController();
        loadMoreController.current?.abort();
        loadMoreController.current = controller;
        setIsLoadingMore(true);
        setLoadMoreError(null);

        try {
            const page = await getPartnerOrders(
                {
                    ...(filter === 'all' ? {} : { status: filter }),
                    cursor: nextCursor,
                    limit: PAGE_SIZE,
                },
                controller.signal
            );
            if (controller.signal.aborted) return;
            setData((current) => [...(current ?? []), ...page.data]);
            setNextCursor(page.nextCursor);
        } catch (loadError) {
            if (!controller.signal.aborted) setLoadMoreError(asApiError(loadError));
        } finally {
            if (!controller.signal.aborted) setIsLoadingMore(false);
        }
    }, [filter, isLoadingMore, nextCursor]);

    return {
        data,
        isLoading,
        isLoadingMore,
        error,
        loadMoreError,
        nextCursor,
        summary,
        reload: useCallback(() => setAttempt((value) => value + 1), []),
        loadMore,
    };
};
