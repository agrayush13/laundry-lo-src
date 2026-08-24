import React from 'react';
import { ICON_SIZE } from '../../config/brandConfig';
import Icon from '../icons/Icon';
import styles from './quantityStepper.module.scss';

interface QuantityStepperProps {
    /** Used to build the accessible names for each control. */
    label: string;
    quantity: number;
    size?: 'md' | 'sm';
    onChange: (quantity: number) => void;
}

const QuantityStepper: React.FC<QuantityStepperProps> = ({
    label,
    quantity,
    size = 'md',
    onChange,
}) => (
    <div
        className={styles.stepper}
        data-size={size}
    >
        <button
            type="button"
            aria-label={`Remove one ${label}`}
            onClick={() => onChange(quantity - 1)}
        >
            <Icon
                name="minus"
                size={ICON_SIZE.sm}
            />
        </button>
        <output aria-label={`${label} quantity`}>{quantity}</output>
        <button
            type="button"
            aria-label={`Add one ${label}`}
            onClick={() => onChange(quantity + 1)}
        >
            <Icon
                name="plus"
                size={ICON_SIZE.sm}
            />
        </button>
    </div>
);

export default QuantityStepper;
