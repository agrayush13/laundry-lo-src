import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

/**
 * Order id handed over by checkout. The cart is emptied here rather than at
 * confirm time - clearing it earlier would make the checkout page redirect
 * itself away before the navigation lands.
 */
export const useConfirmedOrder = () => {
    const { state } = useLocation();
    const { clear } = useCart();
    const orderId = (state as { orderId?: string } | null)?.orderId;

    useEffect(() => {
        if (orderId) {
            clear();
        }
        // Runs once for the confirmed order; `clear` is stable per cart state.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    return orderId;
};
