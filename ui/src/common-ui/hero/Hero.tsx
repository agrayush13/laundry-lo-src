import React from 'react';
import { HERO } from '../../config/homeConfig';
import { usePinCodeSearch } from '../../hooks/usePinCodeSearch';
import Icon from '../icons/Icon';
import styles from './hero.module.scss';

const Hero: React.FC = () => {
    const { pinCode, setPinCode, isValid, maxLength, submit } = usePinCodeSearch();

    return (
        <section className={styles.hero}>
            <div className={styles.heroInner}>
                <div>
                    <p className={styles.heroBadge}>
                        <span
                            className={styles.heroBadgeDot}
                            aria-hidden="true"
                        />
                        {HERO.badge}
                    </p>

                    <h1 className={styles.heroTitle}>
                        {HERO.title.before}
                        <span className={styles.heroTitleAccent}>{HERO.title.accent}</span>
                        {HERO.title.after}
                    </h1>

                    <p className={styles.heroSubtitle}>{HERO.subtitle}</p>

                    <form
                        className={styles.heroSearch}
                        onSubmit={submit}
                    >
                        <div className={styles.heroField}>
                            <Icon
                                name="pin"
                                className={styles.heroFieldIcon}
                            />
                            <label
                                className="visually-hidden"
                                htmlFor="pin-code"
                            >
                                {HERO.search.label}
                            </label>
                            <input
                                id="pin-code"
                                name="pinCode"
                                type="text"
                                inputMode="numeric"
                                autoComplete="postal-code"
                                maxLength={maxLength}
                                placeholder={HERO.search.placeholder}
                                value={pinCode}
                                onChange={(event) => setPinCode(event.target.value)}
                            />
                        </div>
                        <button
                            className="button button--primary button--lg"
                            type="submit"
                            disabled={!isValid}
                        >
                            {HERO.search.submit}
                            <Icon name="arrow-right" />
                        </button>
                    </form>

                    <ul className={styles.heroStats}>
                        {HERO.stats.map(({ icon, value, label }) => (
                            <li
                                key={label}
                                className={styles.heroStat}
                            >
                                <Icon
                                    name={icon}
                                    className={styles.heroStatIcon}
                                />
                                <strong>{value}</strong> {label}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={styles.heroMedia}>
                    <img
                        className={styles.heroImage}
                        src={HERO.image.src}
                        alt={HERO.image.alt}
                        loading="eager"
                    />
                    <div className={styles.heroCard}>
                        <span
                            className={styles.heroCardIcon}
                            aria-hidden="true"
                        >
                            <Icon name={HERO.floatingCard.icon} />
                        </span>
                        <span>
                            <strong>{HERO.floatingCard.title}</strong>
                            <em>{HERO.floatingCard.detail}</em>
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
