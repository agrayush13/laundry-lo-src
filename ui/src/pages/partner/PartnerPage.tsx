import React from 'react';
import { Navigate } from 'react-router-dom';
import BackLink from '../../common-ui/back-link/BackLink';
import Card from '../../common-ui/card/Card';
import Icon from '../../common-ui/icons/Icon';
import Money from '../../common-ui/money/Money';
import PartnerIdentity from '../../common-ui/partner-identity/PartnerIdentity';
import QuantityStepper from '../../common-ui/quantity-stepper/QuantityStepper';
import { ICON_SIZE } from '../../config/brandConfig';
import { CART_COPY } from '../../config/cartConfig';
import { ROUTES } from '../../config/navigationConfig';
import { PARTNER_MENU } from '../../data/menu';
import { usePartnerMenu } from '../../hooks/usePartnerMenu';
import styles from './partnerPage.module.scss';

const PartnerPage: React.FC = () => {
    const { partner, itemCount, subtotal, hasItems, quantityFor, changeQuantity, viewCart } =
        usePartnerMenu();

    if (!partner) {
        return (
            <Navigate
                to={ROUTES.laundries}
                replace
            />
        );
    }

    return (
        <div className={styles.partnerPage}>
            <div className={styles.partnerPageHero}>
                <img
                    src={partner.image.url}
                    alt=""
                    aria-hidden="true"
                />
                <div className={styles.partnerPageBack}>
                    <BackLink
                        label={CART_COPY.back}
                        to={ROUTES.laundries}
                        tone="onImage"
                    />
                </div>
            </div>

            <div className={styles.partnerPageInner}>
                <section className={`card ${styles.partnerPageSummary}`}>
                    <PartnerIdentity
                        partner={partner}
                        size="lg"
                    />
                </section>

                {PARTNER_MENU.map((category) => (
                    <section
                        key={category.id}
                        className={styles.partnerPageCategory}
                    >
                        <h2 className={styles.partnerPageCategoryName}>{category.name}</h2>
                        <ul className={styles.menu}>
                            {category.items.map((item) => {
                                const quantity = quantityFor(item);
                                // The same garment appears under several services, so the
                                // visible name alone is not a unique accessible name.
                                const label = `${item.name}, ${category.name}`;

                                return (
                                    <Card
                                        as="li"
                                        className={styles.menuItem}
                                        key={item.id}
                                    >
                                        <span
                                            className={styles.menuIcon}
                                            aria-hidden="true"
                                        >
                                            <Icon
                                                name={item.iconKey}
                                                size={ICON_SIZE.xxl}
                                            />
                                        </span>
                                        <div className={styles.menuBody}>
                                            <h3 className={styles.menuName}>{item.name}</h3>
                                            <p className={styles.menuDescription}>
                                                {item.description}
                                            </p>
                                            <p className={styles.menuPrice}>
                                                <Money value={item.price} />{' '}
                                                <em>
                                                    {CART_COPY.perPrefix} {item.unit}
                                                </em>
                                            </p>
                                        </div>

                                        {quantity > 0 ? (
                                            <QuantityStepper
                                                label={label}
                                                quantity={quantity}
                                                onChange={(next) => changeQuantity(item, next)}
                                            />
                                        ) : (
                                            <button
                                                type="button"
                                                className={styles.menuAdd}
                                                aria-label={`${CART_COPY.add} ${label}`}
                                                onClick={() => changeQuantity(item, 1)}
                                            >
                                                <Icon
                                                    name="plus"
                                                    size={ICON_SIZE.sm}
                                                />
                                                {CART_COPY.add}
                                            </button>
                                        )}
                                    </Card>
                                );
                            })}
                        </ul>
                    </section>
                ))}
            </div>

            {hasItems && (
                <div className={styles.cartBar}>
                    <div className={styles.cartBarInner}>
                        <span
                            className={styles.cartBarIcon}
                            aria-hidden="true"
                        >
                            <Icon
                                name="cart"
                                size={ICON_SIZE.lg}
                            />
                        </span>
                        <p className={styles.cartBarSummary}>
                            <strong>
                                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </strong>
                            <span>
                                <Money value={subtotal} />
                            </span>
                        </p>
                        <button
                            className="button button--primary"
                            type="button"
                            onClick={viewCart}
                        >
                            {CART_COPY.viewCart}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerPage;
