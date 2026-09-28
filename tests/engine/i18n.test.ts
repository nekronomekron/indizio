import { describe, expect, it } from 'vitest';
import { CLUE_TYPES, THEMES, findTheme, generatePuzzle } from '../../src/engine/index.js';
import type { Clue, ClueEntry, ClueType, Theme, ThemeTexts } from '../../src/engine/index.js';
import { LOCALES, createClueTranslator, de, en } from '../../src/engine/i18n/index.js';
import { buildFixture } from './support/fixture.js';
import { seedsAcrossTiers } from './support/seeds.js';

/**
 * Rendering clues as sentences.
 *
 * Two things can go wrong and neither shows up in a type check: a missing word
 * form leaves a key visible in the sentence, and a missing template leaves an
 * empty string. Both are checked for every clue type in every language.
 */

const { suspects, index } = buildFixture();
const scene = { themeKey: index.scene.themeKey, rooms: index.scene.rooms, suspects };

/**
 * The fixture's theme: two garage rooms, garage shelf and chair, a garden
 * tree. Built from the real texts — and a custom theme bringing its own texts
 * is exactly what a consumer does.
 */
const garage = findTheme('garage')!;
const garden = findTheme('garden')!;
function fixtureTexts(locale: 'de' | 'en'): ThemeTexts {
  const { rooms, objects } = garage.texts[locale];
  return {
    name: 'Test',
    rooms: { workshop: rooms['workshop']!, storage: rooms['storage']! },
    objects: {
      shelf: objects['shelf']!,
      chair: objects['chair']!,
      tree: garden.texts[locale].objects['tree']!,
    },
  };
}
const FIXTURE_THEME: Theme = {
  key: 'test',
  rooms: [],
  objects: [],
  texts: { de: fixtureTexts('de'), en: fixtureTexts('en') },
};
const themes = [...THEMES, FIXTURE_THEME];

/** One clue of every type, valid against the fixture's shape. */
const SAMPLES: Record<ClueType, Clue> = {
  ON_OBJECT: { type: 'ON_OBJECT', objectKey: 'chair' },
  IN_ROOM: { type: 'IN_ROOM', roomId: 0 },
  ADJACENT_OBJECT: { type: 'ADJACENT_OBJECT', objectKey: 'shelf' },
  ALONE: { type: 'ALONE' },
  SAME_ROOM_AS: { type: 'SAME_ROOM_AS', otherId: 1 },
  DIRECTION_OF_SUSPECT: { type: 'DIRECTION_OF_SUSPECT', direction: 'west', otherId: 1 },
  DIRECTION_OF_OBJECT: { type: 'DIRECTION_OF_OBJECT', direction: 'north', objectKey: 'tree' },
  CORNER: { type: 'CORNER' },
  ALIGNED_WITH_OBJECT: { type: 'ALIGNED_WITH_OBJECT', axis: 'row', objectKey: 'tree' },
  DIAGONAL_OF: { type: 'DIAGONAL_OF', otherId: 1 },
  ALONE_WITH: { type: 'ALONE_WITH', otherIds: [1, 2] },
  VICTIM: { type: 'VICTIM' },
  EMPTY_ROOM: { type: 'EMPTY_ROOM', roomId: 1 },
  ROOM_COUNT: { type: 'ROOM_COUNT', roomId: 0, count: 3 },
};

/**
 * A rendered clue should read as prose. The interesting failure is a leftover
 * translation key such as `room.workshop.in`, which is why this looks for
 * dotted key paths rather than for full stops — English prose is full of
 * sentences ending in "the room."
 */
function looksLikeASentence(text: string): boolean {
  const leftoverKey = /\b(clue|themes|common)(\.[a-zA-Z_]+){2,}/;
  return (
    text.length > 5 &&
    /[.!?]$/.test(text) &&
    !text.includes('{{') &&
    !text.includes('undefined') &&
    !leftoverKey.test(text)
  );
}

