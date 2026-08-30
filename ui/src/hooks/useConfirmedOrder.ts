import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { OrderIdentifiers } from '../utils/ordersUtils';

/**
 * The order's two identifiers, handed over by checkout. The cart is emptied here
 * rather than at confirm time - clearing it earlier would make the checkout page
 * redirect itself away before the navigation lands.
 *
 * `orderId` is what the order is looked up by and is never displayed;
 * `orderReference` is the opposite. See `createOrderIdentifiers`.
 */
export const useConfirmedOrder = () => {
    const { state } = useLocation();
    const { clear } = useCart();
    const confirmed = state as Partial<OrderIdentifiers> | null;
    const orderId = confirmed?.orderId;

    useEffect(() => {
        if (orderId) {
            clear();
        }
        // Runs once for the confirmed order; `clear` is stable per cart state.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    return { orderId, orderReference: confirmed?.orderReference };
};
