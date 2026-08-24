import '@testing-library/jest-dom';

// Cart, session and theme all persist to localStorage, so every test needs to
// start from a clean slate or state leaks between them.
beforeEach(() => {
    window.localStorage.clear();
});
