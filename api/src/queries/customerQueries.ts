import type { Client } from '../db/pool.js';
import { money } from '../http/money.js';
import type { Cart, MembershipStatus, PriceUnit } from '../models.js';

export const PLUS_PRICE = 9_900;
const TAX_PERCENT = 18;

interface CartRow {
    id: string;
    partner_id: string | null;
    partner_name: string | null;
    has_plus: boolean;
}

interface CartItemRow {
    item_id: string;
    name: string;
    description: string | null;
    category_name: string;
    icon_key: string;
    unit: PriceUnit;
    price: number;
    quantity: number;
}

export const getMembership = async (
    client: Client,
    userId: string
): Promise<MembershipStatus | null> => {
    const { rows } = await client.query<{
        plan: 'plus';
        started_at: Date;
        renews_at: Date;
        is_active: boolean;
    }>(
        `select plan, started_at, renews_at, is_active
         from public.memberships where user_id = $1`,
        [userId]
    );
    const row = rows[0];
    return row
        ? {
              plan: row.plan,
              startedAt: row.started_at.toISOString(),
              renewsAt: row.renews_at.toISOString(),
              isActive: row.is_active && row.renews_at.getTime() > Date.now(),
          }
        : null;
};

export const getCart = async (client: Client, userId: string): Promise<Cart> => {
    const { rows: cartRows } = await client.query<CartRow>(
        `select c.id, c.partner_id, p.name as partner_name, c.has_plus
         from public.carts c
         left join public.partners p on p.id = c.partner_id
         where c.user_id = $1`,
        [userId]
    );
    const cart = cartRows[0];
    if (!cart) {
        const zero = money(0);
        return {
            id: null,
            partner: null,
            items: [],
            membership: null,
            totals: {
                subtotal: zero,
                delivery: zero,
                membership: zero,
                discount: zero,
                tax: zero,
                total: zero,
            },
        };
    }

    const { rows } = await client.query<CartItemRow>(
        `select i.id as item_id, i.name, i.description, cc.name as category_name,
                i.icon_key, i.unit, i.price, ci.quantity
         from public.cart_items ci
         join public.catalog_items i on i.id = ci.item_id
         join public.catalog_categories cc on cc.id = i.category_id
         where ci.cart_id = $1
         order by i.name, i.id`,
        [cart.id]
    );
    const membership = await getMembership(client, userId);
    const subtotal = rows.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const receivesBenefits = cart.has_plus || membership?.isActive === true;
    const membershipFee = cart.has_plus && membership?.isActive !== true ? PLUS_PRICE : 0;
    const discount = receivesBenefits ? Math.floor(subtotal * 0.1) : 0;
    const delivery = 0;
    const taxable = subtotal + membershipFee + delivery - discount;
    const tax = Math.round((taxable * TAX_PERCENT) / 100);

    return {
        id: cart.id,
        partner:
            cart.partner_id && cart.partner_name
                ? { id: cart.partner_id, name: cart.partner_name }
                : null,
        items: rows.map((item) => ({
            itemId: item.item_id,
            name: item.name,
            description: item.description,
            categoryName: item.category_name,
            iconKey: item.icon_key,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: money(item.price),
            lineTotal: money(item.price * item.quantity),
        })),
        membership: cart.has_plus
            ? { plan: 'plus', price: money(membershipFee), period: 'month' }
            : null,
        totals: {
            subtotal: money(subtotal),
            delivery: money(delivery),
            membership: money(membershipFee),
            discount: money(discount),
            tax: money(tax),
            total: money(taxable + tax),
        },
    };
};
