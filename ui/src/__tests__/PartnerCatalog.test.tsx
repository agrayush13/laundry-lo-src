import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
    PartnerManagedCatalogCategory,
    PartnerManagedCatalogItem,
} from '../models/partnerCatalogModels';
import { authenticateTestUser, renderApp } from '../__mocks__/renderWithProviders';

const catalogFixture = (): PartnerManagedCatalogCategory[] => [
    {
        id: 'cat_wash',
        service: 'wash-fold',
        name: 'Wash & Fold',
        items: [
            {
                id: 'itm_shirt',
                name: 'Shirt',
                description: 'Everyday cotton shirt.',
                price: { amount: 2000, currency: 'INR' },
                unit: 'piece',
                iconKey: 'shirt',
                isActive: true,
            },
            {
                id: 'itm_towel',
                name: 'Towel',
                description: null,
                price: { amount: 1500, currency: 'INR' },
                unit: 'piece',
                iconKey: 'unknown-future-icon',
                isActive: false,
            },
        ],
    },
];

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

const apiError = (code: string, message: string, status: number) =>
    json({ error: { code, message, requestId: 'partner-catalog-test' } }, status);

const installCatalogApi = ({ denied = false, saveFails = false } = {}) => {
    let categories = catalogFixture();
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = new URL(String(input), 'http://localhost').pathname.replace('/api/v1', '');
        const method = init?.method ?? 'GET';

        if (path === '/partner/laundries' && method === 'GET') {
            return denied
                ? apiError('FORBIDDEN', 'A laundry-owner account is required.', 403)
                : json({
                      data: [
                          {
                              id: '1001',
                              name: 'SparkleWash Express',
                              about: '',
                              address: {
                                  line1: '12 Lake Road',
                                  line2: '',
                                  city: 'Bengaluru',
                                  pincode: '560103',
                              },
                              turnaroundHours: 24,
                              acceptingOrders: true,
                              useOpeningHours: true,
                              currentlyOpen: true,
                              openingHours: [],
                          },
                      ],
                  });
        }

        if (path === '/partner/laundries/1001/catalog' && method === 'GET') {
            return json({ categories });
        }

        if (path === '/partner/laundries/1001/catalog/categories' && method === 'POST') {
            if (saveFails) return apiError('INTERNAL_ERROR', 'Service save failed.', 500);
            const body = JSON.parse(String(init?.body)) as Pick<
                PartnerManagedCatalogCategory,
                'service' | 'name'
            >;
            if (categories.some(({ service }) => service === body.service)) {
                return apiError(
                    'SERVICE_ALREADY_EXISTS',
                    'This laundry already has that service in its catalogue.',
                    409
                );
            }
            const saved: PartnerManagedCatalogCategory = {
                id: `cat_${body.service}`,
                service: body.service,
                name: body.name.trim(),
                items: [],
            };
            categories = [...categories, saved];
            return json(saved, 201);
        }

        const itemCreate =
            method === 'POST'
                ? /^\/partner\/laundries\/1001\/catalog\/categories\/([^/]+)\/items$/.exec(path)
                : null;
        if (itemCreate) {
            if (saveFails) return apiError('INTERNAL_ERROR', 'Item save failed.', 500);
            const body = JSON.parse(String(init?.body)) as Pick<
                PartnerManagedCatalogItem,
                'name' | 'description' | 'price' | 'isActive'
            >;
            const saved: PartnerManagedCatalogItem = {
                id: 'itm_created',
                ...body,
                unit: 'piece',
                iconKey: 'box',
            };
            categories = categories.map((category) =>
                category.id === itemCreate[1]
                    ? { ...category, items: [...category.items, saved] }
                    : category
            );
            return json(saved, 201);
        }

        if (path === '/partner/laundries/1001/catalog/categories/cat_wash' && method === 'PATCH') {
            if (saveFails) return apiError('INTERNAL_ERROR', 'Service save failed.', 500);
            const body = JSON.parse(String(init?.body)) as { name: string };
            const saved = { ...categories[0]!, name: body.name.trim() };
            categories = [saved];
            return json(saved);
        }

        if (path === '/partner/laundries/1001/catalog/items/itm_shirt' && method === 'PATCH') {
            if (saveFails) return apiError('INTERNAL_ERROR', 'Item save failed.', 500);
            const body = JSON.parse(String(init?.body)) as Pick<
                PartnerManagedCatalogItem,
                'name' | 'description' | 'price' | 'isActive'
            >;
            const saved: PartnerManagedCatalogItem = {
                ...categories[0]!.items[0]!,
                ...body,
            };
            categories = [
                {
                    ...categories[0]!,
                    items: [saved, categories[0]!.items[1]!],
                },
            ];
            return json(saved);
        }

        return apiError('NOT_FOUND', 'No such endpoint.', 404);
    });
    vi.stubGlobal('fetch', fetch);
    return fetch;
};

