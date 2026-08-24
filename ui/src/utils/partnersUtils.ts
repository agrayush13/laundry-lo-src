import { PartnerAddress } from '../data/partners';

/** Structured address to a single display line. */
export const formatPartnerAddress = ({ line1, line2 }: PartnerAddress) =>
    [line1, line2].filter(Boolean).join(', ');

/** Metres to the nearest tenth of a kilometre, e.g. 800 becomes "0.8 km". */
export const formatDistance = (meters: number) => `${(meters / 1000).toFixed(1)} km`;
