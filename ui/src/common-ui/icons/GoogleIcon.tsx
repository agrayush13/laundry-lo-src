import React from 'react';

/**
 * Brand mark, kept hand-written: Lucide (correctly) ships no third-party
 * logos, and Google's mark is multi-colour so it can't use currentColor.
 */
const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        viewBox="0 0 24 24"
        width={20}
        height={20}
        aria-hidden
        focusable="false"
        {...props}
    >
        <path
            fill="#4285F4"
            d="M21.6 12.2c0-.7-.06-1.35-.18-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z"
        />
        <path
            fill="#34A853"
            d="M12 22c2.7 0 4.96-.9 6.6-2.4l-3.2-2.5c-.9.6-2.05.95-3.4.95-2.6 0-4.8-1.75-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
        />
        <path
            fill="#FBBC05"
            d="M6.4 13.95a6 6 0 0 1 0-3.85V7.5H3.1a10 10 0 0 0 0 9l3.3-2.55Z"
        />
        <path
            fill="#EA4335"
            d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.84-2.84C16.95 2.99 14.7 2 12 2a10 10 0 0 0-8.9 5.5l3.3 2.6C7.2 7.7 9.4 5.95 12 5.95Z"
        />
    </svg>
);

export default GoogleIcon;
