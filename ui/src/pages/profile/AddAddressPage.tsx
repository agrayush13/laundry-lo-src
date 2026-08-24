import React from 'react';
import BackLink from '../../common-ui/back-link/BackLink';
import Card from '../../common-ui/card/Card';
import { ROUTES } from '../../config/navigationConfig';
import { ADDRESS_LABEL_SUGGESTIONS, PROFILE_COPY } from '../../config/profileConfig';
import { useAddressForm } from '../../hooks/useAddressForm';
import AddressFields from '../checkout/AddressFields';
import styles from './addAddressPage.module.scss';

const AddAddressPage: React.FC = () => {
    const { label, address, canSave, setLabel, updateAddress, save, cancel } = useAddressForm();

    return (
        <div className={styles.addAddress}>
            <div className={styles.addAddressInner}>
                <BackLink
                    label={PROFILE_COPY.backToProfile}
                    to={ROUTES.profile}
                />

                <h1 className={styles.addAddressTitle}>{PROFILE_COPY.addAddressTitle}</h1>
                <p className={styles.addAddressSubtitle}>{PROFILE_COPY.addAddressSubtitle}</p>

                <Card className={styles.addAddressCard}>
                    <form onSubmit={save}>
                        <p className={styles.addAddressField}>
                            <label htmlFor="address-label">{PROFILE_COPY.labelField}</label>
                            <input
                                id="address-label"
                                value={label}
                                placeholder={PROFILE_COPY.labelPlaceholder}
                                maxLength={20}
                                onChange={(event) => setLabel(event.target.value)}
                                required
                            />
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
                            onChange={updateAddress}
                        />

                        <div className={styles.addAddressActions}>
                            <button
                                className="button button--primary"
                                type="submit"
                                disabled={!canSave}
                            >
                                {PROFILE_COPY.saveAddress}
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
