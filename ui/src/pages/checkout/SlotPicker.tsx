import React from 'react';
import Card from '../../common-ui/card/Card';
import { CHECKOUT_COPY, SCHEDULE_DAYS } from '../../config/bookingConfig';
import { SlotSelection } from '../../models/bookingModels';
import {
    TIME_SLOTS,
    formatDayOfMonth,
    formatMonth,
    formatWeekday,
    slotIndex,
    upcomingDates,
} from '../../utils/datesUtils';
import styles from './checkout.module.scss';

const DATES = upcomingDates(SCHEDULE_DAYS);

interface SlotPickerProps {
    index: number;
    title: string;
    value: SlotSelection;
    /** Dates before this are disabled - delivery can't precede pickup. */
    minDate?: string;
    /** On `minDate` itself, slots at or before this one are disabled too. */
    minSlot?: string;
    onChange: (value: SlotSelection) => void;
}

const SlotPicker: React.FC<SlotPickerProps> = ({
    index,
    title,
    value,
    minDate,
    minSlot,
    onChange,
}) => (
    <Card
        as="section"
        className={styles.scheduleBlock}
        aria-label={title}
    >
        <h3 className={styles.scheduleTitle}>
            <span className={styles.scheduleIndex}>{index}</span>
            {title}
        </h3>

        <p
            className={styles.scheduleLabel}
            id={`schedule-${index}-dates-label`}
        >
            {CHECKOUT_COPY.selectDate}
        </p>
        <div
            className={styles.scheduleDates}
            role="group"
            aria-labelledby={`schedule-${index}-dates-label`}
        >
            {DATES.map((date) => (
                <button
                    key={date}
                    type="button"
                    className={styles.scheduleDate}
                    aria-pressed={value.date === date}
                    disabled={Boolean(minDate) && date < minDate!}
                    onClick={() => onChange({ ...value, date })}
                >
                    <span>{formatWeekday(date)}</span>
                    <strong>{formatDayOfMonth(date)}</strong>
                    <span>{formatMonth(date)}</span>
                </button>
            ))}
        </div>

        <p
            className={styles.scheduleLabel}
            id={`schedule-${index}-slots-label`}
        >
            {CHECKOUT_COPY.selectSlot}
        </p>
        <div
            className={styles.scheduleSlots}
            role="group"
            aria-labelledby={`schedule-${index}-slots-label`}
        >
            {TIME_SLOTS.map((slot) => (
                <button
                    key={slot}
                    type="button"
                    className={styles.scheduleSlot}
                    aria-pressed={value.slot === slot}
                    disabled={
                        Boolean(minSlot) &&
                        value.date === minDate &&
                        slotIndex(slot) <= slotIndex(minSlot!)
                    }
                    onClick={() => onChange({ ...value, slot })}
                >
                    {slot}
                </button>
            ))}
        </div>
    </Card>
);

export default SlotPicker;