describe('clue rendering', () => {
  for (const locale of LOCALES) {
    describe(locale, () => {
      const translator = createClueTranslator({ locale, themes });

      it.each(CLUE_TYPES)('renders %s as a full sentence', (type) => {
        const clue = SAMPLES[type];
        const ownerId = clue.type === 'EMPTY_ROOM' || clue.type === 'ROOM_COUNT' ? null : 0;
        const text = translator.render(scene, { ownerId, clue });
        expect(text, `${locale}/${type}: "${text}"`).toSatisfy(looksLikeASentence);
      });

      it('uses the right pronoun for each gender', () => {
        const male = translator.render(scene, { ownerId: 0, clue: { type: 'CORNER' } });
        const female = translator.render(scene, { ownerId: 1, clue: { type: 'CORNER' } });
        expect(male).not.toBe(female);
      });

      it('picks singular and plural apart', () => {
        const one = translator.render(scene, {
          ownerId: 0,
          clue: { type: 'ADJACENT_OBJECT', objectKey: 'chair', count: 1 },
        });
        const many = translator.render(scene, {
          ownerId: 0,
          clue: { type: 'ADJACENT_OBJECT', objectKey: 'chair', count: 3 },
        });
        expect(one).not.toBe(many);
        expect(many).toContain('3');
      });

      it('names rooms', () => {
        expect(translator.roomName('garage', 'workshop').length).toBeGreaterThan(3);
      });

      /**
       * The bare noun, not a sentence fragment: a tooltip says `Regal`, and
       * `an einem Regal` would read like a clue that lost its verb.
       */
      it('names objects without an article or preposition', () => {
        const name = translator.objectName('test', 'shelf');
        expect(name.length).toBeGreaterThan(2);
        expect(name).not.toBe('themes.test.objects.shelf.bare');
        // The phrase inside a clue carries the preposition; the name alone must not.
        const inClue = translator.render(scene, {
          ownerId: 0,
          clue: { type: 'ON_OBJECT', objectKey: 'shelf' },
        });
        expect(inClue).not.toBe(name);
        expect(inClue).toContain(name);
      });
    });
  }

  it('renders differently in each language', () => {
    const german = createClueTranslator({ locale: 'de', themes });
    const english = createClueTranslator({ locale: 'en', themes });
    const entry: ClueEntry = { ownerId: 0, clue: { type: 'CORNER' } };
    expect(german.render(scene, entry)).not.toBe(english.render(scene, entry));
  });

  it('switches language on an existing translator', () => {
    const translator = createClueTranslator({ locale: 'de', themes });
    const entry: ClueEntry = { ownerId: 0, clue: { type: 'CORNER' } };
    const german = translator.render(scene, entry);
    translator.setLocale('en');
    expect(translator.render(scene, entry)).not.toBe(german);
  });

  it('keeps same-named objects of different themes apart', () => {
    // Keys only have to be unique within a theme: a workshop chair may be
    // called something else than a kitchen chair.
    const renamed = (locale: 'de' | 'en', bare: string): ThemeTexts => ({
      ...fixtureTexts(locale),
      objects: { chair: { ...fixtureTexts(locale).objects['chair']!, bare } },
    });
    const custom: Theme = {
      ...FIXTURE_THEME,
      key: 'custom',
      texts: { de: renamed('de', 'Thron'), en: renamed('en', 'throne') },
    };
    const translator = createClueTranslator({ locale: 'en', themes: [...themes, custom] });
    expect(translator.objectName('custom', 'chair')).toBe('throne');
    expect(translator.objectName('test', 'chair')).not.toBe('throne');
  });
});

describe('resource completeness', () => {
  const bundles = { de, en };

  it.each(LOCALES)('%s gives every theme a name', (locale) => {
    for (const theme of THEMES) expect(theme.texts[locale].name.length, theme.key).toBeGreaterThan(2);
  });

  it.each(LOCALES)('%s has every word form of every object of every theme', (locale) => {
    const forms = ['on', 'dative', 'plural', 'nominative', 'bare', 'from'] as const;
    const missing: string[] = [];
    for (const theme of THEMES) {
      for (const object of theme.objects) {
        const words = theme.texts[locale].objects[object.key];
        for (const form of forms) if (!words?.[form]) missing.push(`${theme.key}/${object.key}.${form}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it.each(LOCALES)('%s names and places every room of every theme', (locale) => {
    const missing: string[] = [];
    for (const theme of THEMES) {
      for (const room of theme.rooms) {
        const words = theme.texts[locale].rooms[room.key];
        if (!words?.name || !words.in) missing.push(`${theme.key}/${room.key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it.each(LOCALES)('%s has no texts for objects or rooms a theme does not have', (locale) => {
    const stray: string[] = [];
    for (const theme of THEMES) {
      const objects = new Set(theme.objects.map((object) => object.key));
      const rooms = new Set(theme.rooms.map((room) => room.key));
      for (const key of Object.keys(theme.texts[locale].objects))
        if (!objects.has(key)) stray.push(`${theme.key}/${key}`);
      for (const key of Object.keys(theme.texts[locale].rooms))
        if (!rooms.has(key)) stray.push(`${theme.key}/${key}`);
    }
    expect(stray).toEqual([]);
  });

  it.each(LOCALES)('%s has a template for every clue type', (locale) => {
    const templates = Object.keys(bundles[locale].clue);
    for (const type of CLUE_TYPES) {
      const covered = templates.some((key) => key === type || key.startsWith(`${type}_`));
      expect(covered, `${locale} is missing a template for ${type}`).toBe(true);
    }
  });

  it('renders every clue of real puzzles in both languages', () => {
    const translators = LOCALES.map((locale) => createClueTranslator({ locale, themes }));
    for (const { seed } of seedsAcrossTiers(1)) {
      const { core } = generatePuzzle(seed);
      for (const translator of translators) {
        for (const entry of core.clues) {
          const text = translator.render(core, entry);
          expect(text, `${seed}: ${entry.clue.type}`).toSatisfy(looksLikeASentence);
        }
      }
    }
  });
});
