import React from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './App';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
    throw new Error('Missing root element');
}

createRoot(root).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
