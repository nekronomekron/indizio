import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { App } from './app/App.js';
import { loadSettings } from './app/features/settings/settings.js';
import { createAppI18n } from './app/shared/i18n/i18n.js';
import { sweepOldStorage } from './app/shared/storage/store.js';
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

const i18n = createAppI18n(loadSettings().locale);
// Screen readers and hyphenation follow the page language.
document.documentElement.lang = i18n.language;
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>,
);
