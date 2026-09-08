import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../services/apiClient';
import { advancePartnerOrder, getPartnerOrder } from '../services/partnerOrderServices';
import { nextPartnerOrderAction, PARTNER_PORTAL_COPY } from '../config/partnerOrdersConfig';
import { useAsync } from './useAsync';

export const usePartnerOrder = () => {
    const { orderId } = useParams();
    const [revision, setRevision] = useState(0);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const orderState = useAsync(
        (signal) =>
            orderId
                ? getPartnerOrder(orderId, signal)
                : Promise.reject(new Error('Missing order id')),
        [orderId, revision]
    );
    const action = orderState.data
        ? nextPartnerOrderAction(orderState.data.status, orderState.data.events)
        : null;

    const requestConfirmation = useCallback(() => {
        setUpdateError(null);
        setIsConfirming(true);
    }, []);

    const cancelConfirmation = useCallback(() => setIsConfirming(false), []);

    const submitUpdate = useCallback(async () => {
        if (!action || !orderState.data) return;
        setIsUpdating(true);
        setUpdateError(null);
        try {
            await advancePartnerOrder(orderState.data.id, action.event);
            setIsConfirming(false);
            setRevision((value) => value + 1);
        } catch (error) {
            setUpdateError(
                error instanceof ApiError ? error.message : PARTNER_PORTAL_COPY.updateFallback
            );
            if (error instanceof ApiError && error.code === 'INVALID_ORDER_TRANSITION') {
                orderState.reload();
            }
        } finally {
            setIsUpdating(false);
        }
    }, [action, orderState]);

    return {
        ...orderState,
        action,
        isConfirming,
        isUpdating,
        updateError,
        requestConfirmation,
        cancelConfirmation,
        submitUpdate,
    };
};
