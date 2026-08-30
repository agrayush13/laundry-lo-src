import { PartnerAddress } from '../models/partnerModels';

/** Structured address to a single display line. */
export const formatPartnerAddress = ({ line1, line2 }: PartnerAddress) =>
    [line1, line2].filter(Boolean).join(', ');

/**
 * Metres to the nearest tenth of a kilometre, e.g. 800 becomes "0.8 km".
 * Null when the search had no pin code to measure from, in which case the
 * caller shows nothing rather than a confident "0.0 km".
 */
export const formatDistance = (meters: number | null) =>
    meters === null ? null : `${(meters / 1000).toFixed(1)} km`;
