import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type {
    HolidayClosure,
    PartnerLaundryConfiguration,
    PartnerLaundryConfigurationInput,
} from '../models/partnerConfigurationModels';
import type { OpeningHours, PartnerAddress } from '../models/partnerModels';
import { ApiError } from '../services/apiClient';
import {
    getPartnerLaundries,
    updatePartnerLaundry,
} from '../services/partnerConfigurationServices';
import { PARTNER_SETTINGS_COPY } from '../config/partnerSettingsConfig';
import { useAsync } from './useAsync';

const toDraft = ({
    name,
    about,
    address,
    servicePincodes,
    holidayClosures,
    turnaroundHours,
    acceptingOrders,
    useOpeningHours,
    openingHours,
}: PartnerLaundryConfiguration): PartnerLaundryConfigurationInput => ({
    name,
    about,
    address: { ...address },
    servicePincodes: [...servicePincodes],
    holidayClosures: holidayClosures.map((closure) => ({ ...closure })),
    turnaroundHours,
    acceptingOrders,
    useOpeningHours,
    openingHours: openingHours.map((hour) => ({ ...hour })),
});

const asApiError = (error: unknown) =>
    error instanceof ApiError
        ? error
        : new ApiError('INTERNAL_ERROR', PARTNER_SETTINGS_COPY.saveFallback);

export const usePartnerSettings = () => {
    const loadState = useAsync(getPartnerLaundries, []);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [savedById, setSavedById] = useState<Record<string, PartnerLaundryConfiguration>>({});
    const [draft, setDraft] = useState<PartnerLaundryConfigurationInput | null>(null);
    const [draftPartnerId, setDraftPartnerId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<ApiError | null>(null);
    const [saveSucceeded, setSaveSucceeded] = useState(false);

    const configurations = useMemo(
        () => loadState.data?.map((item) => savedById[item.id] ?? item) ?? [],
        [loadState.data, savedById]
    );
    const effectiveId =
        selectedId && configurations.some(({ id }) => id === selectedId)
            ? selectedId
            : (configurations[0]?.id ?? null);
    const selected = configurations.find(({ id }) => id === effectiveId) ?? null;

    useEffect(() => {
        const nextId = selected?.id ?? null;
        if (nextId === draftPartnerId) return;
        setDraft(selected ? toDraft(selected) : null);
        setDraftPartnerId(nextId);
        setSaveError(null);
        setSaveSucceeded(false);
    }, [draftPartnerId, selected]);

    const selectLaundry = (partnerId: string) => {
        setSelectedId(partnerId);
        setSaveError(null);
        setSaveSucceeded(false);
    };

    const updateField = <K extends keyof PartnerLaundryConfigurationInput>(
        key: K,
        value: PartnerLaundryConfigurationInput[K]
    ) => setDraft((current) => (current ? { ...current, [key]: value } : current));

    const updateAddress = (key: keyof PartnerAddress, value: string) =>
        setDraft((current) =>
            current ? { ...current, address: { ...current.address, [key]: value } } : current
        );

    const updateServicePincode = (index: number, value: string) =>
        setDraft((current) =>
            current
                ? {
                      ...current,
                      servicePincodes: current.servicePincodes.map((pincode, position) =>
                          position === index ? value : pincode
                      ),
                  }
                : current
        );

    const addServicePincode = () =>
        setDraft((current) =>
            current && current.servicePincodes.length < 50
                ? { ...current, servicePincodes: [...current.servicePincodes, ''] }
                : current
        );

    const removeServicePincode = (index: number) =>
        setDraft((current) =>
            current && current.servicePincodes.length > 1
                ? {
                      ...current,
                      servicePincodes: current.servicePincodes.filter(
                          (_, position) => position !== index
                      ),
                  }
                : current
        );

    const updateHolidayClosure = (index: number, value: Partial<HolidayClosure>) =>
        setDraft((current) =>
            current
                ? {
                      ...current,
                      holidayClosures: current.holidayClosures.map((closure, position) =>
                          position === index ? { ...closure, ...value } : closure
                      ),
                  }
                : current
        );

    const addHolidayClosure = () =>
        setDraft((current) =>
            current && current.holidayClosures.length < 60
                ? {
                      ...current,
                      holidayClosures: [...current.holidayClosures, { date: '', reason: '' }],
                  }
                : current
        );

    const removeHolidayClosure = (index: number) =>
        setDraft((current) =>
            current
                ? {
                      ...current,
                      holidayClosures: current.holidayClosures.filter(
                          (_, position) => position !== index
                      ),
                  }
                : current
        );

    const updateHours = (weekday: number, value: Partial<OpeningHours>) =>
        setDraft((current) =>
            current
                ? {
                      ...current,
                      openingHours: current.openingHours.map((hour) =>
                          hour.weekday === weekday ? { ...hour, ...value } : hour
                      ),
                  }
                : current
        );

    const setDayClosed = (weekday: number, closed: boolean) =>
        updateHours(
            weekday,
            closed ? { opensAt: null, closesAt: null } : { opensAt: '08:00', closesAt: '20:00' }
        );

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!effectiveId || !draft || isSaving) return;

        setIsSaving(true);
        setSaveError(null);
        setSaveSucceeded(false);
        try {
            const saved = await updatePartnerLaundry(effectiveId, draft);
            setSavedById((current) => ({ ...current, [saved.id]: saved }));
            setDraft(toDraft(saved));
            setSaveSucceeded(true);
        } catch (error) {
            setSaveError(asApiError(error));
        } finally {
            setIsSaving(false);
        }
    };

    return {
        loadState,
        configurations,
        selected,
        selectedId: effectiveId,
        draft,
        isSaving,
        saveError,
        saveSucceeded,
        selectLaundry,
        updateField,
        updateAddress,
        updateServicePincode,
        addServicePincode,
        removeServicePincode,
        updateHolidayClosure,
        addHolidayClosure,
        removeHolidayClosure,
        updateHours,
        setDayClosed,
        save,
    };
};
