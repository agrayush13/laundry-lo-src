import React, { useId } from 'react';
import { PIN_SEARCH } from '../../config/cycleConfig';
import { usePinCodeSearch } from '../../hooks/usePinCodeSearch';
import Icon from '../icons/Icon';
import styles from './pinCodeSearch.module.scss';

interface PinCodeSearchProps {
    className?: string;
}

/**
 * The page's one ask, made twice: once in the hero and once in the footer. Same
 * component, same behaviour, so the second ask is never a weaker version of the
 * first.
 */
const PinCodeSearch: React.FC<PinCodeSearchProps> = ({ className }) => {
    const { pinCode, error, inputRef, setPinCode, maxLength, submit } = usePinCodeSearch();
    const inputId = useId();
    const errorId = `${inputId}-error`;

    return (
        <form
            className={[styles.search, className].filter(Boolean).join(' ')}
            onSubmit={submit}
        >
            <label
                className="visually-hidden"
                htmlFor={inputId}
            >
                {PIN_SEARCH.label}
            </label>
            <input
                className={styles.searchInput}
                ref={inputRef}
                id={inputId}
                name="pinCode"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={maxLength}
                placeholder={PIN_SEARCH.placeholder}
                value={pinCode}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => setPinCode(event.target.value)}
            />
            <button
                className={styles.searchSubmit}
                type="submit"
            >
                {PIN_SEARCH.submit}
                <Icon name="arrow-right" />
            </button>
            {error && (
                <span
                    className={styles.searchError}
                    id={errorId}
                    role="alert"
                >
                    {error}
                </span>
            )}
        </form>
    );
};

export default PinCodeSearch;
