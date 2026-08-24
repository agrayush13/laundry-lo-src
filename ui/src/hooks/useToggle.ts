import { useCallback, useState } from 'react';

/** Boolean state with a stable toggle, for disclosures and edit modes. */
export const useToggle = (initial = false) => {
    const [isOn, setIsOn] = useState(initial);

    return {
        isOn,
        on: useCallback(() => setIsOn(true), []),
        off: useCallback(() => setIsOn(false), []),
        toggle: useCallback(() => setIsOn((current) => !current), []),
    };
};
