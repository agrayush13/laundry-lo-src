import type { PriceUnit } from './catalogModels';
import type { Money } from './moneyModels';

export interface PartnerManagedCatalogItem {
    id: string;
    name: string;
    description: string | null;
    price: Money;
    unit: PriceUnit;
    iconKey: string;
    isActive: boolean;
}

export interface PartnerManagedCatalogCategory {
    id: string;
    service: string;
    name: string;
    items: PartnerManagedCatalogItem[];
}

export interface PartnerManagedCatalogItemInput {
    name: string;
    description: string | null;
    price: { amount: number; currency: 'INR' };
    isActive: boolean;
}
