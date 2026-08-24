import React from 'react';
import ComingSoonButton from '../../common-ui/coming-soon-button/ComingSoonButton';
import { AUTH_COPY } from '../../config/authConfig';
import { ICON_SIZE } from '../../config/brandConfig';
import styles from './auth.module.scss';

/** Placeholder until OAuth is wired up - deliberately inert, not fake. */
const OAuthButton: React.FC = () => (
    <ComingSoonButton
        className={styles.authOauth}
        icon="google"
        iconSize={ICON_SIZE.lg}
        label={AUTH_COPY.oauth}
    />
);

export default OAuthButton;
