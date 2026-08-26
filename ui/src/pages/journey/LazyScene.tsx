import React, { Suspense, useRef } from 'react';
import { useLazyScene } from '../../hooks/useLazyScene';
import styles from './lazyScene.module.scss';

interface LazySceneProps {
    children: React.ReactNode;
}

/**
 * Holds a scene's place until it is nearly on screen, then mounts it. The
 * placeholder fills the same space the scene will, so the scrollbar never lies
 * and nothing jumps when a chunk lands.
 *
 * The section's own eyebrow sits outside this boundary, so every phase of the
 * cycle is announced before its scenery has loaded.
 */
const LazyScene: React.FC<LazySceneProps> = ({ children }) => {
    const ref = useRef<HTMLDivElement>(null);
    const shouldMount = useLazyScene(ref);

    return (
        <div
            className={styles.scene}
            ref={ref}
        >
            {shouldMount && <Suspense fallback={null}>{children}</Suspense>}
        </div>
    );
};

export default LazyScene;
