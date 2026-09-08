import type {
    PartnerLaundryConfiguration,
    PartnerLaundryConfigurationInput,
} from '../models/partnerConfigurationModels';
import { apiGet, apiPut } from './apiClient';

export const getPartnerLaundries = (signal?: AbortSignal) =>
    apiGet<{ data: PartnerLaundryConfiguration[] }>('/partner/laundries', { signal }).then(
        ({ data }) => data
    );

export const updatePartnerLaundry = (partnerId: string, input: PartnerLaundryConfigurationInput) =>
    apiPut<PartnerLaundryConfiguration>(
        `/partner/laundries/${encodeURIComponent(partnerId)}`,
        input
    );
