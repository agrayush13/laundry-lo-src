import type { Client } from '../db/pool.js';
import type { OpeningHours, PartnerConfiguration } from '../models.js';

interface PartnerConfigurationRow {
    id: string;
    name: string;
    about: string | null;
    line1: string;
    line2: string;
    city: string;
    pincode: string;
    service_pincodes: string[];
    turnaround_hours: number;
    is_open: boolean;
    auto_schedule: boolean;
    currently_open: boolean;
    opening_hours: Array<{
        weekday: number;
        opensAt: string | null;
        closesAt: string | null;
    }>;
}

export interface PartnerConfigurationInput {
    name: string;
    about: string;
    address: {
        line1: string;
        line2: string;
        city: string;
        pincode: string;
    };
    servicePincodes: string[];
    turnaroundHours: number;
    acceptingOrders: boolean;
    useOpeningHours: boolean;
    openingHours: OpeningHours[];
}

const baseQuery = `
    select p.id, p.name, p.about, p.line1, p.line2, p.city, p.pincode,
           p.turnaround_hours, p.is_open, p.auto_schedule,
           public.is_partner_open(p.id) as currently_open,
           coalesce(
               (
                   select jsonb_agg(area.pincode order by area.pincode)
                   from public.partner_service_areas area
                   where area.partner_id = p.id
               ),
               '[]'::jsonb
           ) as service_pincodes,
           coalesce(
               jsonb_agg(
                   jsonb_build_object(
                       'weekday', h.weekday,
                       'opensAt', case when h.opens_at is null then null else to_char(h.opens_at, 'HH24:MI') end,
                       'closesAt', case when h.closes_at is null then null else to_char(h.closes_at, 'HH24:MI') end
                   ) order by h.weekday
               ) filter (where h.weekday is not null),
               '[]'::jsonb
           ) as opening_hours
    from public.partners p
    left join public.partner_hours h on h.partner_id = p.id`;

const groupBy = `
    group by p.id, p.name, p.about, p.line1, p.line2, p.city, p.pincode,
             p.turnaround_hours, p.is_open, p.auto_schedule`;

const toConfiguration = (row: PartnerConfigurationRow): PartnerConfiguration => ({
    id: row.id,
    name: row.name,
    about: row.about ?? '',
    address: {
        line1: row.line1,
        line2: row.line2,
        city: row.city,
        pincode: row.pincode,
    },
    servicePincodes: row.service_pincodes,
    turnaroundHours: row.turnaround_hours,
    acceptingOrders: row.is_open,
    useOpeningHours: row.auto_schedule,
    currentlyOpen: row.currently_open,
    openingHours: row.opening_hours,
});

export const listOwnedPartnerConfigurations = async (
    client: Client
): Promise<PartnerConfiguration[]> => {
    const { rows } = await client.query<PartnerConfigurationRow>(
        `${baseQuery}
         where p.owner_id = auth.uid()
         ${groupBy}
         order by p.name, p.id`
    );
    return rows.map(toConfiguration);
};

export const getOwnedPartnerConfiguration = async (
    client: Client,
    partnerId: string
): Promise<PartnerConfiguration | null> => {
    const { rows } = await client.query<PartnerConfigurationRow>(
        `${baseQuery}
         where p.id = $1 and p.owner_id = auth.uid()
         ${groupBy}`,
        [partnerId]
    );
    return rows[0] ? toConfiguration(rows[0]) : null;
};

export const updateOwnedPartnerConfiguration = async (
    client: Client,
    partnerId: string,
    input: PartnerConfigurationInput
): Promise<PartnerConfiguration | null> => {
    const result = await client.query(
        `update public.partners
         set name = $2,
             about = nullif($3, ''),
             line1 = $4,
             line2 = $5,
             city = $6,
             pincode = $7,
             turnaround_hours = $8,
             is_open = $9,
             auto_schedule = $10
         where id = $1 and owner_id = auth.uid()`,
        [
            partnerId,
            input.name,
            input.about,
            input.address.line1,
            input.address.line2,
            input.address.city,
            input.address.pincode,
            input.turnaroundHours,
            input.acceptingOrders,
            input.useOpeningHours,
        ]
    );
    if (result.rowCount === 0) return null;

    await client.query('select public.replace_partner_hours($1, $2::jsonb)', [
        partnerId,
        JSON.stringify(input.openingHours),
    ]);
    await client.query('select public.replace_partner_service_areas($1, $2::text[])', [
        partnerId,
        input.servicePincodes,
    ]);
    return getOwnedPartnerConfiguration(client, partnerId);
};
