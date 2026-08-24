import React from 'react';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '../../config/brandConfig';
import { ICONS, IconName } from './registry';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: IconName;
    size?: number;
}

const Icon: React.FC<IconProps> = ({ name, size = ICON_SIZE.xl, ...props }) => {
    const Glyph = ICONS[name];

    return (
        <Glyph
            width={size}
            height={size}
            strokeWidth={ICON_STROKE_WIDTH}
            aria-hidden
            focusable="false"
            {...props}
        />
    );
};

export default Icon;
