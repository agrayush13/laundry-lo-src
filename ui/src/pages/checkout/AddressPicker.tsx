import React from 'react';
import Icon from '../../common-ui/icons/Icon';
import { ADDRESS_PICKER_COPY, CHECKOUT_ADDRESS_ID_PREFIX } from '../../config/bookingConfig';
import { ICON_SIZE } from '../../config/brandConfig';
import { SavedAddress } from '../../data/user';
import { Address } from '../../models/bookingModels';
import { formatAddress } from '../../utils/addressUtils';
import AddressFields from './AddressFields';
import styles from './checkout.module.scss';

export const NEW_ADDRESS_ID = 'new';

interface AddressPickerProps {
    savedAddresses: SavedAddress[];
    selectedId: string;
    draft: Address;
    /** Field-level messages, populated once the customer tries to submit. */
    errors?: Partial<Record<string, string>>;
    onSelect: (id: string) => void;
    onDraftChange: (field: keyof Address, value: string) => void;
}

const AddressPicker: React.FC<AddressPickerProps> = ({
    savedAddresses,
    selectedId,
    draft,
    errors,
    onSelect,
    onDraftChange,
}) => {
    // Signed-out visitors have nothing to choose from, so go straight to the form.
    if (savedAddresses.length === 0) {
        return (
            <AddressFields
                address={draft}
                idPrefix={CHECKOUT_ADDRESS_ID_PREFIX}
                errors={errors}
                onChange={onDraftChange}
            />
        );
    }

    return (
        <fieldset className={styles.addressPicker}>
            <legend className="visually-hidden">{ADDRESS_PICKER_COPY.legend}</legend>

            <ul className={styles.addressPickerOptions}>
                {savedAddresses.map((savedAddress) => (
                    <li key={savedAddress.id}>
                        <label
                            className={`card ${styles.addressPickerOption}`}
                            data-selected={selectedId === savedAddress.id}
                        >
                            <input
                                type="radio"
                                name="pickupAddress"
                                className="visually-hidden"
                                checked={selectedId === savedAddress.id}
                                onChange={() => onSelect(savedAddress.id)}
                            />
                            <span className={styles.addressPickerLabel}>{savedAddress.label}</span>
                            <span className={styles.addressPickerValue}>
                                {formatAddress(savedAddress)}
                            </span>
                            <span className={styles.addressPickerContact}>
                                {savedAddress.recipientName} • {savedAddress.phone}
                            </span>
                        </label>
                    </li>
                ))}

                <li>
                    <label
                        className={`card ${styles.addressPickerOption} ${styles.addressPickerOptionNew}`}
                        data-selected={selectedId === NEW_ADDRESS_ID}
                    >
                        <input
                            type="radio"
                            name="pickupAddress"
                            className="visually-hidden"
                            checked={selectedId === NEW_ADDRESS_ID}
                            onChange={() => onSelect(NEW_ADDRESS_ID)}
                        />
                        <span className={styles.addressPickerLabel}>
                            <Icon
                                name="plus"
                                size={ICON_SIZE.sm}
                            />
                            {ADDRESS_PICKER_COPY.addNew}
                        </span>
                        <span className={styles.addressPickerValue}>
                            {ADDRESS_PICKER_COPY.addNewHint}
                        </span>
                    </label>
                </li>
            </ul>

            {selectedId === NEW_ADDRESS_ID && (
                <div className={styles.addressPickerForm}>
                    <h3 className={styles.addressPickerFormHeading}>
                        {ADDRESS_PICKER_COPY.newAddressHeading}
                    </h3>
                    <AddressFields
                        address={draft}
                        idPrefix={CHECKOUT_ADDRESS_ID_PREFIX}
                        errors={errors}
                        onChange={onDraftChange}
                    />
                </div>
            )}
        </fieldset>
    );
};

export default AddressPicker;
