import React from 'react';
import { BRAND, ICON_SIZE } from '../../config/brandConfig';
import { EXTERNAL_LINKS, ROUTES } from '../../config/navigationConfig';
import Icon from '../icons/Icon';
import Logo from '../logo/Logo';
import styles from './footer.module.scss';

const Footer: React.FC = () => (
    <footer className={styles.footer}>
        <div className="container">
            <div className={styles.footerTop}>
                <a
                    className={styles.footerLogoLink}
                    href={ROUTES.home}
                    aria-label={`${BRAND.name} home`}
                >
                    <Logo />
                </a>
                <p className={styles.footerBlurb}>{BRAND.blurb}</p>
                <p className={styles.footerBlurbSecondary}>{BRAND.blurbSecondary}</p>
            </div>

            <div className={styles.footerBottom}>
                <p>
                    © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
                </p>
                <ul className={styles.footerSocial}>
                    {EXTERNAL_LINKS.map(({ label, href, icon }) => (
                        <li key={label}>
                            <a
                                href={href}
                                target="_blank"
                                rel="noreferrer noopener"
                            >
                                {icon && (
                                    <Icon
                                        name={icon}
                                        size={ICON_SIZE.sm}
                                    />
                                )}
                                {label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </footer>
);

export default Footer;
