import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import ErrorBoundary from '../common-ui/error-boundary/ErrorBoundary';
import ErrorFallback from '../common-ui/error-boundary/ErrorFallback';

const Boom: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
    if (shouldThrow) {
        throw new Error('boom');
    }
    return <p>Recovered content</p>;
};

const renderBoundary = (ui: React.ReactNode, resetKey?: string) =>
    render(
        <MemoryRouter>
            <ErrorBoundary
                resetKey={resetKey}
                fallback={(retry) => <ErrorFallback onRetry={retry} />}
            >
                {ui}
            </ErrorBoundary>
        </MemoryRouter>
    );

describe('ErrorBoundary', () => {
    // React logs caught errors; silence it so the run stays readable.
    let consoleError: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => consoleError.mockRestore());

    it('renders children when nothing throws', () => {
        renderBoundary(<Boom shouldThrow={false} />);
        expect(screen.getByText('Recovered content')).toBeInTheDocument();
    });

    it('shows the fallback instead of unmounting the tree', () => {
        renderBoundary(<Boom shouldThrow />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    });

    it('recovers when the user retries', async () => {
        const user = userEvent.setup();

        const Harness: React.FC = () => {
            const [shouldThrow, setShouldThrow] = useState(true);
            return (
                <ErrorBoundary
                    fallback={(retry) => (
                        <ErrorFallback
                            onRetry={() => {
                                setShouldThrow(false);
                                retry();
                            }}
                        />
                    )}
                >
                    <Boom shouldThrow={shouldThrow} />
                </ErrorBoundary>
            );
        };

        render(
            <MemoryRouter>
                <Harness />
            </MemoryRouter>
        );
        expect(screen.getByRole('alert')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Try again' }));
        expect(screen.getByText('Recovered content')).toBeInTheDocument();
    });

    it('clears the error when the route changes', () => {
        const { rerender } = renderBoundary(<Boom shouldThrow />, '/first');
        expect(screen.getByRole('alert')).toBeInTheDocument();

        rerender(
            <MemoryRouter>
                <ErrorBoundary
                    resetKey="/second"
                    fallback={(retry) => <ErrorFallback onRetry={retry} />}
                >
                    <Boom shouldThrow={false} />
                </ErrorBoundary>
            </MemoryRouter>
        );
        expect(screen.getByText('Recovered content')).toBeInTheDocument();
    });
});
