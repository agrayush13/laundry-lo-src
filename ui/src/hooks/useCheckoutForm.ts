import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Address, EMPTY_SLOT, SlotSelection, emptyAddress } from '../models/bookingModels';
import { ApiError } from '../services/apiClient';
import { createAddress } from '../services/customerServices';
import { createOrder } from '../services/orderServices';
import { getPartner, getPartnerSlots } from '../services/partnerServices';
import {
    CHECKOUT_ADDRESS_ID_PREFIX,
    SCHEDULE_DAYS,
    VALIDATION_COPY,
} from '../config/bookingConfig';
import { ROUTES } from '../config/navigationConfig';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { addressFieldId, isValidPhone, isValidPinCode } from '../utils/addressUtils';
import { isAfter } from '../utils/datesUtils';
import { focusField } from '../utils/formUtils';
import { createOrderIdentifiers } from '../utils/ordersUtils';
import { NEW_ADDRESS_ID } from '../pages/checkout/AddressPicker';
import { useAsync } from './useAsync';

export type CheckoutField = keyof typeof VALIDATION_COPY;

/** Anchors the validation messages onto something scrollable. */
export const SCHEDULE_ANCHOR_ID = 'checkout-schedule';

const isSlotComplete = ({ date, slotId }: SlotSelection) => Boolean(date && slotId);

const focusProblem = (field: CheckoutField) => {
    // Address problems land on their input; slot problems have no input to
    // focus, so they scroll to the schedule block instead.
    const isSlotProblem =
        field === 'pickup' || field === 'delivery' || field === 'deliveryBeforePickup';

    const target = isSlotProblem
        ? SCHEDULE_ANCHOR_ID
        : field === 'partnerClosed'
          ? field
          : addressFieldId(CHECKOUT_ADDRESS_ID_PREFIX, field);
    focusField(target);
};

/**
 * Collects the details the cart doesn't capture - address and slots - and
 * turns the cart into a confirmed order. Checkout is account-only; customers
 * can pick a saved address or fill the form for a different one.
 */
