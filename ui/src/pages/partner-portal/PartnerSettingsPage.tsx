import React from 'react';
import { Link } from 'react-router-dom';
import AsyncBoundary from '../../common-ui/async-boundary/AsyncBoundary';
import { ROUTES } from '../../config/navigationConfig';
import { PARTNER_SETTINGS_COPY, WEEKDAYS } from '../../config/partnerSettingsConfig';
import { usePartnerSettings } from '../../hooks/usePartnerSettings';
import { todayInPartnerTimezone } from '../../utils/datesUtils';
import PartnerAccessRequired from './PartnerAccessRequired';
import styles from './partnerPortal.module.scss';

const PartnerSettingsPage: React.FC = () => {
    const settings = usePartnerSettings();
    const minimumClosureDate = todayInPartnerTimezone();

    return (
        <div className={styles.portalPage}>
            <div className={styles.settingsInner}>
                <header className={styles.settingsHead}>
                    <div className={styles.portalHead}>
                        <p className="eyebrow">{PARTNER_SETTINGS_COPY.eyebrow}</p>
                        <h1>{PARTNER_SETTINGS_COPY.title}</h1>
                        <p>{PARTNER_SETTINGS_COPY.intro}</p>
                    </div>
                    <nav
                        className={styles.portalActions}
                        aria-label={PARTNER_SETTINGS_COPY.portalNavigation}
                    >
                        <Link
                            className={`button ${styles.secondaryAction}`}
                            to={ROUTES.partnerCatalog}
                        >
                            {PARTNER_SETTINGS_COPY.catalogLink}
                        </Link>
                        <Link
                            className={`button ${styles.secondaryAction}`}
                            to={ROUTES.partnerOrders}
                        >
                            {PARTNER_SETTINGS_COPY.ordersLink}
                        </Link>
                    </nav>
                </header>

                {settings.loadState.error?.code === 'FORBIDDEN' ? (
                    <PartnerAccessRequired />
                ) : (
                    <AsyncBoundary
                        state={settings.loadState}
                        label={PARTNER_SETTINGS_COPY.loading}
                    >
                        {() => {
                            if (!settings.selected || !settings.draft) return null;
                            const draft = settings.draft;

                            return (
                                <form onSubmit={(event) => void settings.save(event)}>
                                    {settings.configurations.length > 1 && (
                                        <div className={styles.locationPicker}>
                                            <label htmlFor="partner-settings-location">
                                                {PARTNER_SETTINGS_COPY.locationLabel}
                                            </label>
                                            <select
                                                id="partner-settings-location"
                                                value={settings.selectedId ?? ''}
                                                onChange={(event) =>
                                                    settings.selectLaundry(event.target.value)
                                                }
                                                disabled={settings.isSaving}
                                            >
                                                {settings.configurations.map((configuration) => (
                                                    <option
                                                        key={configuration.id}
                                                        value={configuration.id}
                                                    >
                                                        {configuration.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <section className={`card ${styles.settingsCard}`}>
                                        <header>
                                            <h2>{PARTNER_SETTINGS_COPY.profileTitle}</h2>
                                            <p>{PARTNER_SETTINGS_COPY.profileIntro}</p>
                                        </header>
                                        <div className={styles.settingsFields}>
                                            <p className={styles.formField}>
                                                <label htmlFor="partner-name">
                                                    {PARTNER_SETTINGS_COPY.name}
                                                </label>
                                                <input
                                                    id="partner-name"
                                                    value={draft.name}
                                                    required
                                                    maxLength={120}
                                                    onChange={(event) =>
                                                        settings.updateField(
                                                            'name',
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </p>
                                            <p
                                                className={`${styles.formField} ${styles.fullField}`}
                                            >
                                                <label htmlFor="partner-about">
                                                    {PARTNER_SETTINGS_COPY.about}
                                                </label>
                                                <textarea
                                                    id="partner-about"
                                                    value={draft.about}
                                                    maxLength={1000}
                                                    rows={4}
                                                    onChange={(event) =>
                                                        settings.updateField(
                                                            'about',
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </p>
                                        </div>
                                    </section>

                                    <section className={`card ${styles.settingsCard}`}>
                                        <header>
                                            <div>
                                                <h2>{PARTNER_SETTINGS_COPY.serviceAreasTitle}</h2>
                                                <p>{PARTNER_SETTINGS_COPY.serviceAreasIntro}</p>
                                            </div>
                                        </header>
                                        <div className={styles.serviceAreaList}>
                                            {draft.servicePincodes.map((pincode, index) => {
                                                const position = index + 1;
                                                const inputId = `partner-service-pincode-${position}`;
                                                return (
                                                    <div
                                                        className={styles.serviceAreaRow}
                                                        key={index}
                                                    >
                                                        <p className={styles.formField}>
                                                            <label htmlFor={inputId}>
                                                                {PARTNER_SETTINGS_COPY.servicePincode(
                                                                    position
                                                                )}
                                                            </label>
                                                            <input
                                                                id={inputId}
                                                                value={pincode}
                                                                required
                                                                inputMode="numeric"
                                                                pattern="[0-9]{6}"
                                                                maxLength={6}
                                                                onChange={(event) =>
                                                                    settings.updateServicePincode(
                                                                        index,
                                                                        event.target.value
                                                                    )
                                                                }
                                                            />
                                                        </p>
                                                        <button
                                                            className={`button ${styles.removeServiceArea}`}
                                                            type="button"
                                                            aria-label={PARTNER_SETTINGS_COPY.removeServicePincode(
                                                                position
                                                            )}
                                                            disabled={
                                                                draft.servicePincodes.length === 1
                                                            }
                                                            onClick={() =>
                                                                settings.removeServicePincode(index)
                                                            }
                                                        >
                                                            {PARTNER_SETTINGS_COPY.remove}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button
                                            className={`button ${styles.addServiceArea}`}
                                            type="button"
                                            disabled={draft.servicePincodes.length >= 50}
                                            onClick={settings.addServicePincode}
                                        >
                                            {PARTNER_SETTINGS_COPY.addServicePincode}
                                        </button>
                                    </section>

                                    <section className={`card ${styles.settingsCard}`}>
                                        <header>
                                            <h2>{PARTNER_SETTINGS_COPY.addressTitle}</h2>
                                            <p>{PARTNER_SETTINGS_COPY.addressIntro}</p>
                                        </header>
                                        <div className={styles.settingsFields}>
                                            <p className={styles.formField}>
                                                <label htmlFor="partner-line1">
                                                    {PARTNER_SETTINGS_COPY.line1}
                                                </label>
                                                <input
                                                    id="partner-line1"
                                                    value={draft.address.line1}
                                                    required
                                                    maxLength={160}
                                                    autoComplete="address-line1"
                                                    onChange={(event) =>
                                                        settings.updateAddress(
                                                            'line1',
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </p>
                                            <p className={styles.formField}>
                                                <label htmlFor="partner-line2">
                                                    {PARTNER_SETTINGS_COPY.line2}
                                                </label>
                                                <input
                                                    id="partner-line2"
                                                    value={draft.address.line2}
                                                    maxLength={160}
                                                    autoComplete="address-line2"
                                                    onChange={(event) =>
                                                        settings.updateAddress(
                                                            'line2',
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </p>
                                            <p className={styles.formField}>
                                                <label htmlFor="partner-city">
                                                    {PARTNER_SETTINGS_COPY.city}
                                                </label>
                                                <input
                                                    id="partner-city"
                                                    value={draft.address.city}
                                                    required
                                                    maxLength={80}
                                                    autoComplete="address-level2"
                                                    onChange={(event) =>
                                                        settings.updateAddress(
                                                            'city',
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </p>
                                            <p className={styles.formField}>
                                                <label htmlFor="partner-pincode">
                                                    {PARTNER_SETTINGS_COPY.pincode}
                                                </label>
                                                <input
                                                    id="partner-pincode"
                                                    value={draft.address.pincode}
                                                    required
                                                    inputMode="numeric"
                                                    pattern="[0-9]{6}"
                                                    maxLength={6}
                                                    autoComplete="postal-code"
                                                    onChange={(event) =>
                                                        settings.updateAddress(
                                                            'pincode',
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </p>
                                        </div>
                                    </section>

                                    <section className={`card ${styles.settingsCard}`}>
                                        <header>
                                            <div>
                                                <h2>{PARTNER_SETTINGS_COPY.availabilityTitle}</h2>
                                                <p>{PARTNER_SETTINGS_COPY.availabilityIntro}</p>
                                            </div>
                                            <p
                                                className={styles.currentState}
                                                data-open={settings.selected.currentlyOpen}
                                            >
                                                <span>{PARTNER_SETTINGS_COPY.currentState}</span>
                                                <strong>
                                                    {settings.selected.currentlyOpen
                                                        ? PARTNER_SETTINGS_COPY.openNow
                                                        : PARTNER_SETTINGS_COPY.closedNow}
                                                </strong>
                                            </p>
                                        </header>

                                        <div className={styles.availabilityControls}>
                                            <label className={styles.checkboxControl}>
                                                <input
                                                    type="checkbox"
                                                    aria-label={
                                                        PARTNER_SETTINGS_COPY.acceptingOrders
                                                    }
                                                    checked={draft.acceptingOrders}
                                                    onChange={(event) =>
                                                        settings.updateField(
                                                            'acceptingOrders',
                                                            event.target.checked
                                                        )
                                                    }
                                                />
                                                <span>
                                                    <strong>
                                                        {PARTNER_SETTINGS_COPY.acceptingOrders}
                                                    </strong>
                                                    <small>
                                                        {PARTNER_SETTINGS_COPY.acceptingOrdersHelp}
                                                    </small>
                                                </span>
                                            </label>
                                            <label className={styles.checkboxControl}>
                                                <input
                                                    type="checkbox"
                                                    aria-label={
                                                        PARTNER_SETTINGS_COPY.useOpeningHours
                                                    }
                                                    checked={draft.useOpeningHours}
                                                    onChange={(event) =>
                                                        settings.updateField(
                                                            'useOpeningHours',
                                                            event.target.checked
                                                        )
                                                    }
                                                />
                                                <span>
                                                    <strong>
                                                        {PARTNER_SETTINGS_COPY.useOpeningHours}
                                                    </strong>
                                                    <small>
                                                        {PARTNER_SETTINGS_COPY.useOpeningHoursHelp}
                                                    </small>
                                                </span>
                                            </label>
                                            <p className={styles.formField}>
                                                <label htmlFor="partner-turnaround">
                                                    {PARTNER_SETTINGS_COPY.turnaround}
                                                </label>
                                                <input
                                                    id="partner-turnaround"
                                                    type="number"
                                                    value={draft.turnaroundHours}
                                                    required
                                                    min={1}
                                                    max={336}
                                                    step={1}
                                                    onChange={(event) =>
                                                        settings.updateField(
                                                            'turnaroundHours',
                                                            Number(event.target.value)
                                                        )
                                                    }
                                                />
                                            </p>
                                        </div>

                                        <div className={styles.closuresSection}>
                                            <h3>{PARTNER_SETTINGS_COPY.closuresTitle}</h3>
                                            <p>{PARTNER_SETTINGS_COPY.closuresIntro}</p>
                                            <p className={styles.closuresWarning}>
                                                {PARTNER_SETTINGS_COPY.closuresWarning}
                                            </p>
                                            {draft.holidayClosures.length > 0 && (
                                                <ul className={styles.closuresList}>
                                                    {draft.holidayClosures.map((closure, index) => {
                                                        const position = index + 1;
                                                        const dateId = `partner-closure-date-${position}`;
                                                        const reasonId = `partner-closure-reason-${position}`;
                                                        return (
                                                            <li key={index}>
                                                                <p className={styles.formField}>
                                                                    <label htmlFor={dateId}>
                                                                        {PARTNER_SETTINGS_COPY.closureDate(
                                                                            position
                                                                        )}
                                                                    </label>
                                                                    <input
                                                                        id={dateId}
                                                                        type="date"
                                                                        min={minimumClosureDate}
                                                                        value={closure.date}
                                                                        required
                                                                        onChange={(event) =>
                                                                            settings.updateHolidayClosure(
                                                                                index,
                                                                                {
                                                                                    date: event
                                                                                        .target
                                                                                        .value,
                                                                                }
                                                                            )
                                                                        }
                                                                    />
                                                                </p>
                                                                <p className={styles.formField}>
                                                                    <label htmlFor={reasonId}>
                                                                        {PARTNER_SETTINGS_COPY.closureReason(
                                                                            position
                                                                        )}
                                                                    </label>
                                                                    <input
                                                                        id={reasonId}
                                                                        value={closure.reason}
                                                                        maxLength={120}
                                                                        placeholder={
                                                                            PARTNER_SETTINGS_COPY.closureReasonPlaceholder
                                                                        }
                                                                        onChange={(event) =>
                                                                            settings.updateHolidayClosure(
                                                                                index,
                                                                                {
                                                                                    reason: event
                                                                                        .target
                                                                                        .value,
                                                                                }
                                                                            )
                                                                        }
                                                                    />
                                                                </p>
                                                                <button
                                                                    className={`button ${styles.removeClosure}`}
                                                                    type="button"
                                                                    aria-label={PARTNER_SETTINGS_COPY.removeClosure(
                                                                        position
                                                                    )}
                                                                    onClick={() =>
                                                                        settings.removeHolidayClosure(
                                                                            index
                                                                        )
                                                                    }
                                                                >
                                                                    {PARTNER_SETTINGS_COPY.remove}
                                                                </button>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                            <button
                                                className={`button ${styles.addClosure}`}
                                                type="button"
                                                disabled={draft.holidayClosures.length >= 60}
                                                onClick={settings.addHolidayClosure}
                                            >
                                                {PARTNER_SETTINGS_COPY.addClosure}
                                            </button>
                                        </div>

                                        <div className={styles.hoursSection}>
                                            <h3>{PARTNER_SETTINGS_COPY.hoursTitle}</h3>
                                            <p>{PARTNER_SETTINGS_COPY.hoursIntro}</p>
                                            <ul className={styles.hoursList}>
                                                {draft.openingHours.map((hour) => {
                                                    const day = WEEKDAYS[hour.weekday]!;
                                                    const closed = hour.opensAt === null;
                                                    return (
                                                        <li key={hour.weekday}>
                                                            <strong className={styles.dayLabel}>
                                                                {day}
                                                            </strong>
                                                            <label className={styles.closedControl}>
                                                                <input
                                                                    type="checkbox"
                                                                    aria-label={`${day} closed`}
                                                                    checked={closed}
                                                                    onChange={(event) =>
                                                                        settings.setDayClosed(
                                                                            hour.weekday,
                                                                            event.target.checked
                                                                        )
                                                                    }
                                                                />
                                                                {PARTNER_SETTINGS_COPY.closed}
                                                            </label>
                                                            <label className={styles.timeField}>
                                                                <span>
                                                                    {
                                                                        PARTNER_SETTINGS_COPY.openingTime
                                                                    }
                                                                </span>
                                                                <input
                                                                    type="time"
                                                                    aria-label={`${day} opening time`}
                                                                    value={hour.opensAt ?? ''}
                                                                    required={!closed}
                                                                    disabled={closed}
                                                                    onChange={(event) =>
                                                                        settings.updateHours(
                                                                            hour.weekday,
                                                                            {
                                                                                opensAt:
                                                                                    event.target
                                                                                        .value,
                                                                            }
                                                                        )
                                                                    }
                                                                />
                                                            </label>
                                                            <label className={styles.timeField}>
                                                                <span>
                                                                    {
                                                                        PARTNER_SETTINGS_COPY.closingTime
                                                                    }
                                                                </span>
                                                                <input
                                                                    type="time"
                                                                    aria-label={`${day} closing time`}
                                                                    value={hour.closesAt ?? ''}
                                                                    required={!closed}
                                                                    disabled={closed}
                                                                    onChange={(event) =>
                                                                        settings.updateHours(
                                                                            hour.weekday,
                                                                            {
                                                                                closesAt:
                                                                                    event.target
                                                                                        .value,
                                                                            }
                                                                        )
                                                                    }
                                                                />
                                                            </label>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    </section>

                                    <div className={styles.settingsActions}>
                                        <button
                                            className="button button--primary"
                                            type="submit"
                                            disabled={settings.isSaving}
                                        >
                                            {settings.isSaving
                                                ? PARTNER_SETTINGS_COPY.saving
                                                : PARTNER_SETTINGS_COPY.save}
                                        </button>
                                        <div
                                            className={styles.saveMessage}
                                            aria-live="polite"
                                        >
                                            {settings.saveError && (
                                                <p
                                                    data-error="true"
                                                    role="alert"
                                                >
                                                    {settings.saveError.message}
                                                </p>
                                            )}
                                            {settings.saveSucceeded && (
                                                <p>{PARTNER_SETTINGS_COPY.saved}</p>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            );
                        }}
                    </AsyncBoundary>
                )}
            </div>
        </div>
    );
};

export default PartnerSettingsPage;
