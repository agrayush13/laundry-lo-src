import React from 'react';
import { ICON_SIZE } from '../../config/brandConfig';
import Icon from '../icons/Icon';
import styles from './quantityStepper.module.scss';

interface QuantityStepperProps {
    /** Used to build the accessible names for each control. */
    label: string;
    quantity: number;
    size?: 'md' | 'sm';
    max?: number;
    onChange: (quantity: number) => void;
}

const QuantityStepper: React.FC<QuantityStepperProps> = ({
    label,
    quantity,
    size = 'md',
    max = 99,
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
        <span aria-label={`${label} quantity`}>{quantity}</span>
        <button
            type="button"
            aria-label={`Add one ${label}`}
            disabled={quantity >= max}
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
