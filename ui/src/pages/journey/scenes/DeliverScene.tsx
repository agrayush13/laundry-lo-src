import React from 'react';
import Logo from '../../../common-ui/logo/Logo';
import PinCodeSearch from '../../../common-ui/pin-code-search/PinCodeSearch';
import { BRAND } from '../../../config/brandConfig';
import { DELIVER, WASH } from '../../../config/cycleConfig';
import { CYCLE_FOOTER_LINKS } from '../../../config/navigationConfig';
import { useDeliver } from '../../../hooks/useDeliver';
import DeliveryBox from './DeliveryBox';
import styles from './deliverScene.module.scss';

/**
 * The cycle completes, and the page makes its one ask a second time. The footer
 * lives here rather than under the page because delivery is the last phase, not
 * an afterthought bolted below it.
 */
const DeliverScene: React.FC = () => {
    // The scene starts its own choreography: it is lazy, and a hook that ran
    // with the page would find none of this markup.
    useDeliver();

    return (
        <div className={styles.deliver}>
            <div className={styles.deliverScene}>
                <div
                    className={styles.deliverCopy}
                    data-deliver="signoff"
                >
                    <h2 className={styles.deliverTitle}>{DELIVER.title}</h2>
                    <p className={styles.deliverSubtitle}>{DELIVER.subtitle}</p>
                    <PinCodeSearch />
                </div>

                <div className={styles.deliverBox}>
                    <DeliveryBox />
                </div>

                <a
                    className={styles.deliverTag}
                    data-deliver="tag"
                    href={DELIVER.tag.href}
                    target="_blank"
                    rel="noreferrer noopener"
                >
                    {DELIVER.tag.label}
                    <span aria-hidden="true">↗</span>
                </a>
            </div>

            {/* The page's only divider, and it earns its place: the cycle has ended. */}
            <footer className={styles.deliverFooter}>
                <div className={styles.deliverFooterTop}>
                    <Logo />
                    <nav
                        className={styles.deliverLinks}
                        aria-label="Footer"
                    >
                        {CYCLE_FOOTER_LINKS.map(({ label, href }) => (
                            <a
                                href={href}
                                key={label}
                            >
                                {label}
                            </a>
                        ))}
                    </nav>
                </div>

                <div className={styles.deliverFooterBottom}>
                    <p className={styles.deliverDisclaimer}>{DELIVER.disclaimer}</p>
                    <p className={styles.deliverCopyright}>
                        © {new Date().getFullYear()} {BRAND.name}
                        <a href={`#${WASH.meta.id}`}>{DELIVER.backToStart}</a>
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default DeliverScene;
