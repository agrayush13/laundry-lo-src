import React from 'react';
import { ICON_SIZE } from '../../config/brandConfig';
import { COMMON_COPY } from '../../config/commonConfig';
import Icon from '../icons/Icon';
import { IconName } from '../icons/registry';

interface ComingSoonButtonProps {
    label: string;
    icon?: IconName;
    className?: string;
    iconSize?: number;
}

/**
 * A control that is deliberately inert until the feature exists - visible so
 * the affordance is discoverable, disabled so it never pretends to work.
 */
const ComingSoonButton: React.FC<ComingSoonButtonProps> = ({
    label,
    icon,
    className,
    iconSize = ICON_SIZE.md,
}) => (
    <button
        className={className}
        type="button"
        disabled
        title={COMMON_COPY.comingSoon}
    >
        {icon && (
            <Icon
                name={icon}
                size={iconSize}
            />
        )}
        {label}
    </button>
);

export default ComingSoonButton;
