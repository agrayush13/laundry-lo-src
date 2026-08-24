import React from 'react';
import { ICON_SIZE } from '../../config/brandConfig';
import { UPDATE_COPY } from '../../config/commonConfig';
import { useServiceWorker } from '../../hooks/useServiceWorker';
import Icon from '../icons/Icon';
import styles from './updatePrompt.module.scss';

/** Offers a reload when a newer build is waiting, rather than forcing one. */
const UpdatePrompt: React.FC = () => {
    const { hasUpdate, update, dismiss } = useServiceWorker();

    if (!hasUpdate) {
        return null;
    }

    return (
        <div
            className={styles.updatePrompt}
            role="status"
        >
            <Icon
                name="refresh"
                size={ICON_SIZE.lg}
            />
            <p className={styles.updatePromptText}>{UPDATE_COPY.message}</p>
            <button
                className={styles.updatePromptAction}
                type="button"
                onClick={update}
            >
                {UPDATE_COPY.action}
            </button>
            <button
                className={styles.updatePromptDismiss}
                type="button"
                aria-label={UPDATE_COPY.dismiss}
                onClick={dismiss}
            >
                <Icon
                    name="close"
                    size={ICON_SIZE.md}
                />
            </button>
        </div>
    );
};

export default UpdatePrompt;
