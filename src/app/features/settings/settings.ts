import { detectLocale, type Locale } from '../../shared/i18n/i18n.js';
import { SETTINGS_KEY, readJson, writeJson } from '../../shared/storage/store.js';

export interface Settings {
  locale: Locale;
  holdMs: number;
  vibrate: boolean;
  /** Namen von Raum, Requisite und Person beim Verweilen auf einem Feld. */
  names: boolean;
}

/** The browser's preferred languages; empty where there is no browser. */
function browserLanguages(): readonly string[] {
  return typeof navigator === 'undefined' ? [] : navigator.languages;
}

/** Defaults for a first visit. The language follows the browser (PLAN.md §14, U3). */
export function defaultSettings(languages: readonly string[] = browserLanguages()): Settings {
  return { locale: detectLocale(languages), holdMs: 350, vibrate: true, names: true };
}

export function loadSettings(languages: readonly string[] = browserLanguages()): Settings {
  return { ...defaultSettings(languages), ...((readJson(SETTINGS_KEY) as Partial<Settings> | null) ?? {}) };
}

export function saveSettings(settings: Settings): void {
  writeJson(SETTINGS_KEY, settings);
}
