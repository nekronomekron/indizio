import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.js';
import { sweepOldStorage } from './app/storage/store.js';
import './styles/base.css';

// Einmal beim Start: Eintraege frueherer Fassungen wegraeumen. Sie werden nie
// wieder gelesen und belegen bei einem 10x10 schnell hunderte Kilobyte.
sweepOldStorage();

// Offline-Betrieb nur im gebauten Stand - im Entwicklungsserver stoert der Cache.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
