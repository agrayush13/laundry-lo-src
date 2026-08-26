import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Money, addMoney, multiplyMoney } from '../models/moneyModels';
import { MenuItem } from '../data/menu';
import { TAX_RATE } from '../config/cartConfig';
import { STORAGE_KEYS } from '../config/commonConfig';
import { MEMBERSHIP_SECTION } from '../config/membershipConfig';

export interface CartLine {
    item: MenuItem;
    quantity: number;
}

interface CartContextValue {
    partnerId: string | null;
    lines: CartLine[];
    /** Plus is an account-level add-on, not tied to a partner. */
    hasPlus: boolean;
    itemCount: number;
    subtotal: Money;
    taxes: Money;
    total: Money;
    quantityOf: (itemId: string) => number;
    setQuantity: (partnerId: string, item: MenuItem, quantity: number) => void;
    setPlus: (hasPlus: boolean) => void;
    clear: () => void;
}

/**
 * Bumped whenever the stored shape changes. A mismatch discards the saved cart
 * rather than letting an outdated shape reach the components.
 */
const STORAGE_VERSION = 1;

interface StoredCart {
    version: number;
    partnerId: string | null;
    lines: CartLine[];
    hasPlus: boolean;
}

const readStoredCart = (): StoredCart | null => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEYS.cart);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as StoredCart;
        return parsed.version === STORAGE_VERSION ? parsed : null;
    } catch {
        // Corrupt or unavailable storage should never break the app.
        return null;
    }
};

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stored] = useState(readStoredCart);
    const [partnerId, setPartnerId] = useState<string | null>(stored?.partnerId ?? null);
    const [lines, setLines] = useState<CartLine[]>(stored?.lines ?? []);
    const [hasPlus, setHasPlus] = useState(stored?.hasPlus ?? false);

    // The cart belongs to the browser rather than the account, so it survives a
    // refresh and works signed out. It is dropped once an order is placed.
    useEffect(() => {
        try {
            if (lines.length === 0 && !hasPlus) {
                window.localStorage.removeItem(STORAGE_KEYS.cart);
                return;
            }

            const payload: StoredCart = { version: STORAGE_VERSION, partnerId, lines, hasPlus };
            window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(payload));
        } catch {
            // Private browsing can reject writes; the in-memory cart still works.
        }
    }, [partnerId, lines, hasPlus]);

    const value = useMemo<CartContextValue>(() => {
        // Integer paise throughout; the backend will own these sums once it exists.
        const itemsTotal = addMoney(
            ...lines.map(({ item, quantity }) => multiplyMoney(item.price, quantity))
        );
        const subtotal = hasPlus ? addMoney(itemsTotal, MEMBERSHIP_SECTION.card.price) : itemsTotal;
        const taxes = multiplyMoney(subtotal, TAX_RATE);

        return {
            partnerId,
            lines,
            hasPlus,
            itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
            subtotal,
            taxes,
            total: addMoney(subtotal, taxes),
            quantityOf: (itemId) => lines.find((line) => line.item.id === itemId)?.quantity ?? 0,
            setQuantity: (nextPartnerId, item, quantity) => {
                // A cart belongs to one partner; switching partners starts a fresh cart.
                const base = nextPartnerId === partnerId ? lines : [];
                setPartnerId(nextPartnerId);

                if (quantity <= 0) {
                    setLines(base.filter((line) => line.item.id !== item.id));
                    return;
                }

                // Update in place so lines keep their position as quantities change.
                setLines(
                    base.some((line) => line.item.id === item.id)
                        ? base.map((line) => (line.item.id === item.id ? { item, quantity } : line))
                        : [...base, { item, quantity }]
                );
            },
            setPlus: setHasPlus,
            clear: () => {
                setLines([]);
                setPartnerId(null);
                setHasPlus(false);
            },
        };
    }, [partnerId, lines, hasPlus]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
