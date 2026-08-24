import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Address, EMPTY_SLOT, SlotSelection, emptyAddress } from '../models/bookingModels';
import { getPartner } from '../data/partners';
import { PIN_CODE_LENGTH, VALIDATION_COPY } from '../config/bookingConfig';
import { ROUTES } from '../config/navigationConfig';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { isAfter } from '../utils/datesUtils';
import { createOrderId } from '../utils/ordersUtils';
import { NEW_ADDRESS_ID } from '../pages/checkout/AddressPicker';

export type CheckoutField = keyof typeof VALIDATION_COPY;

/** Anchors the validation messages onto something scrollable. */
export const SCHEDULE_ANCHOR_ID = 'checkout-schedule';

const isSlotComplete = ({ date, slot }: SlotSelection) => Boolean(date && slot);

const focusProblem = (field: CheckoutField) => {
    // Address problems land on their input; slot problems have no input to
    // focus, so they scroll to the schedule block instead.
    const target =
        field === 'pickup' || field === 'delivery' || field === 'deliveryBeforePickup'
            ? document.getElementById(SCHEDULE_ANCHOR_ID)
            : document.getElementById(field);

    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (target instanceof HTMLInputElement) {
        target.focus({ preventScroll: true });
    }
};

/**
 * Collects the details the cart doesn't capture - address and slots - and
 * turns the cart into a confirmed order. Signed-in customers pick a saved
 * address; everyone else fills the form.
 */
export const useCheckoutForm = () => {
    const navigate = useNavigate();
    const cart = useCart();
    const { user } = useAuth();

    const savedAddresses = user?.addresses ?? [];
    const partner = cart.partnerId ? getPartner(cart.partnerId) : undefined;

    const [selectedAddressId, setSelectedAddressId] = useState(
        savedAddresses[0]?.id ?? NEW_ADDRESS_ID
    );
    const [draftAddress, setDraftAddress] = useState<Address>(() => emptyAddress(''));
    const [pickup, setPickupSlot] = useState<SlotSelection>(EMPTY_SLOT);
    const [delivery, setDeliverySlot] = useState<SlotSelection>(EMPTY_SLOT);
    const [errors, setErrors] = useState<Partial<Record<CheckoutField, string>>>({});

    const selectedSaved = savedAddresses.find((address) => address.id === selectedAddressId);
    const address = selectedSaved ?? draftAddress;

    /** Ordered so the first problem found is the one nearest the top. */
    const findProblems = (): CheckoutField[] => {
        const problems: CheckoutField[] = [];

        if (!selectedSaved) {
            if (!address.recipientName.trim()) problems.push('recipientName');
            if (!address.phone.trim()) problems.push('phone');
            if (!address.building.trim()) problems.push('building');
            if (!address.street.trim()) problems.push('street');
            if (address.pincode.length !== PIN_CODE_LENGTH) problems.push('pincode');
        }

        if (!isSlotComplete(pickup)) problems.push('pickup');
        if (!isSlotComplete(delivery)) problems.push('delivery');
        else if (!isAfter(delivery, pickup)) problems.push('deliveryBeforePickup');

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
        savedAddresses,
        selectedAddressId,
        draftAddress,
        address,
        pickup,
        delivery,
        errors,
        isEmpty: cart.lines.length === 0 || !partner,
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
            } else {
                clearError('deliveryBeforePickup');
            }
        },
        setDelivery: (next: SlotSelection) => {
            setDeliverySlot(next);
            clearError('delivery');
            clearError('deliveryBeforePickup');
        },
        confirm: () => {
            const problems = findProblems();

            // Rather than sit disabled, the button explains what is missing and
            // takes the customer to it.
            if (problems.length > 0) {
                setErrors(
                    Object.fromEntries(problems.map((field) => [field, VALIDATION_COPY[field]]))
                );
                focusProblem(problems[0]);
                return;
            }

            navigate(ROUTES.orderConfirmed, {
                replace: true,
                state: { orderId: createOrderId() },
            });
        },
    };
};
