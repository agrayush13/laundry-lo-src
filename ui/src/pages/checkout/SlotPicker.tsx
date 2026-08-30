import React from 'react';
import Card from '../../common-ui/card/Card';
import { CHECKOUT_COPY } from '../../config/bookingConfig';
import { SlotSelection } from '../../models/bookingModels';
import { SlotDay } from '../../models/slotModels';
import {
    formatDayOfMonth,
    formatMonth,
    formatSlotRange,
    formatWeekday,
    isAfter,
} from '../../utils/datesUtils';
import styles from './checkout.module.scss';

interface SlotPickerProps {
    index: number;
    title: string;
    /** Days and their slots as the partner published them. */
    days: SlotDay[];
    value: SlotSelection;
    /** Delivery must land strictly after this; absent for the pickup picker. */
    min?: SlotSelection;
    onChange: (value: SlotSelection) => void;
}

const hasBookableSlot = (day: SlotDay) => day.slots.some((slot) => slot.available);

const SlotPicker: React.FC<SlotPickerProps> = ({ index, title, days, value, min, onChange }) => {
    // Slots differ per day now, so the list below follows the chosen date - or
    // the first one offered, before anything has been chosen.
    const activeDate = value.date || days[0]?.date || '';
    const slots = days.find((day) => day.date === activeDate)?.slots ?? [];

    return (
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
                {days.map((day) => (
                    <button
                        key={day.date}
                        type="button"
                        className={styles.scheduleDate}
                        aria-pressed={value.date === day.date}
                        // A day the partner has fully booked or closed cannot be
                        // chosen, which is the whole point of asking the server.
                        disabled={
                            !hasBookableSlot(day) || (Boolean(min?.date) && day.date < min!.date)
                        }
                        // Slot ids belong to a day, so changing the day drops the
                        // slot rather than carrying a stale id across.
                        onClick={() => onChange({ date: day.date, slotId: '', startsAt: '' })}
                    >
                        <span>{formatWeekday(day.date)}</span>
                        <strong>{formatDayOfMonth(day.date)}</strong>
                        <span>{formatMonth(day.date)}</span>
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
                {slots.map((slot) => (
                    <button
                        key={slot.id}
                        type="button"
                        className={styles.scheduleSlot}
                        aria-pressed={value.slotId === slot.id}
                        disabled={
                            !slot.available ||
                            (min !== undefined &&
                                !isAfter({ date: activeDate, startsAt: slot.startsAt }, min))
                        }
                        onClick={() =>
                            onChange({
                                date: activeDate,
                                slotId: slot.id,
                                startsAt: slot.startsAt,
                            })
                        }
                    >
                        {formatSlotRange(slot.startsAt, slot.endsAt)}
                    </button>
                ))}
            </div>
        </Card>
    );
};

export default SlotPicker;
