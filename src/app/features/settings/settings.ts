import * as v from 'valibot';
import { LOCALES, detectLocale } from '../../shared/i18n/i18n.js';
import { SETTINGS_KEY, readStored, writeStored } from '../../shared/storage/store.js';

/** How long a square must be held to place someone. Outside this it stops feeling like a hold. */
export const HOLD_MS_MIN = 200;
export const HOLD_MS_MAX = 600;

const SettingsSchema = v.object({
  locale: v.picklist(LOCALES),
  holdMs: v.pipe(v.number(), v.integer(), v.minValue(HOLD_MS_MIN), v.maxValue(HOLD_MS_MAX)),
  vibrate: v.boolean(),
  /** Names of room, prop and person when resting on a square. */
  names: v.boolean(),
});

export type Settings = v.InferOutput<typeof SettingsSchema>;

/** The browser's preferred languages; empty where there is no browser. */
function browserLanguages(): readonly string[] {
  return typeof navigator === 'undefined' ? [] : navigator.languages;
}

/** Defaults for a first visit. The language follows the browser (PLAN.md §14, U3). */
export function defaultSettings(languages: readonly string[] = browserLanguages()): Settings {
  return { locale: detectLocale(languages), holdMs: 350, vibrate: true, names: true };
}

/**
 * The saved settings, each field checked on its own: one broken value costs
 * that value, not the player's other choices. A stored `holdMs` of 5000 falls
 * back to the default; the chosen language stays.
 */
export function loadSettings(languages: readonly string[] = browserLanguages()): Settings {
  const defaults = defaultSettings(languages);
  const stored = readStored(SETTINGS_KEY, v.record(v.string(), v.unknown()));
  if (!stored) return defaults;
  const field = <K extends keyof Settings>(key: K): Settings[K] => {
    const result = v.safeParse(SettingsSchema.entries[key], stored[key]);
    return result.success ? (result.output as Settings[K]) : defaults[key];
  };
  return {
    locale: field('locale'),
    holdMs: field('holdMs'),
    vibrate: field('vibrate'),
    names: field('names'),
  };
}

export function saveSettings(settings: Settings): void {
  writeStored(SETTINGS_KEY, settings);
}
