import { rupees } from '../models/moneyModels';
import { unsplashImage } from '../utils/imagesUtils';
import { IconName } from '../common-ui/icons/registry';

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

export interface BenefitItem {
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
    stats: [
        { icon: 'star', value: '4.9', label: 'Avg rating' },
        { icon: 'clock', value: '24h', label: 'Turnaround' },
        { icon: 'shield', value: '500+', label: 'Partners' },
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
    steps: [
        {
            icon: 'calendar',
            title: 'Book a pickup',
            description: "Schedule a convenient time and we'll come to you.",
        },
        {
            icon: 'truck',
            title: 'We collect',
            description: 'Our driver picks up your laundry from your doorstep.',
        },
        {
            icon: 'sparkles',
            title: 'Expert cleaning',
            description: 'Your clothes are cleaned by top-rated local pros.',
        },
        {
            icon: 'box',
            title: 'Fresh delivery',
            description: 'Clean, folded clothes delivered back within 24 hours.',
        },
    ] as StepItem[],
};

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