const itemEditor = async (name: string) => {
    const heading = await screen.findByRole('heading', { name, level: 3 });
    return within(heading.closest('li')!);
};

describe('laundry-partner catalogue management', () => {
    it('returns an owner to the protected catalogue after sign-in', async () => {
        const user = userEvent.setup();
        installCatalogApi();
        renderApp('/partner/catalogue');

        await user.type(await screen.findByLabelText('Email'), 'owner@example.com');
        await user.type(screen.getByLabelText('Password'), 'password');
        await user.click(screen.getByRole('button', { name: /^sign in$/i }));

        expect(
            await screen.findByRole('heading', { name: 'Catalogue and pricing', level: 1 })
        ).toBeInTheDocument();
        expect(await screen.findByRole('heading', { name: 'Shirt', level: 3 })).toBeInTheDocument();
    });

    it('updates a customer-facing service name independently', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        const fetch = installCatalogApi();
        renderApp('/partner/catalogue');

        const categoryHeading = await screen.findByRole('heading', {
            name: 'Wash & Fold',
            level: 2,
        });
        const category = within(categoryHeading.closest('section')!);
        const name = category.getByLabelText('Customer-facing service name');
        await user.clear(name);
        await user.type(name, 'Everyday Laundry');
        await user.click(category.getByRole('button', { name: 'Save service name' }));

        expect(await category.findByText('Saved.')).toBeInTheDocument();
        const patch = fetch.mock.calls.find(
            ([input, init]) =>
                String(input).endsWith('/catalog/categories/cat_wash') && init?.method === 'PATCH'
        );
        expect(patch?.[1]?.body).toBe(JSON.stringify({ name: 'Everyday Laundry' }));
    });

    it('adds an unused canonical service to the catalogue', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        const fetch = installCatalogApi();
        renderApp('/partner/catalogue');

        await user.selectOptions(await screen.findByLabelText('Service type'), 'premium-care');
        const name = screen.getByLabelText('Customer-facing service name', {
            selector: '#new-category-name',
        });
        await user.clear(name);
        await user.type(name, 'Couture Care');
        await user.click(screen.getByRole('button', { name: 'Add service' }));

        expect(
            await screen.findByRole('heading', { name: 'Couture Care', level: 2 })
        ).toBeInTheDocument();
        const post = fetch.mock.calls.find(
            ([input, init]) =>
                String(input).endsWith('/catalog/categories') && init?.method === 'POST'
        );
        expect(post?.[1]?.body).toBe(
            JSON.stringify({ service: 'premium-care', name: 'Couture Care' })
        );
    });

    it('adds a priced item to an existing service', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        const fetch = installCatalogApi();
        renderApp('/partner/catalogue');

        const categoryHeading = await screen.findByRole('heading', {
            name: 'Wash & Fold',
            level: 2,
        });
        const category = within(categoryHeading.closest('section')!);
        await user.click(category.getByText('Add an item', { selector: 'summary' }));
        const creator = within(category.getByText('New catalogue item').closest('form')!);
        await user.type(creator.getByLabelText('Item name'), 'Bedsheet');
        await user.type(creator.getByLabelText('Description (optional)'), 'Cleaned and folded.');
        await user.type(creator.getByLabelText('Price (₹ per piece)'), '59.5');
        expect(creator.getByLabelText('Item name')).toHaveValue('Bedsheet');
        expect(creator.getByLabelText('Price (₹ per piece)')).toHaveValue(59.5);
        await user.click(creator.getByRole('button', { name: 'Add an item' }));

        await waitFor(() =>
            expect(
                fetch.mock.calls.map(([input, init]) => [String(input), init?.method ?? 'GET'])
            ).toContainEqual([
                expect.stringContaining('/catalog/categories/cat_wash/items'),
                'POST',
            ])
        );
        const post = fetch.mock.calls.find(
            ([input, init]) =>
                String(input).endsWith('/catalog/categories/cat_wash/items') &&
                init?.method === 'POST'
        );
        expect(JSON.parse(String(post?.[1]?.body))).toEqual({
            name: 'Bedsheet',
            description: 'Cleaned and folded.',
            price: { amount: 5950, currency: 'INR' },
            isActive: true,
        });
        expect(
            await screen.findByRole('heading', { name: 'Bedsheet', level: 3 })
        ).toBeInTheDocument();
    });

    it('updates item content, rupee pricing and customer availability together', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        const fetch = installCatalogApi();
        renderApp('/partner/catalogue');

        const item = await itemEditor('Shirt');
        const name = item.getByLabelText('Item name');
        await user.clear(name);
        await user.type(name, 'Premium shirt');
        const description = item.getByLabelText('Description (optional)');
        await user.clear(description);
        await user.type(description, 'Pressed and folded.');
        const price = item.getByLabelText('Price (₹ per piece)');
        await user.clear(price);
        await user.type(price, '22.5');
        await user.click(item.getByLabelText('Premium shirt Available to customers'));
        await user.click(item.getByRole('button', { name: 'Save item' }));

        expect(await item.findByText('Saved.')).toBeInTheDocument();
        expect(item.getByText('Hidden')).toBeInTheDocument();
        const patch = fetch.mock.calls.find(
            ([input, init]) =>
                String(input).endsWith('/catalog/items/itm_shirt') && init?.method === 'PATCH'
        );
        expect(JSON.parse(String(patch?.[1]?.body))).toEqual({
            name: 'Premium shirt',
            description: 'Pressed and folded.',
            price: { amount: 2250, currency: 'INR' },
            isActive: false,
        });
    });

    it('validates empty names and malformed prices before making a request', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        const fetch = installCatalogApi();
        renderApp('/partner/catalogue');

        const item = await itemEditor('Shirt');
        const name = item.getByLabelText('Item name');
        await user.clear(name);
        await user.click(item.getByRole('button', { name: 'Save item' }));
        expect(await item.findByRole('alert')).toHaveTextContent('Enter an item name.');
        expect(name).toHaveAttribute('aria-invalid', 'true');
        expect(name).toHaveAccessibleDescription('Enter an item name.');

        await user.type(name, 'Shirt');
        const price = item.getByLabelText('Price (₹ per piece)');
        await user.clear(price);
        await user.click(item.getByRole('button', { name: 'Save item' }));
        expect(await item.findByRole('alert')).toHaveTextContent('Enter a price from');
        expect(price).toHaveAttribute('aria-invalid', 'true');
        expect(price).toHaveAccessibleDescription(/Enter a price from/);
        expect(fetch.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false);
    });

    it('keeps edited values and reports a failed save', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        installCatalogApi({ saveFails: true });
        renderApp('/partner/catalogue');

        const item = await itemEditor('Shirt');
        const name = item.getByLabelText('Item name');
        await user.clear(name);
        await user.type(name, 'Unsaved shirt');
        await user.click(item.getByRole('button', { name: 'Save item' }));

        expect(await item.findByRole('alert')).toHaveTextContent('Item save failed.');
        await waitFor(() => expect(name).not.toBeDisabled());
        expect(name).toHaveValue('Unsaved shirt');
    });

    it('shows the owner-access state and links to adjacent partner tools', async () => {
        authenticateTestUser();
        installCatalogApi({ denied: true });
        renderApp('/partner/catalogue');

        expect(
            await screen.findByRole('heading', { name: 'Laundry-owner access required' })
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Laundry settings' })).toHaveAttribute(
            'href',
            '/partner/settings'
        );
        expect(screen.getByRole('link', { name: 'Order queue' })).toHaveAttribute(
            'href',
            '/partner/orders'
        );
    });
});
