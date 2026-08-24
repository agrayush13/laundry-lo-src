import { useNavigate, useParams } from 'react-router-dom';
import { MenuItem } from '../data/menu';
import { getPartner } from '../data/partners';
import { ROUTES } from '../config/navigationConfig';
import { useCart } from '../context/CartContext';

/** Resolves the partner and exposes cart quantities scoped to them. */
export const usePartnerMenu = () => {
    const { partnerId } = useParams();
    const navigate = useNavigate();
    const { quantityOf, setQuantity, itemCount, subtotal, partnerId: cartPartnerId } = useCart();
    const partner = partnerId ? getPartner(partnerId) : undefined;

    const isCartForThisPartner = Boolean(partner) && cartPartnerId === partner?.id;

    return {
        partner,
        itemCount,
        subtotal,
        hasItems: isCartForThisPartner && itemCount > 0,
        // Quantities belong to another partner's cart until this one is added to.
        quantityFor: (item: MenuItem) => (isCartForThisPartner ? quantityOf(item.id) : 0),
        changeQuantity: (item: MenuItem, quantity: number) => {
            if (partner) {
                setQuantity(partner.id, item, quantity);
            }
        },
        viewCart: () => navigate(ROUTES.cart),
    };
};
