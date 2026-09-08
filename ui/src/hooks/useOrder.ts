import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { analytics } from '../services/analyticsServices';
import { ApiError } from '../services/apiClient';
import { getOrder } from '../services/customerServices';
import { cancelCustomerOrder } from '../services/orderServices';
import { ANALYTICS_EVENTS } from '../config/analyticsConfig';
import { ORDERS_COPY } from '../config/cartConfig';
import { useAsync } from './useAsync';

/** Loads only the signed-in customer's order named in the route. */
export const useOrder = () => {
    const { orderId } = useParams();
    const [isConfirmingCancellation, setIsConfirmingCancellation] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancellationError, setCancellationError] = useState<string | null>(null);
    const state = useAsync(
        (signal) =>
            orderId ? getOrder(orderId, signal) : Promise.reject(new Error('Missing order id')),
        [orderId]
    );
    const reportedOrder = useRef<string | null>(null);

    useEffect(() => {
        if (!state.data || reportedOrder.current === state.data.id) return;
        reportedOrder.current = state.data.id;
        analytics.trackEvent(ANALYTICS_EVENTS.orderTrackingViewed, {
            status: state.data.status,
            can_cancel: state.data.canCancel,
        });
    }, [state.data]);

    const requestCancellation = useCallback(() => {
        setCancellationError(null);
        setIsConfirmingCancellation(true);
    }, []);

    const keepOrder = useCallback(() => setIsConfirmingCancellation(false), []);

    const submitCancellation = useCallback(async () => {
        if (!state.data?.canCancel || isCancelling) return;
        setIsCancelling(true);
        setCancellationError(null);
        try {
            await cancelCustomerOrder(state.data.id);
            analytics.trackEvent(ANALYTICS_EVENTS.orderCancelled);
            setIsConfirmingCancellation(false);
            state.reload();
        } catch (error) {
            setCancellationError(
                error instanceof ApiError ? error.message : ORDERS_COPY.cancellationFallback
            );
            if (error instanceof ApiError && error.code === 'CANCELLATION_NOT_ALLOWED') {
                setIsConfirmingCancellation(false);
                state.reload();
            }
        } finally {
            setIsCancelling(false);
        }
    }, [isCancelling, state]);

    return {
        ...state,
        isConfirmingCancellation,
        isCancelling,
        cancellationError,
        requestCancellation,
        keepOrder,
        submitCancellation,
    };
};
