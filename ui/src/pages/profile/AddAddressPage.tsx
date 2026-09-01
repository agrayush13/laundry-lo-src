import React from 'react';
import { Navigate } from 'react-router-dom';
import BackLink from '../../common-ui/back-link/BackLink';
import Card from '../../common-ui/card/Card';
import { ROUTES } from '../../config/navigationConfig';
import {
    ADDRESS_LABEL_SUGGESTIONS,
    LABEL_FIELD_ID,
    PROFILE_COPY,
    SAVED_ADDRESS_ID_PREFIX,
} from '../../config/profileConfig';
import { useAddressForm } from '../../hooks/useAddressForm';
import AddressFields from '../checkout/AddressFields';
import styles from './addAddressPage.module.scss';

const AddAddressPage: React.FC = () => {
    const {
        label,
        address,
        errors,
        isSaving,
        saveError,
        isEditing,
        isMissing,
        setLabel,
        updateAddress,
        save,
        cancel,
    } = useAddressForm();
    const labelErrorId = `${LABEL_FIELD_ID}-error`;

    if (isMissing)
        return (
            <Navigate
                to={ROUTES.profile}
                replace
            />
        );

    return (
        <div className={styles.addAddress}>
            <div className={styles.addAddressInner}>
                <BackLink
                    label={PROFILE_COPY.backToProfile}
                    to={ROUTES.profile}
                />

                <h1 className={styles.addAddressTitle}>
                    {isEditing ? PROFILE_COPY.editAddressTitle : PROFILE_COPY.addAddressTitle}
                </h1>
                <p className={styles.addAddressSubtitle}>{PROFILE_COPY.addAddressSubtitle}</p>

                <Card className={styles.addAddressCard}>
                    <form onSubmit={save}>
                        <p className={styles.addAddressField}>
                            <label htmlFor={LABEL_FIELD_ID}>{PROFILE_COPY.labelField}</label>
                            <input
                                id={LABEL_FIELD_ID}
                                value={label}
                                placeholder={PROFILE_COPY.labelPlaceholder}
                                maxLength={20}
                                aria-invalid={Boolean(errors.label)}
                                aria-describedby={errors.label ? labelErrorId : undefined}
                                onChange={(event) => setLabel(event.target.value)}
                            />
                            {errors.label && (
                                <span
                                    className={styles.addAddressError}
                                    id={labelErrorId}
                                >
                                    {errors.label}
                                </span>
                            )}
                        </p>

                        <ul className={styles.addAddressSuggestions}>
                            {ADDRESS_LABEL_SUGGESTIONS.map((suggestion) => (
                                <li key={suggestion}>
                                    <button
                                        type="button"
                                        aria-pressed={label === suggestion}
                                        onClick={() => setLabel(suggestion)}
                                    >
                                        {suggestion}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <AddressFields
                            address={address}
                            idPrefix={SAVED_ADDRESS_ID_PREFIX}
                            errors={errors}
                            onChange={updateAddress}
                        />

                        <div className={styles.addAddressActions}>
                            {saveError && <p role="alert">{saveError}</p>}
                            <button
                                className="button button--primary"
                                type="submit"
                                disabled={isSaving}
                            >
                                {isSaving
                                    ? PROFILE_COPY.savingAddress
                                    : isEditing
                                      ? PROFILE_COPY.updateAddress
                                      : PROFILE_COPY.saveAddress}
                            </button>
                            <button
                                className={`button ${styles.addAddressCancel}`}
                                type="button"
                                onClick={cancel}
                            >
                                {PROFILE_COPY.cancel}
                            </button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default AddAddressPage;
