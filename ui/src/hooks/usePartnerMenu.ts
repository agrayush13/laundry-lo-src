import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CatalogItem } from '../models/catalogModels';
import { ApiError } from '../services/apiClient';
import { getPartner, getPartnerCatalog } from '../services/partnerServices';
import { ROUTES } from '../config/navigationConfig';
import { useCart } from '../context/CartContext';
import { useAsync } from './useAsync';

/**
 * The partner and their own catalogue, fetched together, plus cart quantities
 * scoped to them. The catalogue is per partner now: two laundries selling the
 * same shirt sell it at their own prices, under their own category names.
 */
export const usePartnerMenu = () => {
    const { partnerId } = useParams();
    const navigate = useNavigate();
    const { quantityOf, setQuantity, itemCount, subtotal, partner: cartPartner } = useCart();
    const [pendingPartnerSwitch, setPendingPartnerSwitch] = useState<{
        item: CatalogItem;
        categoryName: string;
        quantity: number;
    } | null>(null);

    const state = useAsync(
        async (signal) => {
            if (!partnerId) {
                throw new ApiError('PARTNER_NOT_FOUND', 'That laundry is no longer listed.', 404);
            }

            // Both are needed before anything can render, so they go together
            // rather than in a waterfall.
            const [partner, categories] = await Promise.all([
                getPartner(partnerId, signal),
                getPartnerCatalog(partnerId, signal),
            ]);

            return { partner, categories };
        },
        [partnerId]
    );

    const partner = state.data?.partner ?? null;
    // Quantities belong to another partner's cart until this one is added to.
    const isCartForThisPartner = partner !== null && cartPartner?.id === partner.id;
    const commitQuantity = (item: CatalogItem, categoryName: string, quantity: number) => {
        if (partner) {
            setQuantity({ id: partner.id, name: partner.name }, item, categoryName, quantity);
        }
    };

    return {
        state,
        partner,
        categories: state.data?.categories ?? [],
        itemCount,
        subtotal,
        hasItems: isCartForThisPartner && itemCount > 0,
        cartPartner,
        pendingPartnerSwitch,
        quantityFor: (item: CatalogItem) => (isCartForThisPartner ? quantityOf(item.id) : 0),
        changeQuantity: (item: CatalogItem, categoryName: string, quantity: number) => {
            if (
                partner &&
                quantity > 0 &&
                itemCount > 0 &&
                cartPartner &&
                cartPartner.id !== partner.id
            ) {
                setPendingPartnerSwitch({ item, categoryName, quantity });
                return;
            }

            commitQuantity(item, categoryName, quantity);
        },
        cancelPartnerSwitch: () => setPendingPartnerSwitch(null),
        confirmPartnerSwitch: () => {
            if (!pendingPartnerSwitch) return;
            commitQuantity(
                pendingPartnerSwitch.item,
                pendingPartnerSwitch.categoryName,
                pendingPartnerSwitch.quantity
            );
            setPendingPartnerSwitch(null);
        },
        viewCart: () => navigate(ROUTES.cart),
    };
};
