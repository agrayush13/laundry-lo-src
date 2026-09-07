import { rupees } from '../models/moneyModels';
import { IconName } from '../common-ui/icons/registry';

export interface BenefitItem {
    icon: IconName;
    title: string;
    description: string;
}

/**
 * laundrylo Plus. The perks live here rather than on any of the pages that sell
 * them, because several surfaces explain them and checkout applies them: the
 * homepage membership section, the journey's fold phase, the Plus page, the
 * cart, and the booking summary's discount line. Keep this list limited to
 * behavior the server currently enforces.
 */
export const MEMBERSHIP_SECTION = {
    id: 'pricing',
    eyebrow: 'Membership',
    planName: 'LaundryLo Plus',
    title: { before: 'Upgrade to ' },
    subtitle: 'One month of 10% service savings, calculated and applied at checkout.',
    card: {
        heading: { before: 'Join ' },
        tagline: 'Save 10% on service items for one active month',
        price: rupees(99),
        period: 'for one month',
        cta: 'Add LaundryLo Plus',
    },
    benefitsLabel: 'Plus Benefits',
    benefits: [
        {
            icon: 'percent',
            title: '10% Off Services',
            description: 'Applied to eligible service items in every checkout total',
        },
        {
            icon: 'calendar',
            title: 'One-Month Access',
            description: 'Benefits remain active for one month after your first service order',
        },
        {
            icon: 'receipt',
            title: 'Clear Checkout Pricing',
            description: 'The membership fee and discount are itemized before you order',
        },
    ] as BenefitItem[],
};
