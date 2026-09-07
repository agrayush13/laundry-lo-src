import type { Client } from '../db/pool.js';
import { money } from '../http/money.js';
import type {
    Order,
    OrderEventType,
    OrderStatus,
    PartnerOrderSummary,
    PriceUnit,
} from '../models.js';

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

export interface PartnerOrderCursorRow {
    id: string;
    placed_at: Date;
}

interface PartnerOrderSummaryRow extends PartnerOrderCursorRow {
    reference: string;
    status: OrderStatus;
    partner_id: string;
    partner_name: string;
    recipient_name: string;
    pincode: string;
    item_count: number;
    total: number;
    currency: string;
    pickup_starts_at: Date;
    pickup_ends_at: Date;
    delivery_starts_at: Date;
    delivery_ends_at: Date;
    latest_event: OrderEventType;
    latest_event_at: Date;
}

export interface PartnerOrderFilters {
    partnerId?: string;
    status?: OrderStatus;
    cursorKey?: number;
    cursorId?: string;
    limit: number;
}

const dateInIst = (value: Date): string =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(value);

const readOrder = async (
    client: Client,
    orderId: string,
    access: { customerId: string } | { partnerOwner: true }
): Promise<Order | null> => {
    const accessClause =
        'customerId' in access ? 'o.user_id = $2::uuid' : 'public.owns_partner(o.partner_id)';
    const parameters = 'customerId' in access ? [orderId, access.customerId] : [orderId];
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
         where o.id = $1 and ${accessClause}`,
        parameters
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

export const getOrder = (client: Client, customerId: string, orderId: string) =>
    readOrder(client, orderId, { customerId });

export const getPartnerOrder = (client: Client, orderId: string) =>
    readOrder(client, orderId, { partnerOwner: true });

export const listPartnerOrders = async (
    client: Client,
    filters: PartnerOrderFilters
): Promise<PartnerOrderSummaryRow[]> => {
    const { rows } = await client.query<PartnerOrderSummaryRow>(
        `select o.id, o.reference, o.status, o.placed_at,
                o.partner_id, p.name as partner_name,
                address.recipient_name, address.pincode,
                items.item_count, o.total, o.currency,
                pickup.starts_at as pickup_starts_at,
                pickup.ends_at as pickup_ends_at,
                delivery.starts_at as delivery_starts_at,
                delivery.ends_at as delivery_ends_at,
                latest.type as latest_event,
                latest.occurred_at as latest_event_at
         from public.orders o
         join public.partners p on p.id = o.partner_id
         join public.order_addresses address on address.order_id = o.id
         join public.slots pickup on pickup.id = o.pickup_slot_id
         join public.slots delivery on delivery.id = o.delivery_slot_id
         cross join lateral (
             select coalesce(sum(quantity), 0)::integer as item_count
             from public.order_items where order_id = o.id
         ) items
         join lateral (
             select type, occurred_at
             from public.order_events where order_id = o.id
             order by occurred_at desc, id desc limit 1
         ) latest on true
         where p.owner_id = auth.uid()
           and ($1::text is null or o.partner_id = $1)
           and ($2::public.order_status is null or o.status = $2)
           and ($3::double precision is null or
                (o.placed_at, o.id) < (to_timestamp($3 / 1000.0), $4))
         order by o.placed_at desc, o.id desc
         limit $5`,
        [
            filters.partnerId ?? null,
            filters.status ?? null,
            filters.cursorKey ?? null,
            filters.cursorId ?? null,
            filters.limit,
        ]
    );
    return rows;
};

export const serializePartnerOrderSummary = (row: PartnerOrderSummaryRow): PartnerOrderSummary => ({
    id: row.id,
    reference: row.reference,
    status: row.status,
    placedAt: row.placed_at.toISOString(),
    partner: { id: row.partner_id, name: row.partner_name },
    recipient: { name: row.recipient_name, pincode: row.pincode },
    itemCount: row.item_count,
    total: money(row.total, row.currency),
    pickup: {
        startsAt: row.pickup_starts_at.toISOString(),
        endsAt: row.pickup_ends_at.toISOString(),
    },
    delivery: {
        startsAt: row.delivery_starts_at.toISOString(),
        endsAt: row.delivery_ends_at.toISOString(),
    },
    latestEvent: {
        type: row.latest_event,
        occurredAt: row.latest_event_at.toISOString(),
    },
});
