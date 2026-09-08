import type { OpeningHours, PartnerAddress } from './partnerModels';

export interface HolidayClosure {
    date: string;
    reason: string;
}

export interface PartnerLaundryConfiguration {
    id: string;
    name: string;
    about: string;
    address: PartnerAddress;
    servicePincodes: string[];
    holidayClosures: HolidayClosure[];
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
