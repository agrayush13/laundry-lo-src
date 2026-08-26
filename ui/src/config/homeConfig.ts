import { unsplashImage } from '../utils/imagesUtils';
import { IconName } from '../common-ui/icons/registry';
import { DRY, SPIN } from './cycleConfig';

/** Icons for the journey's figures, in the order it spins them. */
const STAT_ICONS: IconName[] = ['clock', 'shield', 'pin'];

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
        description: 'Clean, folded clothes delivered back within 24 hours.',
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
    badge: 'Now available in Bengaluru',
    title: { before: 'Fresh laundry, ', accent: 'delivered', after: ' to your door' },
    subtitle:
        'Compare prices, read reviews, and book top-rated laundry services near you. ' +
        'Pickup, wash, fold & deliver - all in one place.',
    search: { label: 'Pin code', placeholder: 'Enter your pin code', submit: 'Find Services' },
    image: {
        src: unsplashImage('photo-1517677208171-0bc6725a3e60', 1200),
        alt: 'Neatly folded, freshly laundered clothes stacked beside a washing machine',
    },
    floatingCard: { icon: 'clock' as IconName, title: 'Free pickup', detail: 'Within 2 hours' },
    /**
     * The same three figures the journey spins up, wearing icons. Quoted from
     * one place because they were quoted from two: this page claimed five
     * hundred partners while the journey counted fifty two, and the only way a
     * demo statistic stays honest is by existing once.
     */
    stats: SPIN.stats.map((stat, index) => ({
        icon: STAT_ICONS[index],
        value: `${stat.value}${stat.suffix ?? ''}`,
        label: stat.label,
    })) as StatItem[],
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
    title: 'Loved by Thousands',
    subtitle: 'Join 10,000+ happy customers who trust LaundryLo with their laundry.',
    rating: 5,
    items: [
        {
            quote:
                'laundrylo saved me hours every week. The pickup is always on time and my ' +
                'clothes come back perfectly folded.',
            name: 'Sneha Iyer',
            role: 'Busy professional, Indiranagar',
        },
        {
            quote:
                'With two kids at home the laundry never ends. Booking a slot the night ' +
                'before has been a genuine relief.',
            name: 'Rohit Deshpande',
            role: 'Parent of 2, HSR Layout',
        },
        {
            quote:
                'I send all my formal shirts for wash and iron. They come back crisp, and ' +
                'the per-kg pricing is honest.',
            name: 'Meera Nair',
            role: 'Small business owner, Koramangala',
        },
    ] as Testimonial[],
};

export const CTA_SECTION = {
    title: 'Ready to ditch laundry day?',
    guest: {
        subtitle: 'Sign up today and get your first pickup free. No commitment, cancel anytime.',
        primary: { label: 'Get Started Free', href: '/signup' },
    },
    authenticated: {
        subtitle: 'Pick a laundry near you and book a pickup - free collection on every order.',
        primary: { label: 'Find laundries near you', href: '/laundries' },
    },
    secondary: { label: 'Learn More', href: '/#how-it-works' },
};
