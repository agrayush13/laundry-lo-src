import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CatalogItem } from '../models/catalogModels';
import { Money, addMoney, multiplyMoney } from '../models/moneyModels';
import { TAX_RATE } from '../config/cartConfig';
import { STORAGE_KEYS } from '../config/commonConfig';
import { MEMBERSHIP_SECTION } from '../config/membershipConfig';

/**
 * Enough of the partner to render the cart and checkout without another
 * request. The catalogue is per partner and lives on the server now, so a bare
 * id would mean a fetch before the cart could name where it is ordering from.
 */
export interface CartPartner {
    id: string;
    name: string;
}

export interface CartLine {
    item: CatalogItem;
    /**
     * Copied for display at add time because the catalogue it came from is no
     * longer in the bundle. The catalogue item id itself uniquely identifies
     * the line.
     */
    categoryName: string;
    quantity: number;
}

interface CartContextValue {
    partner: CartPartner | null;
    lines: CartLine[];
    /** Plus is an account-level add-on, not tied to a partner. */
    hasPlus: boolean;
    itemCount: number;
    subtotal: Money;
    taxes: Money;
    total: Money;
    quantityOf: (itemId: string) => number;
    setQuantity: (
        partner: CartPartner,
        item: CatalogItem,
        categoryName: string,
        quantity: number
    ) => void;
    setPlus: (hasPlus: boolean) => void;
    clear: () => void;
}

/**
 * Bumped whenever the stored shape changes. A mismatch discards the saved cart
 * rather than letting an outdated shape reach the components.
 */
const STORAGE_VERSION = 2;

interface StoredCart {
    version: number;
    partner: CartPartner | null;
    lines: CartLine[];
    hasPlus: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isPartner = (value: unknown): value is CartPartner =>
    isRecord(value) && typeof value['id'] === 'string' && typeof value['name'] === 'string';

const isCatalogItem = (value: unknown): value is CatalogItem => {
    if (!isRecord(value)) return false;

    const price = value['price'];
    return (
        typeof value['id'] === 'string' &&
        typeof value['name'] === 'string' &&
        (typeof value['description'] === 'string' || value['description'] === null) &&
        isRecord(price) &&
        Number.isSafeInteger(price['amount']) &&
        (price['amount'] as number) >= 0 &&
        price['currency'] === 'INR' &&
        (value['unit'] === 'piece' || value['unit'] === 'bag' || value['unit'] === 'kg') &&
        typeof value['iconKey'] === 'string'
    );
};

const isCartLine = (value: unknown): value is CartLine =>
    isRecord(value) &&
    isCatalogItem(value['item']) &&
    typeof value['categoryName'] === 'string' &&
    Number.isInteger(value['quantity']) &&
    (value['quantity'] as number) >= 1 &&
    (value['quantity'] as number) <= 99;

const isStoredCart = (value: unknown): value is StoredCart => {
    if (!isRecord(value) || value['version'] !== STORAGE_VERSION) return false;

    const partner = value['partner'];
    const lines = value['lines'];
    return (
        (partner === null || isPartner(partner)) &&
        Array.isArray(lines) &&
        lines.every(isCartLine) &&
        (lines.length === 0 || isPartner(partner)) &&
        typeof value['hasPlus'] === 'boolean'
    );
};

const readStoredCart = (): StoredCart | null => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEYS.cart);
        if (!raw) {
            return null;
        }

        const parsed: unknown = JSON.parse(raw);
        return isStoredCart(parsed) ? parsed : null;
    } catch {
        // Corrupt or unavailable storage should never break the app.
        return null;
    }
};

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stored] = useState(readStoredCart);
    const [{ partner, lines }, setCart] = useState({
        partner: stored?.partner ?? null,
        lines: stored?.lines ?? [],
    });
    const [hasPlus, setHasPlus] = useState(stored?.hasPlus ?? false);

    // The cart belongs to the browser rather than the account, so it survives a
    // refresh and works signed out. It is dropped once an order is placed.
    useEffect(() => {
        try {
            if (lines.length === 0 && !hasPlus) {
                window.localStorage.removeItem(STORAGE_KEYS.cart);
                return;
            }

            const payload: StoredCart = { version: STORAGE_VERSION, partner, lines, hasPlus };
            window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(payload));
        } catch {
            // Private browsing can reject writes; the in-memory cart still works.
        }
    }, [partner, lines, hasPlus]);

    const value = useMemo<CartContextValue>(() => {
        // Integer paise throughout; the backend will own these sums once it exists.
        const itemsTotal = addMoney(
            ...lines.map(({ item, quantity }) => multiplyMoney(item.price, quantity))
        );
        const subtotal = hasPlus ? addMoney(itemsTotal, MEMBERSHIP_SECTION.card.price) : itemsTotal;
        const taxes = multiplyMoney(subtotal, TAX_RATE);

        return {
            partner,
            lines,
            hasPlus,
            itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
            subtotal,
            taxes,
            total: addMoney(subtotal, taxes),
            quantityOf: (itemId) => lines.find((line) => line.item.id === itemId)?.quantity ?? 0,
            setQuantity: (nextPartner, item, categoryName, quantity) => {
                setCart((current) => {
                    // Read from the latest state rather than this render's
                    // closure, so two changes in one React batch cannot erase
                    // each other. Partner and lines move atomically for the
                    // same reason.
                    const base = nextPartner.id === current.partner?.id ? current.lines : [];
                    const nextLines =
                        quantity <= 0
                            ? base.filter((line) => line.item.id !== item.id)
                            : base.some((line) => line.item.id === item.id)
                              ? base.map((line) =>
                                    line.item.id === item.id
                                        ? { item, categoryName, quantity }
                                        : line
                                )
                              : [...base, { item, categoryName, quantity }];

                    return { partner: nextPartner, lines: nextLines };
                });
            },
            setPlus: setHasPlus,
            clear: () => {
                setCart({ partner: null, lines: [] });
                setHasPlus(false);
            },
        };
    }, [partner, lines, hasPlus]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
