import type { Client } from '../db/pool.js';
import { money } from '../http/money.js';
import type {
    Cart,
    MembershipStatus,
    Order,
    OrderEventType,
    OrderStatus,
    PriceUnit,
} from '../models.js';

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

interface OrderRow {
    id: string;
    reference: string;
    status: OrderStatus;
    placed_at: Date;
    partner_id: string;
    partner_name: string;
    subtotal: number;
    delivery_fee: number;
    membership_fee: number;
    discount: number;
    tax: number;
    total: number;
    currency: string;
    pickup_starts_at: Date;
    pickup_ends_at: Date;
    delivery_starts_at: Date;
    delivery_ends_at: Date;
}

const dateInIst = (value: Date): string =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(value);

export const getOrder = async (
    client: Client,
    userId: string,
    orderId: string
): Promise<Order | null> => {
    const { rows } = await client.query<OrderRow>(
        `select o.id, o.reference, o.status, o.placed_at,
                o.partner_id, p.name as partner_name,
                o.subtotal, o.delivery_fee, o.membership_fee,
                o.discount, o.tax, o.total, o.currency,
                pickup.starts_at as pickup_starts_at,
                pickup.ends_at as pickup_ends_at,
                delivery.starts_at as delivery_starts_at,
                delivery.ends_at as delivery_ends_at
         from public.orders o
         join public.partners p on p.id = o.partner_id
         join public.slots pickup on pickup.id = o.pickup_slot_id
         join public.slots delivery on delivery.id = o.delivery_slot_id
         where o.id = $1 and o.user_id = $2`,
        [orderId, userId]
    );
    const row = rows[0];
    if (!row) return null;

    // A PoolClient has one connection; issue these in order rather than asking
    // node-postgres to queue overlapping queries (that behavior is removed in
    // pg 9).
    const lines = await client.query<{
        item_id: string;
        name: string;
        quantity: number;
        unit: PriceUnit;
        line_total: number;
    }>(
        `select item_id, name, quantity, unit, line_total
             from public.order_items where order_id = $1 order by name, item_id`,
        [orderId]
    );
    const addresses = await client.query<{
        label: string;
        recipient_name: string;
        phone: string;
        building: string;
        street: string;
        landmark: string | null;
        pincode: string;
    }>('select * from public.order_addresses where order_id = $1', [orderId]);
    const events = await client.query<{ type: OrderEventType; occurred_at: Date }>(
        `select type, occurred_at from public.order_events
             where order_id = $1 order by occurred_at, id`,
        [orderId]
    );
    const address = addresses.rows[0];
    if (!address) return null;

    return {
        id: row.id,
        reference: row.reference,
        status: row.status,
        placedAt: row.placed_at.toISOString(),
        partner: { id: row.partner_id, name: row.partner_name },
        lines: lines.rows.map((line) => ({
            itemId: line.item_id,
            name: line.name,
            quantity: line.quantity,
            unit: line.unit,
            amount: money(line.line_total, row.currency),
        })),
        totals: {
            subtotal: money(row.subtotal, row.currency),
            delivery: money(row.delivery_fee, row.currency),
            membership: money(row.membership_fee, row.currency),
            discount: money(row.discount, row.currency),
            tax: money(row.tax, row.currency),
            total: money(row.total, row.currency),
        },
        deliveryAddress: {
            label: address.label,
            recipientName: address.recipient_name,
            phone: address.phone,
            building: address.building,
            street: address.street,
            landmark: address.landmark ?? '',
            pincode: address.pincode,
        },
        pickup: {
            date: dateInIst(row.pickup_starts_at),
            startsAt: row.pickup_starts_at.toISOString(),
            endsAt: row.pickup_ends_at.toISOString(),
        },
        delivery: {
            date: dateInIst(row.delivery_starts_at),
            startsAt: row.delivery_starts_at.toISOString(),
            endsAt: row.delivery_ends_at.toISOString(),
        },
        events: events.rows.map((event) => ({
            type: event.type,
            occurredAt: event.occurred_at.toISOString(),
        })),
    };
};
