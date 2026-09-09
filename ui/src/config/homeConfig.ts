import { unsplashImage } from '../utils/imagesUtils';
import { IconName } from '../common-ui/icons/registry';
import { DRY } from './cycleConfig';

/**
 * What each of the journey's steps means, in a sentence. The step itself, and
 * the order the steps come in, belong to the journey.
 */
const STEP_DETAIL = [
    {
        icon: 'calendar' as IconName,
        description: "Schedule a convenient time and we'll come to you.",
    },
    {
        icon: 'truck' as IconName,
        description: 'Our driver picks up your laundry from your doorstep.',
    },
    {
        icon: 'sparkles' as IconName,
        description: 'Your clothes are cleaned by top-rated local pros.',
    },
    {
        icon: 'box' as IconName,
        description: 'Follow each order from pickup through delivery.',
    },
];

/** The journey prints its steps in lower case; this page sets them as sentences. */
const sentenceCase = (label: string) => label.charAt(0).toUpperCase() + label.slice(1);

export interface StatItem {
    icon: IconName;
    value: string;
    label: string;
}

export interface StepItem {
    icon: IconName;
    title: string;
    description: string;
}

export interface Testimonial {
    quote: string;
    name: string;
    role: string;
}

export const HERO = {
    badge: 'Full-stack marketplace demo',
    title: { before: 'Fresh laundry, ', accent: 'delivered', after: ' to your door' },
    subtitle:
        'Compare catalogues and book listed laundry services near you. ' +
        'Choose pickup and delivery slots, then track the order in one place.',
    search: { label: 'Pin code', placeholder: 'Enter your pin code', submit: 'Find Services' },
    image: {
        src: unsplashImage('photo-1517677208171-0bc6725a3e60', 1200),
        alt: 'Neatly folded, freshly laundered clothes stacked beside a washing machine',
    },
    floatingCard: { icon: 'clock' as IconName, title: 'Pickup slots', detail: 'Choose a time' },
    stats: [
        { icon: 'clock', value: 'Flexible', label: 'pickup scheduling' },
        { icon: 'shield', value: 'Secure', label: 'account checkout' },
        { icon: 'pin', value: 'Live', label: 'order tracking' },
    ] as StatItem[],
};

export const SERVICES_SECTION = {
    id: 'services',
    title: 'Our Services',
    subtitle:
        'Choose from a range of professional laundry services, all available for pickup and delivery.',
    pricePrefix: 'From',
};

export const HOW_IT_WORKS_SECTION = {
    id: 'how-it-works',
    title: 'How It Works',
    subtitle:
        'Getting your laundry done has never been easier. Four simple steps to fresh, clean clothes.',
    /**
     * The four steps the journey prints on the washing, given an icon and a line
     * of explanation each. The titles are not restated here: a fifth step added
     * to the line has to appear on this page too, and a wording changed on one
     * has to change on both.
     */
    steps: DRY.steps.map((step, index) => ({
        icon: STEP_DETAIL[index].icon,
        title: sentenceCase(step.label),
        description: STEP_DETAIL[index].description,
    })) as StepItem[],
};

export const TESTIMONIALS_SECTION = {
    title: 'Designed for everyday routines',
    subtitle: 'Illustrative scenarios for this demo, not customer reviews or usage claims.',
    itemLabel: 'Example scenario',
    items: [
        {
            quote:
                'laundrylo saved me hours every week. The pickup is always on time and my ' +
                'clothes come back perfectly folded.',
            name: 'Busy professionals',
            role: 'Example use case',
        },
        {
            quote:
                'With two kids at home the laundry never ends. Booking a slot the night ' +
                'before has been a genuine relief.',
            name: 'Family households',
            role: 'Example use case',
        },
        {
            quote:
                'I send all my formal shirts for wash and iron. They come back crisp, and ' +
                'the per-item pricing is clear up front.',
            name: 'Small business owners',
            role: 'Example use case',
        },
    ] as Testimonial[],
};

export const CTA_SECTION = {
    title: 'Ready to ditch laundry day?',
    guest: {
        subtitle: 'Create an account to save addresses, sync your cart and track orders.',
        primary: { label: 'Create an account', href: '/signup' },
    },
    authenticated: {
        subtitle: 'Compare nearby catalogues, choose your slots and track the order.',
        primary: { label: 'Find laundries near you', href: '/laundries' },
    },
    secondary: { label: 'Learn More', href: '/#how-it-works' },
};
