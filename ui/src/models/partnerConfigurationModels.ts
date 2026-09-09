import type { OpeningHours, PartnerAddress } from './partnerModels';

export interface HolidayClosure {
    date: string;
    reason: string;
}

export interface CapacityOverride {
    date: string;
    capacity: number;
    note: string;
}

export interface PartnerLaundryConfiguration {
    id: string;
    name: string;
    about: string;
    address: PartnerAddress;
    servicePincodes: string[];
    holidayClosures: HolidayClosure[];
    capacityOverrides: CapacityOverride[];
    turnaroundHours: number;
    acceptingOrders: boolean;
    useOpeningHours: boolean;
    currentlyOpen: boolean;
    openingHours: OpeningHours[];
}

export type PartnerLaundryConfigurationInput = Omit<
    PartnerLaundryConfiguration,
    'id' | 'currentlyOpen'
>;
