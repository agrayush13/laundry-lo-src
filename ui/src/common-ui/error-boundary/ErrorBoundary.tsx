import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    /** Rendered in place of the subtree when it throws. */
    fallback: (retry: () => void) => ReactNode;
    /** Change this to clear a caught error - pass the route, for example. */
    resetKey?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

/**
 * Catches render-time errors so a single broken subtree cannot blank the whole
 * page. Must be a class - React exposes no hook equivalent.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidUpdate(previous: ErrorBoundaryProps) {
        // Navigating away should clear the error rather than strand the user.
        if (this.state.hasError && previous.resetKey !== this.props.resetKey) {
            this.setState({ hasError: false });
        }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // Until an error reporter exists, the console is the record.
        console.error('Unhandled render error:', error, info.componentStack);
    }

    retry = () => this.setState({ hasError: false });

    render() {
        if (this.state.hasError) {
            return this.props.fallback(this.retry);
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
