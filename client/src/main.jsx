import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import 'leaflet/dist/leaflet.css';
import './index.css';

// Suppress unhandled errors injected by third-party browser extensions (e.g. reportAllChanges / startTime)
window.addEventListener('error', (event) => {
  const msg = event.message || '';
  if (
    msg.includes('startTime') ||
    msg.includes('reportAllChanges') ||
    !event.filename ||
    event.filename.includes('chrome-extension') ||
    event.filename.includes('moz-extension')
  ) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = String(event.reason || '');
  if (reasonStr.includes('startTime') || reasonStr.includes('reportAllChanges')) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
