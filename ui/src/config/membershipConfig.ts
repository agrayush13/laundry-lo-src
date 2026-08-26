import { rupees } from '../models/moneyModels';
import { IconName } from '../common-ui/icons/registry';

export interface BenefitItem {
    icon: IconName;
    title: string;
    description: string;
}

/**
 * laundrylo Plus. The perks live here rather than on any of the pages that sell
 * them, because five surfaces promise them and one applies them: the homepage
 * membership section, the journey's fold phase, the Plus page, the cart, and the
 * booking summary's discount line. A perk added here reaches all of them, which
 * is the only way the price on the folded shirt can be trusted to be the price
 * the cart charges.
 */
export const MEMBERSHIP_SECTION = {
    id: 'pricing',
    eyebrow: 'Membership',
    planName: 'LaundryLo Plus',
    title: { before: 'Upgrade to ' },
    subtitle:
        'One membership that makes every order feel premium. Free pickups, instant ' +
        'discounts, and priority scheduling.',
    card: {
        heading: { before: 'Join ' },
        tagline: 'Upgrade every order with premium perks',
        price: rupees(99),
        period: '/month',
        cta: 'Get LaundryLo Plus',
    },
    benefitsLabel: 'Plus Benefits',
    benefits: [
        {
            icon: 'truck',
            title: 'Free Pickup',
            description: 'On every single order, no minimum cart value',
        },
        {
            icon: 'percent',
            title: '10% Off Everything',
            description: 'Instant savings across wash, dry clean & more',
        },
        {
            icon: 'clock',
            title: 'Priority Slots',
            description: 'Skip the queue with first-in-line scheduling',
        },
    ] as BenefitItem[],
};
