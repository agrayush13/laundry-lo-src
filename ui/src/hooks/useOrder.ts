import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../services/apiClient';
import { getOrder } from '../services/customerServices';
import { cancelCustomerOrder } from '../services/orderServices';
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
