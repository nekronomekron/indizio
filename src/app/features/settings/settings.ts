import { SETTINGS_KEY, readJson, writeJson } from '../../shared/storage/store.js';

export interface Settings {
  locale: 'de' | 'en';
  holdMs: number;
  vibrate: boolean;
  /** Namen von Raum, Requisite und Person beim Verweilen auf einem Feld. */
  names: boolean;
}

export const DEFAULT_SETTINGS: Settings = { locale: 'de', holdMs: 350, vibrate: true, names: true };

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...((readJson(SETTINGS_KEY) as Partial<Settings> | null) ?? {}) };
}

export function saveSettings(settings: Settings): void {
  writeJson(SETTINGS_KEY, settings);
}
