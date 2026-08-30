import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../common-ui/icons/Icon';
import { ICON_SIZE } from '../../config/brandConfig';
import { NOT_FOUND_COPY } from '../../config/commonConfig';
import { ROUTES } from '../../config/navigationConfig';
import styles from './notFoundPage.module.scss';

/**
 * A dead URL used to redirect to the homepage, with `replace`, so the visitor
 * arrived somewhere they did not ask for, were told nothing, and could not press
 * Back to undo it. This says what happened and offers the two places they were
 * most likely trying to reach.
 */
const NotFoundPage: React.FC = () => (
    <div className={styles.notFound}>
        <span
            className={styles.notFoundIcon}
            aria-hidden="true"
        >
            <Icon
                name="alert"
                size={ICON_SIZE.hero}
            />
        </span>
        <h1 className={styles.notFoundTitle}>{NOT_FOUND_COPY.title}</h1>
        <p className={styles.notFoundBody}>{NOT_FOUND_COPY.body}</p>

        <div className={styles.notFoundActions}>
            <Link
                className="button button--primary"
                to={ROUTES.home}
            >
                {NOT_FOUND_COPY.home}
            </Link>
            <Link
                className="button"
                to={ROUTES.laundries}
            >
                {NOT_FOUND_COPY.laundries}
            </Link>
        </div>
    </div>
);

export default NotFoundPage;
