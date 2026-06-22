import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Public routes are prerendered to static HTML at build time (see
// scripts/prerender.mjs) so crawlers receive complete markup. The client still
// boots normally here and re-renders the app on mount over that static shell.
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);