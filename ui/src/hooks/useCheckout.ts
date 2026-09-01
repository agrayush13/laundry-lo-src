import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/navigationConfig';
import { useCart } from '../context/CartContext';

/** Cart contents plus the hand-off into checkout. */
export const useCheckout = () => {
    const navigate = useNavigate();
    const cart = useCart();

    // The partner travels with the cart, so naming where the order is going
    // costs no request.
    const hasServices = cart.lines.length > 0 && cart.partner !== null;

    return {
        ...cart,
        isEmpty: cart.lines.length === 0 && !cart.hasPlus,
        hasServices,
        canCheckout: hasServices,
        placeOrder: () => {
            if (hasServices) navigate(ROUTES.checkout);
        },
    };
};
