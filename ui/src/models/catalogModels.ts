import { Money } from './moneyModels';

/**
 * Pricing is per item, so a line total is always known at checkout. `bag` and
 * `kg` exist because the API contract reserves them, but nothing ships with
 * them until there are real bags and scales behind the counter.
 */
export type PriceUnit = 'piece' | 'bag' | 'kg';

export interface CatalogItem {
    id: string;
    name: string;
    description: string | null;
    price: Money;
    unit: PriceUnit;
    /**
     * A key into the icon registry, not a glyph. Unknown keys are the server's
     * to add and the client's to survive, so read it through `iconFor`.
     */
    iconKey: string;
}

export interface CatalogCategory {
    id: string;
    /** The platform's slug, which is what the listing filter matches on. */
    service: string;
    /** The partner's own name for it, which is what a customer reads. */
    name: string;
    items: CatalogItem[];
}
