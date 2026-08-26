import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackLink from '../../common-ui/back-link/BackLink';
import Card from '../../common-ui/card/Card';
import Icon from '../../common-ui/icons/Icon';
import Money from '../../common-ui/money/Money';
import { ICON_SIZE } from '../../config/brandConfig';
import { PLUS_COPY } from '../../config/cartConfig';
import { MEMBERSHIP_SECTION } from '../../config/membershipConfig';
import { ROUTES } from '../../config/navigationConfig';
import { useCart } from '../../context/CartContext';
import styles from './plusPage.module.scss';

const { planName, subtitle, card, benefits } = MEMBERSHIP_SECTION;

const PlusPage: React.FC = () => {
    const navigate = useNavigate();
    const { hasPlus, setPlus } = useCart();

    const handleAdd = () => {
        setPlus(true);
        navigate(ROUTES.cart);
    };

    return (
        <div className={styles.plus}>
            <div className={styles.plusInner}>
                <BackLink
                    label={PLUS_COPY.back}
                    to={ROUTES.home}
                />

                <span className={styles.plusCrown}>
                    <Icon
                        name="crown"
                        size={ICON_SIZE.xxl}
                    />
                </span>
                <h1 className={styles.plusTitle}>{planName}</h1>
                <p className={styles.plusSubtitle}>{subtitle}</p>

                <Card className={styles.plusPrice}>
                    <p className={styles.plusAmount}>
                        <Money value={card.price} />
                        <span>{card.period}</span>
                    </p>
                    <p className={styles.plusTagline}>{card.tagline}</p>

                    {hasPlus ? (
                        <p className={styles.plusAdded}>
                            <Icon
                                name="check-circle"
                                size={ICON_SIZE.sm}
                            />
                            {PLUS_COPY.alreadyAdded}
                        </p>
                    ) : (
                        <button
                            className="button button--primary"
                            type="button"
                            onClick={handleAdd}
                        >
                            <Icon
                                name="crown"
                                size={ICON_SIZE.md}
                            />
                            {card.cta}
                        </button>
                    )}
                </Card>

                <h2 className={styles.plusBenefitsTitle}>{PLUS_COPY.benefitsTitle}</h2>
                <ul className={styles.plusBenefits}>
                    {benefits.map(({ icon, title, description }) => (
                        <Card
                            as="li"
                            key={title}
                            className={styles.plusBenefit}
                        >
                            <span className={styles.plusBenefitIcon}>
                                <Icon
                                    name={icon}
                                    size={ICON_SIZE.lg}
                                />
                            </span>
                            <h3 className={styles.plusBenefitTitle}>{title}</h3>
                            <p className={styles.plusBenefitBody}>{description}</p>
                        </Card>
                    ))}
                </ul>

                <p className={styles.plusNote}>{PLUS_COPY.note}</p>
            </div>
        </div>
    );
};

export default PlusPage;
