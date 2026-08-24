import { useNavigate } from 'react-router-dom';
import { getPartner } from '../data/partners';
import { ROUTES } from '../config/navigationConfig';
import { useCart } from '../context/CartContext';
import { createOrderId } from '../utils/ordersUtils';

/** Cart contents plus the hand-off into checkout. */
export const useCheckout = () => {
    const navigate = useNavigate();
    const cart = useCart();
    const partner = cart.partnerId ? getPartner(cart.partnerId) : undefined;

    const hasServices = cart.lines.length > 0 && Boolean(partner);

    return {
        ...cart,
        partner,
        isEmpty: cart.lines.length === 0 && !cart.hasPlus,
        hasServices,
        canCheckout: hasServices || cart.hasPlus,
        placeOrder: () => {
            // Laundry needs a pickup address and slot; a membership does not.
            if (hasServices) {
                navigate(ROUTES.checkout);
                return;
            }

            navigate(ROUTES.orderConfirmed, {
                replace: true,
                state: { orderId: createOrderId() },
            });
        },
    };
};
