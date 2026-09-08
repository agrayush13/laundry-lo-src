import React from 'react';
import { createRoot } from 'react-dom/client';
import { analytics } from './services/analyticsServices';
import App from './App';
import './index.scss';

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container #root not found');
}

const root = createRoot(container);
analytics.initialize();
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
