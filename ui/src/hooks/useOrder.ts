import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EMPTY_SLOT, type SlotSelection } from '../models/bookingModels';
import type { SlotDay } from '../models/slotModels';
import { analytics } from '../services/analyticsServices';
import { ApiError } from '../services/apiClient';
import { getOrder } from '../services/customerServices';
import { cancelCustomerOrder, rescheduleCustomerOrder } from '../services/orderServices';
import { getPartnerSlots } from '../services/partnerServices';
import { ANALYTICS_EVENTS } from '../config/analyticsConfig';
import { ORDERS_COPY } from '../config/cartConfig';
import { isAfter } from '../utils/datesUtils';
import { useAsync } from './useAsync';

const RESCHEDULING_DAYS = 14;

/** Loads only the signed-in customer's order named in the route. */
export const useOrder = () => {
    const { orderId } = useParams();
    const [isConfirmingCancellation, setIsConfirmingCancellation] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancellationError, setCancellationError] = useState<string | null>(null);
    const [isChangingSchedule, setIsChangingSchedule] = useState(false);
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
    const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
    const [scheduleDays, setScheduleDays] = useState<SlotDay[] | null>(null);
    const [pickup, setPickup] = useState<SlotSelection>(EMPTY_SLOT);
    const [delivery, setDelivery] = useState<SlotSelection>(EMPTY_SLOT);
    const [scheduleError, setScheduleError] = useState<string | null>(null);
    const scheduleController = useRef<AbortController | null>(null);
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

    useEffect(
        () => () => {
            scheduleController.current?.abort();
        },
        []
    );

    const requestCancellation = useCallback(() => {
        scheduleController.current?.abort();
        setIsChangingSchedule(false);
        setIsLoadingSchedule(false);
        setScheduleDays(null);
        setPickup(EMPTY_SLOT);
        setDelivery(EMPTY_SLOT);
        setScheduleError(null);
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

    const loadSchedule = useCallback(async () => {
        if (!state.data?.canReschedule) return;
        const controller = new AbortController();
        scheduleController.current?.abort();
        scheduleController.current = controller;
        setIsLoadingSchedule(true);
        setScheduleError(null);
        setPickup(EMPTY_SLOT);
        setDelivery(EMPTY_SLOT);
        try {
            const days = await getPartnerSlots(
                state.data.partner.id,
                RESCHEDULING_DAYS,
                controller.signal
            );
            if (!controller.signal.aborted) setScheduleDays(days);
        } catch (error) {
            if (!controller.signal.aborted) {
                setScheduleError(
                    error instanceof ApiError ? error.message : ORDERS_COPY.reschedulingFallback
                );
            }
        } finally {
            if (!controller.signal.aborted) setIsLoadingSchedule(false);
        }
    }, [state.data]);

    const requestRescheduling = useCallback(() => {
        setIsConfirmingCancellation(false);
        setCancellationError(null);
        setIsChangingSchedule(true);
        setScheduleDays(null);
        void loadSchedule();
    }, [loadSchedule]);

    const cancelRescheduling = useCallback(() => {
        scheduleController.current?.abort();
        setIsChangingSchedule(false);
        setIsLoadingSchedule(false);
        setScheduleError(null);
        setScheduleDays(null);
        setPickup(EMPTY_SLOT);
        setDelivery(EMPTY_SLOT);
    }, []);

    const selectPickup = useCallback((next: SlotSelection) => {
        setPickup(next);
        setDelivery((current) =>
            current.slotId && !isAfter(current, next) ? EMPTY_SLOT : current
        );
        setScheduleError(null);
    }, []);

    const selectDelivery = useCallback((next: SlotSelection) => {
        setDelivery(next);
        setScheduleError(null);
    }, []);

    const submitRescheduling = useCallback(async () => {
        if (!state.data?.canReschedule || isSubmittingSchedule) return;
        if (!pickup.slotId || !delivery.slotId) {
            setScheduleError(ORDERS_COPY.chooseReschedulingSlots);
            return;
        }
        setIsSubmittingSchedule(true);
        setScheduleError(null);
        try {
            await rescheduleCustomerOrder(state.data.id, {
                pickupSlotId: pickup.slotId,
                deliverySlotId: delivery.slotId,
            });
            analytics.trackEvent(ANALYTICS_EVENTS.orderRescheduled);
            cancelRescheduling();
            state.reload();
        } catch (error) {
            setScheduleError(
                error instanceof ApiError ? error.message : ORDERS_COPY.reschedulingFallback
            );
            if (error instanceof ApiError && error.code === 'RESCHEDULING_NOT_ALLOWED') {
                cancelRescheduling();
                state.reload();
            }
        } finally {
            setIsSubmittingSchedule(false);
        }
    }, [cancelRescheduling, delivery.slotId, isSubmittingSchedule, pickup.slotId, state]);

    return {
        ...state,
        isConfirmingCancellation,
        isCancelling,
        cancellationError,
        requestCancellation,
        keepOrder,
        submitCancellation,
        isChangingSchedule,
        isLoadingSchedule,
        isSubmittingSchedule,
        scheduleDays,
        pickup,
        delivery,
        scheduleError,
        requestRescheduling,
        cancelRescheduling,
        retrySchedule: loadSchedule,
        selectPickup,
        selectDelivery,
        submitRescheduling,
    };
};
