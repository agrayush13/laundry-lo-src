import { BRAND } from '../config/brandConfig';
import { CART_COPY, PLUS_COPY } from '../config/cartConfig';
import { CTA_SECTION, HERO } from '../config/homeConfig';
import { LISTING_COPY } from '../config/listingConfig';
import { MEMBERSHIP_SECTION } from '../config/membershipConfig';

describe('public marketing copy', () => {
    it('describes implemented capabilities without unsupported operational promises', () => {
        const copy = JSON.stringify({
            hero: HERO,
            cta: CTA_SECTION,
            listing: LISTING_COPY,
            membership: MEMBERSHIP_SECTION,
            cart: CART_COPY,
            plus: PLUS_COPY,
            brand: BRAND,
        });

        expect(HERO.badge).toContain('demo');
        expect(HERO.stats.map(({ value }) => value)).toEqual(['Flexible', 'Secure', 'Live']);
        expect(copy).not.toMatch(
            /first pickup free|cancel any ?time|within (2|24) hours|priority slots?|free pickup and delivery on every order/i
        );
        expect(copy).not.toMatch(/verified partners?/i);
        expect(MEMBERSHIP_SECTION.benefits.map(({ title }) => title)).toContain('10% Off Services');
    });
});
