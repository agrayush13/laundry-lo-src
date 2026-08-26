import { IconName } from '../common-ui/icons/registry';

/**
 * Copy and structure for the journey, which is one wash cycle: the scroll
 * position is the cycle's progress. Section ids double as the anchors its header
 * and footer link to. See docs/journey.md.
 *
 * The homepage reads from here too. The four steps and the three figures appear
 * on both pages, and this is the one place either of them is written down.
 */

export type CycleSectionId =
    'the-wash' | 'the-rinse' | 'the-spin' | 'the-dry' | 'the-fold' | 'the-deliver';

export interface CycleSectionMeta {
    id: CycleSectionId;
    /** The cycle is numbered rather than titled, so the eyebrow carries both. */
    number: string;
    name: string;
}

const meta = (id: CycleSectionId, number: string, name: string): CycleSectionMeta => ({
    id,
    number,
    name,
});

export type GarmentGlyph = 'tee' | 'sock';

export interface CleanWord {
    text: string;
    /** One word carries the steel blue; the rest is plain ink. */
    accent?: boolean;
}

export interface HeadlineSegment {
    /** The letters this segment spells; a glyph stands in for them on screen. */
    text: string;
    glyph?: GarmentGlyph;
}

export const WASH = {
    meta: meta('the-wash', '01', 'The Wash'),
    eyebrow: 'Bengaluru · pickup & delivery',
    /**
     * Two lines, so the break never lands mid-phrase, and the second one carries
     * the substitutions: the t of "lost" is a t-shirt, the l of "laundry" is a
     * sock. The letters they replace stay in the DOM, so the heading still reads
     * as a sentence.
     */
    headline: [
        [{ text: 'Another weekend,' }],
        [
            { text: 'los' },
            { text: 't', glyph: 'tee' },
            { text: ' to ' },
            { text: 'l', glyph: 'sock' },
            { text: 'aundry.' },
        ],
    ] as HeadlineSegment[][],
    /**
     * What the wash leaves behind. It arrives a word at a time during the water
     * beat, so it is modelled as words rather than a sentence.
     */
    cleanHeadline: [
        { text: 'Get' },
        { text: 'your' },
        { text: 'weekends', accent: true },
        { text: 'back.' },
    ] as CleanWord[],
    subtitle:
        'Compare local laundries, read reviews, book a pickup. Clean clothes back in 24 hours.',
    // Per-item pricing means the total is known before the van arrives, which is
    // what the third beat says now that "pay after weighing" is retired.
    micro: ['free pickup', '24h turnaround', 'price shown up front'],
    scrollCue: 'Scroll to wash',
} as const;

export const RINSE = {
    meta: meta('the-rinse', '02', 'The Rinse'),
    title: 'Every kind of clean.',
    pricePrefix: 'from',
    cta: 'Find laundries near you',
} as const;

export type ServiceTint = 'blue' | 'mint' | 'pink' | 'amber';

/**
 * How each service reads on the rinse cards. The tint and the icon are
 * presentation, so they live here rather than in the catalogue: the API will own
 * the service, never the colour it is drawn in.
 */
export const SERVICE_CARDS: Record<string, { tint: ServiceTint; icon: IconName }> = {
    'wash-fold': { tint: 'blue', icon: 'shirt' },
    'wash-iron': { tint: 'mint', icon: 'sparkles' },
    'dry-cleaning': { tint: 'pink', icon: 'star' },
    'premium-care': { tint: 'amber', icon: 'crown' },
};

export interface CycleStat {
    value: string;
    /** Rendered in the accent, and only ever a suffix like "h" or "+". */
    suffix?: string;
    label: string;
}

export const SPIN = {
    meta: meta('the-spin', '03', 'The Spin'),
    /** Demo figures, carried by the footer disclaimer. See docs/homepage.md 8.1. */
    stats: [
        { value: '24', suffix: 'h', label: 'average turnaround' },
        { value: '52', suffix: '+', label: 'partner laundries' },
        { value: '6', label: 'pin codes in blr' },
    ] as CycleStat[],
} as const;

export interface CycleStep {
    number: string;
    label: string;
}

export const DRY = {
    meta: meta('the-dry', '04', 'The Dry'),
    /** Printed on the garments themselves; no tags, no leader lines. */
    steps: [
        { number: '01', label: 'book a pickup' },
        { number: '02', label: 'we collect' },
        { number: '03', label: 'partners clean' },
        { number: '04', label: 'back in 24h' },
    ] as CycleStep[],
    signoff: "Hung out, so you don't have to.",
} as const;

export const FOLD = {
    meta: meta('the-fold', '05', 'The Fold'),
    title: 'Folded into every order.',
    /** The perks come from the membership config, so the shirt cannot promise
     *  more than the booking summary honours. */
    chest: { brand: 'laundrylo', plan: 'plus' },
    cta: 'Get Plus',
} as const;

export const DELIVER = {
    meta: meta('the-deliver', '06', 'The Deliver'),
    title: 'Cycle complete.',
    subtitle: 'You rode the whole cycle. Book a pickup and get your first weekend back.',
    tag: { label: 'built by ayush', href: 'https://github.com/agrayush13' },
    disclaimer: 'a demo project by ayush, not a real service.',
    backToStart: 'back to the start',
} as const;

export const CYCLE_SECTIONS: CycleSectionMeta[] = [
    WASH.meta,
    RINSE.meta,
    SPIN.meta,
    DRY.meta,
    FOLD.meta,
    DELIVER.meta,
];

/** Shared by both pin-code placements, the hero and the footer. */
export const PIN_SEARCH = {
    label: 'Pin code',
    placeholder: '560103',
    submit: 'Find laundries',
} as const;

/**
 * The one control the cycle carries. It used to be a link to the dry, which
 * answered "how it works" by dropping the visitor into the middle of it.
 */
export const CYCLE_HEADER = {
    tour: { play: 'watch the cycle', stop: 'stop' },
} as const;
