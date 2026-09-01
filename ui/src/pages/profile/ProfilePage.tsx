import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackLink from '../../common-ui/back-link/BackLink';
import Icon from '../../common-ui/icons/Icon';
import { ICON_SIZE } from '../../config/brandConfig';
import { ROUTES } from '../../config/navigationConfig';
import { PREFERENCES, PROFILE_COPY, PROFILE_FIELDS } from '../../config/profileConfig';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../data/user';
import { toInitials } from '../../hooks/useInitials';
import { useProfileEditor } from '../../hooks/useProfileEditor';
import { formatAddress } from '../../utils/addressUtils';
import { formatTimestampDate } from '../../utils/datesUtils';
import styles from './profilePage.module.scss';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const account = user as User; // ProtectedRoute guarantees a signed-in user
    const {
        isEditing,
        isSaving,
        error,
        emailConfirmationRequired,
        draft,
        startEditing,
        cancel,
        updateDraft,
        save,
        togglePreference,
    } = useProfileEditor(account);

    return (
        <div>
            <div className={styles.profileBanner}>
                <div className={styles.profileBannerInner}>
                    <BackLink
                        label={PROFILE_COPY.back}
                        onClick={() => navigate(-1)}
                    />

                    <div className={styles.profileIdentity}>
                        <span className={styles.profileAvatar}>
                            {toInitials(account.fullName)}
                            <span
                                className={styles.profileAvatarEdit}
                                aria-hidden="true"
                            >
                                <Icon
                                    name="camera"
                                    size={ICON_SIZE.sm}
                                />
                            </span>
                        </span>
                        <div>
                            <h1 className={styles.profileName}>{account.fullName}</h1>
                            <p className={styles.profileMember}>
                                {PROFILE_COPY.memberSincePrefix}{' '}
                                {formatTimestampDate(account.memberSince)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.profileBody}>
                <section className={`card ${styles.profileCard}`}>
                    <header className={styles.profileCardHead}>
                        <h2>{PROFILE_COPY.personalInformation}</h2>
                        <button
                            className={styles.profileEdit}
                            type="button"
                            data-active={isEditing}
                            onClick={isEditing ? cancel : startEditing}
                            disabled={isSaving}
                        >
                            <Icon
                                name="pencil"
                                size={ICON_SIZE.sm}
                            />
                            {isEditing ? PROFILE_COPY.cancel : PROFILE_COPY.edit}
                        </button>
                    </header>

                    {isEditing ? (
                        <form
                            className={styles.profileForm}
                            onSubmit={save}
                        >
                            {PROFILE_FIELDS.map(({ name, label, icon, type }) => (
                                <p
                                    key={name}
                                    className={styles.profileField}
                                >
                                    <label htmlFor={name}>
                                        {icon && (
                                            <Icon
                                                name={icon}
                                                size={ICON_SIZE.sm}
                                            />
                                        )}
                                        {label}
                                    </label>
                                    <input
                                        id={name}
                                        type={type ?? 'text'}
                                        value={draft[name]}
                                        onChange={(event) => updateDraft(name, event.target.value)}
                                        disabled={isSaving}
                                        required
                                    />
                                </p>
                            ))}
                            {error && (
                                <p
                                    className={styles.profileMessage}
                                    data-kind="error"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}
                            <div className={styles.profileFormActions}>
                                <button
                                    className="button button--primary"
                                    type="submit"
                                    disabled={isSaving}
                                >
                                    {isSaving ? PROFILE_COPY.saving : PROFILE_COPY.save}
                                </button>
                                <button
                                    className={`button ${styles.profileCancel}`}
                                    type="button"
                                    onClick={cancel}
                                    disabled={isSaving}
                                >
                                    {PROFILE_COPY.cancel}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            {emailConfirmationRequired && (
                                <p
                                    className={styles.profileMessage}
                                    role="status"
                                >
                                    {PROFILE_COPY.emailConfirmation}
                                </p>
                            )}
                            {error && (
                                <p
                                    className={styles.profileMessage}
                                    data-kind="error"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}
                            <dl className={styles.profileDetails}>
                                {PROFILE_FIELDS.map(({ name, label, icon }) => (
                                    <div key={name}>
                                        <dt>
                                            {icon && (
                                                <Icon
                                                    name={icon}
                                                    size={ICON_SIZE.sm}
                                                />
                                            )}
                                            {label}
                                        </dt>
                                        <dd>{account[name]}</dd>
                                    </div>
                                ))}
                            </dl>
                        </>
                    )}
                </section>

                <section className={`card ${styles.profileCard}`}>
                    <header className={styles.profileCardHead}>
                        <h2>{PROFILE_COPY.savedAddresses}</h2>
                        <Link
                            className={styles.profileEdit}
                            to={ROUTES.addAddress}
                        >
                            <Icon
                                name="pin"
                                size={ICON_SIZE.sm}
                            />
                            {PROFILE_COPY.addAddress}
                        </Link>
                    </header>

                    {account.addresses.length > 0 ? (
                        <ul className={styles.profileAddresses}>
                            {account.addresses.map((savedAddress) => (
                                <li key={savedAddress.id}>
                                    <div>
                                        <p className={styles.profileAddressLabel}>
                                            {savedAddress.label}
                                        </p>
                                        <p className={styles.profileAddress}>
                                            {formatAddress(savedAddress)}
                                        </p>
                                    </div>
                                    <Link
                                        to={ROUTES.editAddress(savedAddress.id)}
                                        aria-label={`Edit ${savedAddress.label} address`}
                                    >
                                        <Icon
                                            name="pencil"
                                            size={ICON_SIZE.sm}
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className={styles.profileEmpty}>{PROFILE_COPY.noAddresses}</p>
                    )}
                </section>

                <section className={`card ${styles.profileCard}`}>
                    <header className={styles.profileCardHead}>
                        <h2>{PROFILE_COPY.preferences}</h2>
                    </header>
                    <ul className={styles.profilePreferences}>
                        {PREFERENCES.map(({ key, title, description }) => (
                            <li key={key}>
                                <div>
                                    <p className={styles.profilePreferenceTitle}>{title}</p>
                                    <p className={styles.profilePreferenceDescription}>
                                        {description}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className={styles.profileToggle}
                                    role="switch"
                                    aria-checked={account.preferences[key]}
                                    aria-label={title}
                                    onClick={() => void togglePreference(key)}
                                >
                                    <span />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
};

export default ProfilePage;
