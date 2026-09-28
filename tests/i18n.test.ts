import { describe, expect, it } from 'vitest';
import { createClueTranslator } from '@engine/i18n';
import { defaultSettings } from '../src/app/features/settings/settings.js';
import { RESOURCES, createAppI18n, detectLocale, isLocale } from '../src/app/shared/i18n/i18n.js';

/**
 * The app's i18n (PLAN.md §14, U3): one instance for UI, help and clues, the
 * first language taken from the browser.
 */

describe('first language', () => {
  it('follows a German browser', () => {
    expect(detectLocale(['de-DE', 'en'])).toBe('de');
    expect(detectLocale(['de-AT'])).toBe('de');
    expect(detectLocale(['DE'])).toBe('de');
  });

  it('is English for everything else', () => {
    expect(detectLocale(['fr-FR', 'it'])).toBe('en');
    expect(detectLocale([])).toBe('en');
    expect(detectLocale(['en-GB', 'de'])).toBe('en');
  });

  it('seeds the default settings', () => {
    expect(defaultSettings(['de-CH']).locale).toBe('de');
    expect(defaultSettings(['nl']).locale).toBe('en');
  });

  it('only accepts languages the game speaks', () => {
    expect(isLocale('de')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe('one instance for everything', () => {
  it('switches UI texts and clue sentences together', () => {
    const i18n = createAppI18n('de');
    const clues = createClueTranslator({ instance: i18n });
    expect(i18n.t('confirm')).toBe('Bestätigen');
    expect(clues.themeName('garage')).toBe('Autowerkstatt');

    void i18n.changeLanguage('en');
    expect(i18n.t('confirm')).toBe('Confirm');
    expect(clues.themeName('garage')).toBe('Car repair shop');
    expect(clues.locale).toBe('en');
  });

  it('lets the clue translator switch the shared instance', () => {
    const i18n = createAppI18n('en');
    const clues = createClueTranslator({ instance: i18n });
    clues.setLocale('de');
    expect(i18n.language).toBe('de');
    expect(i18n.t('confirm')).toBe('Bestätigen');
  });
});

describe('resources', () => {
  /** Every leaf of a resource tree, as a dotted path. */
  function leaves(value: unknown, path = ''): string[] {
    if (typeof value === 'string') return [path];
    if (Array.isArray(value))
      return value.flatMap((entry, index) => leaves(entry, `${path}[${String(index)}]`));
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value).flatMap(([key, entry]) => leaves(entry, path ? `${path}.${key}` : key));
    }
    return [path];
  }

  it('have the same keys in both languages', () => {
    // The types already say so; arrays of different lengths they cannot see.
    for (const namespace of ['ui', 'help'] as const) {
      expect(leaves(RESOURCES.de[namespace]).sort()).toEqual(leaves(RESOURCES.en[namespace]).sort());
    }
  });

  it('have no empty texts', () => {
    for (const locale of ['de', 'en'] as const) {
      for (const namespace of ['ui', 'help'] as const) {
        const empty = leaves(RESOURCES[locale][namespace]).filter((path) => {
          const value = path
            .split(/\.|\[|\]/)
            .filter(Boolean)
            .reduce<unknown>(
              (node, key) => (node as Record<string, unknown>)[key],
              RESOURCES[locale][namespace],
            );
          return typeof value !== 'string' || value.trim() === '';
        });
        expect(empty, `${locale}/${namespace}`).toEqual([]);
      }
    }
  });
});
