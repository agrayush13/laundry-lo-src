import { hasAuthCallbackError, safeAuthDestination } from '../utils/authUtils';

describe('safeAuthDestination', () => {
    it('keeps an in-app path, query and fragment', () => {
        expect(safeAuthDestination('/bookings?filter=active#latest')).toBe(
            '/bookings?filter=active#latest'
        );
    });

    it.each([
        'https://attacker.example/steal',
        '//attacker.example/steal',
        '/\\attacker.example/steal',
    ])('rejects an external auth return destination: %s', (destination) => {
        expect(safeAuthDestination(destination)).toBe('/');
    });
});

describe('hasAuthCallbackError', () => {
    it.each([
        { search: '?error=access_denied', hash: '' },
        { search: '?error_code=flow_state_expired', hash: '' },
        { search: '', hash: '#error_description=The+link+expired' },
    ])('detects a callback error in $search $hash', (location) => {
        expect(hasAuthCallbackError(location)).toBe(true);
    });

    it('does not treat a successful callback as an error', () => {
        expect(hasAuthCallbackError({ search: '?code=one-time-code&next=%2F', hash: '' })).toBe(
            false
        );
    });
});
