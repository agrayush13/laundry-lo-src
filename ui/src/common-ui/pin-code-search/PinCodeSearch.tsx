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
    const { pinCode, setPinCode, isValid, maxLength, submit } = usePinCodeSearch();
    const inputId = useId();

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
                id={inputId}
                name="pinCode"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={maxLength}
                placeholder={PIN_SEARCH.placeholder}
                value={pinCode}
                onChange={(event) => setPinCode(event.target.value)}
            />
            <button
                className={styles.searchSubmit}
                type="submit"
                disabled={!isValid}
            >
                {PIN_SEARCH.submit}
                <Icon name="arrow-right" />
            </button>
        </form>
    );
};

export default PinCodeSearch;
