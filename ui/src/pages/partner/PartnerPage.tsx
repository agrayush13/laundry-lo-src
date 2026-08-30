import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AsyncBoundary from '../../common-ui/async-boundary/AsyncBoundary';
import BackLink from '../../common-ui/back-link/BackLink';
import Card from '../../common-ui/card/Card';
import Icon from '../../common-ui/icons/Icon';
import { iconFor } from '../../common-ui/icons/registry';
import Money from '../../common-ui/money/Money';
import PartnerIdentity from '../../common-ui/partner-identity/PartnerIdentity';
import QuantityStepper from '../../common-ui/quantity-stepper/QuantityStepper';
import { ICON_SIZE } from '../../config/brandConfig';
import { CART_COPY } from '../../config/cartConfig';
import { ROUTES } from '../../config/navigationConfig';
import { PARTNER_COPY } from '../../config/partnerConfig';
import { usePartnerMenu } from '../../hooks/usePartnerMenu';
import styles from './partnerPage.module.scss';

const PartnerPage: React.FC = () => {
    const {
        state,
        partner,
        categories,
        itemCount,
        subtotal,
        hasItems,
        cartPartner,
        pendingPartnerSwitch,
        quantityFor,
        changeQuantity,
        cancelPartnerSwitch,
        confirmPartnerSwitch,
        viewCart,
    } = usePartnerMenu();
    const partnerSwitchTrigger = useRef<HTMLButtonElement | null>(null);
    const cartButton = useRef<HTMLButtonElement | null>(null);
    const replaceCartDialog = useRef<HTMLElement | null>(null);
    const focusAfterPartnerSwitch = useRef<'trigger' | 'cart' | null>(null);

    useEffect(() => {
        if (pendingPartnerSwitch || focusAfterPartnerSwitch.current === null) return;

        const target =
            focusAfterPartnerSwitch.current === 'trigger'
                ? partnerSwitchTrigger.current
                : cartButton.current;
        target?.focus();
        focusAfterPartnerSwitch.current = null;
    }, [pendingPartnerSwitch]);

    const cancelSwitch = () => {
        focusAfterPartnerSwitch.current = 'trigger';
        cancelPartnerSwitch();
    };

    const confirmSwitch = () => {
        focusAfterPartnerSwitch.current = 'cart';
        confirmPartnerSwitch();
    };

    const handlePartnerSwitchKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            cancelSwitch();
            return;
        }

        if (event.key !== 'Tab') return;

        const controls =
            replaceCartDialog.current?.querySelectorAll<HTMLButtonElement>(
                'button:not([disabled])'
            );
        if (!controls?.length) return;

        const first = controls[0]!;
        const last = controls[controls.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    // A partner that is gone is not a failed request, and offering Try again
    // for it would be offering to fail identically.
    if (state.error?.code === 'PARTNER_NOT_FOUND') {
        return (
            <div className={styles.partnerPageMissing}>
                <h1>{PARTNER_COPY.notFoundTitle}</h1>
                <p>{PARTNER_COPY.notFoundBody}</p>
                <Link
                    className="button button--primary"
                    to={ROUTES.laundries}
                >
                    {PARTNER_COPY.notFoundAction}
                </Link>
            </div>
        );
    }

    return (
        <AsyncBoundary
            state={state}
            label={PARTNER_COPY.loading}
        >
            {({ partner: loaded }) => (
                <div className={styles.partnerPage}>
                    <div className={styles.partnerPageHero}>
                        {loaded.image && (
                            <img
                                src={loaded.image.url}
                                alt=""
                                aria-hidden="true"
                            />
                        )}
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
                                partner={loaded}
                                size="lg"
                            />
                        </section>

                        {/*
                         * A closed partner's menu is not rendered at all. Every
                         * Add button on it leads to a checkout the partner
                         * cannot honour, and hiding the price list is the only
                         * way to say so before a cart exists.
                         */}
                        {!loaded.isOpen && (
                            <section className={`card ${styles.partnerPageClosed}`}>
                                <h2>{PARTNER_COPY.closedTitle}</h2>
                                <p>{PARTNER_COPY.closedBody}</p>
                                <Link
                                    className="button button--primary"
                                    to={ROUTES.laundries}
                                >
                                    {PARTNER_COPY.closedAction}
                                </Link>
                            </section>
                        )}

                        {loaded.isOpen && categories.length === 0 && (
                            <p className={styles.partnerPageEmpty}>{PARTNER_COPY.emptyCatalogue}</p>
                        )}

                        {loaded.isOpen &&
                            categories.map((category) => (
                                <section
                                    key={category.id}
                                    className={styles.partnerPageCategory}
                                >
                                    <h2 className={styles.partnerPageCategoryName}>
                                        {category.name}
                                    </h2>
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
                                                            name={iconFor(item.iconKey)}
                                                            size={ICON_SIZE.xxl}
                                                        />
                                                    </span>
                                                    <div className={styles.menuBody}>
                                                        <h3 className={styles.menuName}>
                                                            {item.name}
                                                        </h3>
                                                        {item.description && (
                                                            <p className={styles.menuDescription}>
                                                                {item.description}
                                                            </p>
                                                        )}
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
                                                            onChange={(next) =>
                                                                changeQuantity(
                                                                    item,
                                                                    category.name,
                                                                    next
                                                                )
                                                            }
                                                        />
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className={styles.menuAdd}
                                                            aria-label={`${CART_COPY.add} ${label}`}
                                                            onClick={(event) => {
                                                                partnerSwitchTrigger.current =
                                                                    event.currentTarget;
                                                                changeQuantity(
                                                                    item,
                                                                    category.name,
                                                                    1
                                                                );
                                                            }}
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

                    {hasItems && partner && loaded.isOpen && (
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
                                    ref={cartButton}
                                    className="button button--primary"
                                    type="button"
                                    onClick={viewCart}
                                >
                                    {CART_COPY.viewCart}
                                </button>
                            </div>
                        </div>
                    )}

                    {pendingPartnerSwitch && cartPartner && partner && (
                        <div
                            className={styles.replaceCartBackdrop}
                            role="presentation"
                            onKeyDown={handlePartnerSwitchKeyDown}
                        >
                            <section
                                ref={replaceCartDialog}
                                className={`card ${styles.replaceCartDialog}`}
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="replace-cart-title"
                                aria-describedby="replace-cart-description"
                            >
                                <h2 id="replace-cart-title">{PARTNER_COPY.replaceCartTitle}</h2>
                                <p id="replace-cart-description">
                                    {PARTNER_COPY.replaceCartBody}{' '}
                                    <strong>{cartPartner.name}</strong>.{' '}
                                    {PARTNER_COPY.replaceCartHint}
                                </p>
                                <div className={styles.replaceCartActions}>
                                    <button
                                        className="button button--secondary"
                                        type="button"
                                        autoFocus
                                        onClick={cancelSwitch}
                                    >
                                        {PARTNER_COPY.keepCart}
                                    </button>
                                    <button
                                        className="button button--primary"
                                        type="button"
                                        onClick={confirmSwitch}
                                    >
                                        {PARTNER_COPY.replaceCart}
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            )}
        </AsyncBoundary>
    );
};

export default PartnerPage;
