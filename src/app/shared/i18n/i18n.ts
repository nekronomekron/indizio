import i18next, { type i18n as I18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LOCALES, type Locale } from '@engine/i18n';
import { help as helpDe } from './resources/de/help.js';
import { ui as uiDe } from './resources/de/ui.js';
import { help as helpEn } from './resources/en/help.js';
import { ui as uiEn } from './resources/en/ui.js';

export { LOCALES, type Locale };

/** Namespaces of the app. The engine adds its own, `puzzle`, for clue sentences. */
export const RESOURCES = {
  de: { ui: uiDe, help: helpDe },
  en: { ui: uiEn, help: helpEn },
} as const;

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale === value);
}

/**
 * The language to start in on a first visit: German for any German browser
 * setting, English for everything else. After that, the saved setting wins.
 */
export function detectLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return 'en';
}

/**
 * The one i18next instance of the app (PLAN.md §14, U3). UI texts, help texts
 * and — through `useClueTranslator` — the engine's clue sentences all live in
 * it, so switching the language switches everything at once.
 *
 * Resources are bundled, not fetched: initialisation is synchronous and the
 * game stays playable offline.
 */
export function createAppI18n(locale: Locale): I18n {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    lng: locale,
    fallbackLng: 'en',
    supportedLngs: LOCALES,
    ns: ['ui', 'help'],
    defaultNS: 'ui',
    resources: RESOURCES,
    initAsync: false,
    interpolation: { escapeValue: false },
  });
  return instance;
}
