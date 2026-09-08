import React from 'react';
import { Link } from 'react-router-dom';
import AsyncBoundary from '../../common-ui/async-boundary/AsyncBoundary';
import Icon from '../../common-ui/icons/Icon';
import { iconFor } from '../../common-ui/icons/registry';
import { ICON_SIZE } from '../../config/brandConfig';
import { ROUTES } from '../../config/navigationConfig';
import { PARTNER_CATALOG_COPY, partnerServiceLabel } from '../../config/partnerCatalogConfig';
import { usePartnerCatalog } from '../../hooks/usePartnerCatalog';
import PartnerAccessRequired from './PartnerAccessRequired';
import styles from './partnerPortal.module.scss';

const PartnerCatalogPage: React.FC = () => {
    const catalog = usePartnerCatalog();

    return (
        <div className={styles.portalPage}>
            <div className={styles.settingsInner}>
                <header className={styles.settingsHead}>
                    <div className={styles.portalHead}>
                        <p className="eyebrow">{PARTNER_CATALOG_COPY.eyebrow}</p>
                        <h1>{PARTNER_CATALOG_COPY.title}</h1>
                        <p>{PARTNER_CATALOG_COPY.intro}</p>
                    </div>
                    <nav
                        className={styles.portalActions}
                        aria-label={PARTNER_CATALOG_COPY.portalNavigation}
                    >
                        <Link
                            className={`button ${styles.secondaryAction}`}
                            to={ROUTES.partnerSettings}
                        >
                            {PARTNER_CATALOG_COPY.settingsLink}
                        </Link>
                        <Link
                            className={`button ${styles.secondaryAction}`}
                            to={ROUTES.partnerOrders}
                        >
                            {PARTNER_CATALOG_COPY.ordersLink}
                        </Link>
                    </nav>
                </header>

                {catalog.laundriesState.error?.code === 'FORBIDDEN' ? (
                    <PartnerAccessRequired />
                ) : (
                    <AsyncBoundary
                        state={catalog.laundriesState}
                        label={PARTNER_CATALOG_COPY.loading}
                    >
                        {() => (
                            <>
                                {catalog.laundries.length > 1 && (
                                    <div className={styles.locationPicker}>
                                        <label htmlFor="partner-catalog-location">
                                            {PARTNER_CATALOG_COPY.locationLabel}
                                        </label>
                                        <select
                                            id="partner-catalog-location"
                                            value={catalog.selectedId ?? ''}
                                            onChange={(event) =>
                                                catalog.selectLaundry(event.target.value)
                                            }
                                            disabled={catalog.savingKey !== null}
                                        >
                                            {catalog.laundries.map((laundry) => (
                                                <option
                                                    key={laundry.id}
                                                    value={laundry.id}
                                                >
                                                    {laundry.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <p className={`card ${styles.catalogNote}`}>
                                    <Icon
                                        name="shield"
                                        size={ICON_SIZE.sm}
                                    />
                                    {PARTNER_CATALOG_COPY.preservationNote}
                                </p>

                                <AsyncBoundary
                                    state={catalog.catalogState}
                                    label={PARTNER_CATALOG_COPY.loading}
                                    isEmpty={(categories) => categories.length === 0}
                                    empty={
                                        <section className={`card ${styles.emptyState}`}>
                                            <Icon name="receipt" />
                                            <h2>{PARTNER_CATALOG_COPY.emptyTitle}</h2>
                                            <p>{PARTNER_CATALOG_COPY.emptyBody}</p>
                                        </section>
                                    }
                                >
                                    {(categories) => (
                                        <div className={styles.catalogCategories}>
                                            {categories.map((category) => {
                                                const categoryKey = `category:${category.id}`;
                                                const categoryFeedbackId = `${category.id}-feedback`;
                                                const categoryDraft =
                                                    catalog.categoryDrafts[category.id];
                                                if (!categoryDraft) return null;

                                                return (
                                                    <section
                                                        className={`card ${styles.catalogCategory}`}
                                                        key={category.id}
                                                    >
                                                        <header
                                                            className={styles.catalogCategoryHead}
                                                        >
                                                            <div>
                                                                <p>
                                                                    {partnerServiceLabel(
                                                                        category.service
                                                                    )}
                                                                </p>
                                                                <h2>{categoryDraft.name}</h2>
                                                            </div>
                                                            <span>
                                                                {category.items.length}{' '}
                                                                {category.items.length === 1
                                                                    ? PARTNER_CATALOG_COPY.itemSingular
                                                                    : PARTNER_CATALOG_COPY.itemPlural}
                                                            </span>
                                                        </header>

                                                        <div className={styles.categoryEditor}>
                                                            <p className={styles.formField}>
                                                                <label
                                                                    htmlFor={`${category.id}-name`}
                                                                >
                                                                    {
                                                                        PARTNER_CATALOG_COPY.categoryName
                                                                    }
                                                                </label>
                                                                <input
                                                                    id={`${category.id}-name`}
                                                                    value={categoryDraft.name}
                                                                    required
                                                                    maxLength={80}
                                                                    aria-invalid={
                                                                        catalog.invalidFields[
                                                                            categoryKey
                                                                        ] === 'name'
                                                                    }
                                                                    aria-describedby={
                                                                        catalog.errors[categoryKey]
                                                                            ? categoryFeedbackId
                                                                            : undefined
                                                                    }
                                                                    onChange={(event) =>
                                                                        catalog.updateCategoryName(
                                                                            category.id,
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                />
                                                            </p>
                                                            <button
                                                                className={`button ${styles.secondaryAction}`}
                                                                type="button"
                                                                disabled={
                                                                    catalog.savingKey !== null
                                                                }
                                                                onClick={() =>
                                                                    void catalog.saveCategory(
                                                                        category.id
                                                                    )
                                                                }
                                                            >
                                                                {catalog.savingKey === categoryKey
                                                                    ? PARTNER_CATALOG_COPY.saving
                                                                    : PARTNER_CATALOG_COPY.saveCategory}
                                                            </button>
                                                            <div
                                                                id={categoryFeedbackId}
                                                                className={styles.saveMessage}
                                                                aria-live="polite"
                                                            >
                                                                {catalog.errors[categoryKey] && (
                                                                    <p
                                                                        data-error="true"
                                                                        role="alert"
                                                                    >
                                                                        {
                                                                            catalog.errors[
                                                                                categoryKey
                                                                            ]
                                                                        }
                                                                    </p>
                                                                )}
                                                                {catalog.successKey ===
                                                                    categoryKey && (
                                                                    <p>
                                                                        {PARTNER_CATALOG_COPY.saved}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <ul className={styles.catalogItems}>
                                                            {category.items.map((item) => {
                                                                const itemKey = `item:${item.id}`;
                                                                const itemFeedbackId = `${item.id}-feedback`;
                                                                const draft =
                                                                    catalog.itemDrafts[item.id];
                                                                if (!draft) return null;

                                                                return (
                                                                    <li
                                                                        key={item.id}
                                                                        data-active={draft.isActive}
                                                                    >
                                                                        <header>
                                                                            <span
                                                                                className={
                                                                                    styles.menuIcon
                                                                                }
                                                                                aria-hidden="true"
                                                                            >
                                                                                <Icon
                                                                                    name={iconFor(
                                                                                        item.iconKey
                                                                                    )}
                                                                                    size={
                                                                                        ICON_SIZE.lg
                                                                                    }
                                                                                />
                                                                            </span>
                                                                            <div>
                                                                                <h3>
                                                                                    {draft.name}
                                                                                </h3>
                                                                                <p>
                                                                                    {draft.isActive
                                                                                        ? PARTNER_CATALOG_COPY.active
                                                                                        : PARTNER_CATALOG_COPY.inactive}
                                                                                </p>
                                                                            </div>
                                                                        </header>

                                                                        <div
                                                                            className={
                                                                                styles.itemEditor
                                                                            }
                                                                        >
                                                                            <p
                                                                                className={
                                                                                    styles.formField
                                                                                }
                                                                            >
                                                                                <label
                                                                                    htmlFor={`${item.id}-name`}
                                                                                >
                                                                                    {
                                                                                        PARTNER_CATALOG_COPY.itemName
                                                                                    }
                                                                                </label>
                                                                                <input
                                                                                    id={`${item.id}-name`}
                                                                                    value={
                                                                                        draft.name
                                                                                    }
                                                                                    required
                                                                                    maxLength={120}
                                                                                    aria-invalid={
                                                                                        catalog
                                                                                            .invalidFields[
                                                                                            itemKey
                                                                                        ] === 'name'
                                                                                    }
                                                                                    aria-describedby={
                                                                                        catalog
                                                                                            .errors[
                                                                                            itemKey
                                                                                        ]
                                                                                            ? itemFeedbackId
                                                                                            : undefined
                                                                                    }
                                                                                    onChange={(
                                                                                        event
                                                                                    ) =>
                                                                                        catalog.updateItem(
                                                                                            item.id,
                                                                                            {
                                                                                                name: event
                                                                                                    .target
                                                                                                    .value,
                                                                                            }
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </p>
                                                                            <p
                                                                                className={`${styles.formField} ${styles.itemDescription}`}
                                                                            >
                                                                                <label
                                                                                    htmlFor={`${item.id}-description`}
                                                                                >
                                                                                    {
                                                                                        PARTNER_CATALOG_COPY.description
                                                                                    }
                                                                                </label>
                                                                                <input
                                                                                    id={`${item.id}-description`}
                                                                                    value={
                                                                                        draft.description
                                                                                    }
                                                                                    maxLength={500}
                                                                                    aria-describedby={
                                                                                        catalog
                                                                                            .errors[
                                                                                            itemKey
                                                                                        ]
                                                                                            ? itemFeedbackId
                                                                                            : undefined
                                                                                    }
                                                                                    onChange={(
                                                                                        event
                                                                                    ) =>
                                                                                        catalog.updateItem(
                                                                                            item.id,
                                                                                            {
                                                                                                description:
                                                                                                    event
                                                                                                        .target
                                                                                                        .value,
                                                                                            }
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </p>
                                                                            <p
                                                                                className={
                                                                                    styles.formField
                                                                                }
                                                                            >
                                                                                <label
                                                                                    htmlFor={`${item.id}-price`}
                                                                                >
                                                                                    {
                                                                                        PARTNER_CATALOG_COPY.price
                                                                                    }
                                                                                </label>
                                                                                <input
                                                                                    id={`${item.id}-price`}
                                                                                    type="number"
                                                                                    value={
                                                                                        draft.priceRupees
                                                                                    }
                                                                                    required
                                                                                    min={0}
                                                                                    max={1_000_000}
                                                                                    step="0.01"
                                                                                    inputMode="decimal"
                                                                                    aria-invalid={
                                                                                        catalog
                                                                                            .invalidFields[
                                                                                            itemKey
                                                                                        ] ===
                                                                                        'price'
                                                                                    }
                                                                                    aria-describedby={
                                                                                        catalog
                                                                                            .errors[
                                                                                            itemKey
                                                                                        ]
                                                                                            ? itemFeedbackId
                                                                                            : undefined
                                                                                    }
                                                                                    onChange={(
                                                                                        event
                                                                                    ) =>
                                                                                        catalog.updateItem(
                                                                                            item.id,
                                                                                            {
                                                                                                priceRupees:
                                                                                                    event
                                                                                                        .target
                                                                                                        .value,
                                                                                            }
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </p>
                                                                            <label
                                                                                className={
                                                                                    styles.catalogAvailability
                                                                                }
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    aria-label={`${draft.name} ${PARTNER_CATALOG_COPY.available}`}
                                                                                    checked={
                                                                                        draft.isActive
                                                                                    }
                                                                                    onChange={(
                                                                                        event
                                                                                    ) =>
                                                                                        catalog.updateItem(
                                                                                            item.id,
                                                                                            {
                                                                                                isActive:
                                                                                                    event
                                                                                                        .target
                                                                                                        .checked,
                                                                                            }
                                                                                        )
                                                                                    }
                                                                                />
                                                                                {
                                                                                    PARTNER_CATALOG_COPY.available
                                                                                }
                                                                            </label>
                                                                        </div>

                                                                        <footer
                                                                            className={
                                                                                styles.itemActions
                                                                            }
                                                                        >
                                                                            <button
                                                                                className="button button--primary"
                                                                                type="button"
                                                                                disabled={
                                                                                    catalog.savingKey !==
                                                                                    null
                                                                                }
                                                                                onClick={() =>
                                                                                    void catalog.saveItem(
                                                                                        item.id
                                                                                    )
                                                                                }
                                                                            >
                                                                                {catalog.savingKey ===
                                                                                itemKey
                                                                                    ? PARTNER_CATALOG_COPY.saving
                                                                                    : PARTNER_CATALOG_COPY.saveItem}
                                                                            </button>
                                                                            <div
                                                                                id={itemFeedbackId}
                                                                                className={
                                                                                    styles.saveMessage
                                                                                }
                                                                                aria-live="polite"
                                                                            >
                                                                                {catalog.errors[
                                                                                    itemKey
                                                                                ] && (
                                                                                    <p
                                                                                        data-error="true"
                                                                                        role="alert"
                                                                                    >
                                                                                        {
                                                                                            catalog
                                                                                                .errors[
                                                                                                itemKey
                                                                                            ]
                                                                                        }
                                                                                    </p>
                                                                                )}
                                                                                {catalog.successKey ===
                                                                                    itemKey && (
                                                                                    <p>
                                                                                        {
                                                                                            PARTNER_CATALOG_COPY.saved
                                                                                        }
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </footer>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </section>
                                                );
                                            })}
                                        </div>
                                    )}
                                </AsyncBoundary>
                            </>
                        )}
                    </AsyncBoundary>
                )}
            </div>
        </div>
    );
};

export default PartnerCatalogPage;
