import React from 'react';
import AsyncBoundary from '../../common-ui/async-boundary/AsyncBoundary';
import BackLink from '../../common-ui/back-link/BackLink';
import Icon from '../../common-ui/icons/Icon';
import { ICON_SIZE } from '../../config/brandConfig';
import {
    LISTING_COPY,
    SortKey,
    TAG_LABELS,
    TAG_SLUGS,
    availableSortOptions,
} from '../../config/listingConfig';
import { ROUTES } from '../../config/navigationConfig';
import { usePartnerListing } from '../../hooks/usePartnerListing';
import MapPlaceholder from './MapPlaceholder';
import PartnerCard from './PartnerCard';
import styles from './servicesPage.module.scss';

const ServicesPage: React.FC = () => {
    const {
        pinCode,
        serviceName,
        clearService,
        state,
        partners,
        hasMore,
        isLoadingMore,
        moreError,
        loadMore,
        sortKey,
        setSortKey,
        isTagActive,
        toggleTag,
        activeCount,
        clearTags,
    } = usePartnerListing();

    return (
        <div className={styles.listing}>
            <div className="container">
                <BackLink
                    label={LISTING_COPY.back}
                    to={ROUTES.home}
                    spacing="lg"
                />

                <h1 className={styles.listingTitle}>
                    {LISTING_COPY.titlePrefix}{' '}
                    <span className={styles.listingPin}>
                        {pinCode || LISTING_COPY.titleFallback}
                    </span>
                </h1>
                {/* Counting is something only a loaded page can do honestly. */}
                <p className={styles.listingCount}>
                    {state.data &&
                        `${partners.length} ${partners.length === 1 ? 'partner' : 'partners'} ${
                            LISTING_COPY.countSuffix
                        }`}
                </p>

                <div className={styles.listingToolbar}>
                    <div className={styles.listingFilters}>
                        <span className={styles.listingFiltersLabel}>
                            <Icon
                                name="filter"
                                size={ICON_SIZE.sm}
                            />
                            {LISTING_COPY.filtersLabel}
                        </span>
                        {activeCount > 0 && (
                            <button
                                type="button"
                                className={styles.listingClear}
                                onClick={clearTags}
                            >
                                {LISTING_COPY.clearFilters}
                            </button>
                        )}
                        {serviceName && (
                            <button
                                type="button"
                                className={styles.listingChip}
                                aria-pressed="true"
                                aria-label={`${serviceName}. ${LISTING_COPY.clearService}`}
                                onClick={clearService}
                            >
                                {serviceName}
                                <span aria-hidden="true">×</span>
                            </button>
                        )}
                        {TAG_SLUGS.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                className={styles.listingChip}
                                aria-pressed={isTagActive(tag)}
                                onClick={() => toggleTag(tag)}
                            >
                                {TAG_LABELS[tag]}
                            </button>
                        ))}
                    </div>

                    <label className={styles.listingSort}>
                        <span className="visually-hidden">{LISTING_COPY.sortLabel}</span>
                        <select
                            value={sortKey}
                            onChange={(event) => setSortKey(event.target.value as SortKey)}
                        >
                            {availableSortOptions(Boolean(pinCode)).map(({ value, label }) => (
                                <option
                                    key={value}
                                    value={value}
                                >
                                    {LISTING_COPY.sortPrefix} {label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className={styles.listingLayout}>
                    <AsyncBoundary
                        state={state}
                        label={LISTING_COPY.loading}
                        isEmpty={() => partners.length === 0}
                        empty={
                            <p className={styles.listingEmpty}>
                                {pinCode && activeCount === 0 && !serviceName
                                    ? LISTING_COPY.emptyForPin
                                    : LISTING_COPY.empty}
                            </p>
                        }
                    >
                        {() => (
                            <div>
                                <ul className={styles.listingResults}>
                                    {partners.map((partner) => (
                                        <li key={partner.id}>
                                            <PartnerCard partner={partner} />
                                        </li>
                                    ))}
                                </ul>

                                {hasMore && (
                                    <div className={styles.listingMore}>
                                        {moreError && (
                                            <p
                                                className={styles.listingMoreError}
                                                role="alert"
                                            >
                                                {moreError}
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            className="button button--secondary"
                                            onClick={loadMore}
                                            disabled={isLoadingMore}
                                        >
                                            {isLoadingMore
                                                ? LISTING_COPY.showingMore
                                                : LISTING_COPY.showMore}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </AsyncBoundary>

                    <MapPlaceholder pinCount={partners.length} />
                </div>
            </div>
        </div>
    );
};

export default ServicesPage;
