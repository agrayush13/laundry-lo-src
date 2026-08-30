import React from 'react';
import Icon from '../../common-ui/icons/Icon';
import { ADDRESS_FIELDS, CHECKOUT_COPY } from '../../config/bookingConfig';
import { ICON_SIZE } from '../../config/brandConfig';
import { Address } from '../../models/bookingModels';
import styles from './checkout.module.scss';

interface AddressFieldsProps {
    address: Address;
    idPrefix: string;
    /** Field-level messages, populated once the customer tries to submit. */
    errors?: Partial<Record<string, string>>;
    onChange: (field: keyof Address, value: string) => void;
}

const AddressFields: React.FC<AddressFieldsProps> = ({ address, idPrefix, errors, onChange }) => (
    <fieldset className={styles.checkoutFieldset}>
        <legend className="visually-hidden">Pickup address</legend>
        <div className={styles.addressForm}>
            {ADDRESS_FIELDS.map(({ name, label, placeholder, half, inputMode, maxLength }) => {
                const error = errors?.[name];
                const inputId = `${idPrefix}-${name}`;
                const errorId = `${inputId}-error`;

                return (
                    <p
                        key={name}
                        className={styles.addressFormField}
                        data-half={Boolean(half)}
                    >
                        <label htmlFor={inputId}>{label}</label>
                        <input
                            id={inputId}
                            name={name}
                            value={address[name]}
                            placeholder={placeholder}
                            inputMode={inputMode}
                            type={name === 'phone' ? 'tel' : 'text'}
                            maxLength={maxLength}
                            aria-invalid={Boolean(error)}
                            aria-describedby={error ? errorId : undefined}
                            onChange={(event) =>
                                onChange(
                                    name,
                                    name === 'pincode'
                                        ? event.target.value.replace(/\D/g, '')
                                        : event.target.value
                                )
                            }
                        />
                        {error && (
                            <span
                                className={styles.addressFormError}
                                id={errorId}
                            >
                                {error}
                            </span>
                        )}
                    </p>
                );
            })}
        </div>

        <p className={styles.checkoutNote}>
            <Icon
                name="pin"
                size={ICON_SIZE.sm}
            />
            {CHECKOUT_COPY.sameAddressNote}
        </p>
    </fieldset>
);

export default AddressFields;
