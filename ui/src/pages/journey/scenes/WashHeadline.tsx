import React from 'react';
import { HeadlineSegment, WASH } from '../../../config/cycleConfig';
import GarmentGlyph from '../glyphs/GarmentGlyph';
import styles from './washHeadline.module.scss';

/**
 * Every letter is its own element, because the wash takes them one at a time.
 * Each carries the ink it shows at rest and the cloth scrap it becomes once it
 * has tumbled past the point where a letter still reads as a letter.
 */
const Letter: React.FC<{ children: React.ReactNode; glyph?: string }> = ({ children, glyph }) => (
    <span
        className={styles.letter}
        data-wash="letter"
        data-glyph={glyph}
    >
        <span
            className={styles.letterInk}
            data-wash="ink"
        >
            {children}
        </span>
        <span
            className={styles.letterScrap}
            data-wash="scrap"
            aria-hidden="true"
        />
    </span>
);

const renderSegment = (segment: HeadlineSegment, key: string) => {
    if (segment.glyph) {
        return (
            <Letter
                glyph={segment.glyph}
                key={key}
            >
                {/* The letter the garment stands in for, for anyone not looking. */}
                <span className="visually-hidden">{segment.text}</span>
                <span aria-hidden="true">
                    <GarmentGlyph name={segment.glyph} />
                </span>
            </Letter>
        );
    }

    return Array.from(segment.text).map((character, index) => (
        <Letter key={`${key}-${index}`}>{character}</Letter>
    ));
};

/**
 * The problem, and the answer to it, in the same place on the page. The answer
 * is silent until the water beat, and both are plain static text before any of
 * that: this is the largest thing on the first screen and it paints with the
 * document.
 */
const WashHeadline: React.FC = () => (
    <div className={styles.stack}>
        <h1
            className={styles.headline}
            data-wash="headline"
        >
            {WASH.headline.map((line, lineIndex) => (
                <span
                    className={styles.line}
                    data-wash="line"
                    key={line.map((segment) => segment.text).join('')}
                >
                    {line.map((segment, index) => renderSegment(segment, `${lineIndex}-${index}`))}
                </span>
            ))}
        </h1>

        <p
            className={styles.clean}
            data-wash="clean"
        >
            {WASH.cleanHeadline.map((word) => (
                <span
                    className={word.accent ? styles.cleanAccent : undefined}
                    data-wash="clean-word"
                    key={word.text}
                >
                    {word.text}{' '}
                </span>
            ))}
        </p>
    </div>
);

export default WashHeadline;
