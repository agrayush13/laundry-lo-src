import React from 'react';

interface SectionHeadProps {
    title: React.ReactNode;
    subtitle: string;
    /** Rendered above the title, e.g. the membership eyebrow. */
    eyebrow?: React.ReactNode;
}

const SectionHead: React.FC<SectionHeadProps> = ({ title, subtitle, eyebrow }) => (
    <header className="section__head">
        {eyebrow}
        <h2 className="section__title">{title}</h2>
        <p className="section__subtitle">{subtitle}</p>
    </header>
);

export default SectionHead;