export const useCheckoutForm = () => {
    const navigate = useNavigate();
    const cart = useCart();
    const { user } = useAuth();

    const savedAddresses = user?.addresses ?? [];
    const partner = cart.partner;

    // Slots are the partner's, and the server owns them: capacity, opening
    // hours and holidays are all things this client cannot know.
    const slots = useAsync(
        (signal) =>
            partner ? getPartnerSlots(partner.id, SCHEDULE_DAYS, signal) : Promise.resolve([]),
        [partner?.id]
    );

    // `isOpen` is a switch the partner can throw between adding to the cart and
    // confirming, so the cart's copy of the partner cannot answer it. Asked here
    // rather than remembered, and re-asked on every visit to this page.
    const live = useAsync(
        (signal) => (partner ? getPartner(partner.id, signal) : Promise.resolve(null)),
        [partner?.id]
    );

    // Unknown until the request lands. Only a definite `false` means closed;
    // the page separately blocks confirmation while this check is unresolved.
    const isPartnerClosed = live.data !== null && live.data?.isOpen === false;

    const [selectedAddressId, setSelectedAddressId] = useState(
        savedAddresses[0]?.id ?? NEW_ADDRESS_ID
    );
    const [draftAddress, setDraftAddress] = useState<Address>(() => emptyAddress(''));
    const [pickup, setPickupSlot] = useState<SlotSelection>(EMPTY_SLOT);
    const [delivery, setDeliverySlot] = useState<SlotSelection>(EMPTY_SLOT);
    const [errors, setErrors] = useState<Partial<Record<CheckoutField, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const idempotencyKey = useRef(crypto.randomUUID());

    const selectedSaved = savedAddresses.find((address) => address.id === selectedAddressId);
    const address = selectedSaved ?? draftAddress;

    /** Ordered so the first problem found is the one nearest the top. */
    const findProblems = (): CheckoutField[] => {
        const problems: CheckoutField[] = [];

        if (isPartnerClosed) {
            problems.push('partnerClosed');
        }

        if (!selectedSaved) {
            if (!address.recipientName.trim()) problems.push('recipientName');
            if (!isValidPhone(address.phone)) problems.push('phone');
            if (!address.building.trim()) problems.push('building');
            if (!address.street.trim()) problems.push('street');
            if (!isValidPinCode(address.pincode)) problems.push('pincode');
        }

        if (!isSlotComplete(pickup)) problems.push('pickup');
        if (!isSlotComplete(delivery)) problems.push('delivery');
        else if (isSlotComplete(pickup) && !isAfter(delivery, pickup)) {
            problems.push('deliveryBeforePickup');
        }

        return problems;
    };

    const clearError = (field: CheckoutField) =>
        setErrors((current) => {
            if (!current[field]) {
                return current;
            }

            const next = { ...current };
            delete next[field];
            return next;
        });

    return {
        ...cart,
        partner,
        live,
        slots,
        days: slots.data ?? [],
        isPartnerClosed,
        savedAddresses,
        selectedAddressId,
        draftAddress,
        address,
        pickup,
        delivery,
        errors,
        isSubmitting,
        submitError,
        isEmpty: cart.lines.length === 0 || partner === null,
        selectAddress: (id: string) => {
            setSelectedAddressId(id);
            setErrors({});
        },
        updateDraftAddress: (field: keyof Address, value: string) => {
            setDraftAddress((current) => ({ ...current, [field]: value }));
            clearError(field as CheckoutField);
        },
        setPickup: (next: SlotSelection) => {
            setPickupSlot(next);
            clearError('pickup');

            // A delivery chosen earlier may now sit before the pickup.
            if (delivery.date && !isAfter(delivery, next)) {
                setDeliverySlot(EMPTY_SLOT);
                setErrors((current) => ({
                    ...current,
                    deliveryBeforePickup: VALIDATION_COPY.deliveryBeforePickup,
                }));
            } else {
                clearError('deliveryBeforePickup');
            }
        },
        setDelivery: (next: SlotSelection) => {
            setDeliverySlot(next);
            clearError('delivery');
            clearError('deliveryBeforePickup');
        },
        confirm: async () => {
            const problems = findProblems();
            setSubmitError(null);

            // Rather than sit disabled, the button explains what is missing and
            // takes the customer to it.
            if (problems.length > 0) {
                setErrors(
                    Object.fromEntries(problems.map((field) => [field, VALIDATION_COPY[field]]))
                );
                focusProblem(problems[0]);
                return;
            }

            if (!cart.isApiBacked) {
                navigate(ROUTES.orderConfirmed, {
                    replace: true,
                    state: createOrderIdentifiers(),
                });
                return;
            }

            if (!cart.cartId || cart.syncError) {
                setSubmitError(
                    cart.syncError ??
                        "Your cart hasn't finished syncing. Wait a moment and try again."
                );
                return;
            }

            setIsSubmitting(true);
            try {
                const addressId = selectedSaved
                    ? selectedSaved.id
                    : (
                          await createAddress({
                              ...address,
                              label: 'Other',
                              isDefault: false,
                          })
                      ).id;
                const order = await createOrder(
                    {
                        cartId: cart.cartId,
                        addressId,
                        pickupSlotId: pickup.slotId,
                        deliverySlotId: delivery.slotId,
                        paymentMethod: 'cash_on_pickup',
                    },
                    idempotencyKey.current
                );
                navigate(ROUTES.orderConfirmed, {
                    replace: true,
                    state: { orderId: order.id, orderReference: order.reference },
                });
            } catch (error) {
                setSubmitError(
                    error instanceof ApiError
                        ? error.message
                        : "We couldn't place your order. Try again."
                );
            } finally {
                setIsSubmitting(false);
            }
        },
    };
};
