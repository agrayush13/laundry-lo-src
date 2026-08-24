import React from 'react';

type CardElement = 'div' | 'article' | 'section' | 'label' | 'li';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
    /** The element to render; the surface is presentational, not semantic. */
    as?: CardElement;
    children: React.ReactNode;
}

/** The raised, bordered surface used for every panel in the app. */
const Card: React.FC<CardProps> = ({ as: Element = 'div', className, children, ...rest }) => (
    <Element
        className={['card', className].filter(Boolean).join(' ')}
        {...rest}
    >
        {children}
    </Element>
);

export default Card;
