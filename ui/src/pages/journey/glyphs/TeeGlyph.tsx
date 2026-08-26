import React from 'react';
import { TEE } from './garmentPaths';
import styles from './glyphs.module.scss';

/**
 * The "t" of "lost", built on a t's skeleton: the sleeves are the crossbar and
 * they sit at the crossbar's real height, the body is the stem, and the hem
 * lands on the baseline. Read at a squint it is a letter; read again it is a
 * stained t-shirt. It returns clean in the dry section, drawn from the same
 * geometry.
 */
const TeeGlyph: React.FC = () => (
    <svg
        className={`${styles.glyph} ${styles.tee}`}
        viewBox={`0 0 ${TEE.width} ${TEE.height}`}
        aria-hidden="true"
        focusable="false"
    >
        <path d={TEE.sleeveLeft} />
        <path d={TEE.sleeveRight} />
        <path d={TEE.body} />
        <ellipse
            className={styles.stain}
            {...TEE.stain}
        />
    </svg>
);

export default TeeGlyph;
