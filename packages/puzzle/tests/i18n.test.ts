import { describe, expect, it } from 'vitest';
import { CLUE_TYPES, THEMES, generatePuzzle } from '../src/index.js';
import type { Clue, ClueEntry, ClueType } from '../src/index.js';
import { LOCALES, createClueTranslator, de, en } from '../src/i18n/index.js';
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
const scene = { rooms: index.scene.rooms, suspects };

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
  const leftoverKey = /\b(clue|object|room|common)(\.[a-zA-Z_]+){2,}/;
  return text.length > 5
    && /[.!?]$/.test(text)
    && !text.includes('{{')
    && !text.includes('undefined')
    && !leftoverKey.test(text);
}

describe('clue rendering', () => {
  for (const locale of LOCALES) {
    describe(locale, () => {
      const translator = createClueTranslator({ locale });

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
          ownerId: 0, clue: { type: 'ADJACENT_OBJECT', objectKey: 'chair', count: 1 },
        });
        const many = translator.render(scene, {
          ownerId: 0, clue: { type: 'ADJACENT_OBJECT', objectKey: 'chair', count: 3 },
        });
        expect(one).not.toBe(many);
        expect(many).toContain('3');
      });

      it('names rooms', () => {
        expect(translator.roomName('workshop').length).toBeGreaterThan(3);
      });
    });
  }

  it('renders differently in each language', () => {
    const german = createClueTranslator({ locale: 'de' });
    const english = createClueTranslator({ locale: 'en' });
    const entry: ClueEntry = { ownerId: 0, clue: { type: 'CORNER' } };
    expect(german.render(scene, entry)).not.toBe(english.render(scene, entry));
  });

  it('switches language on an existing translator', () => {
    const translator = createClueTranslator({ locale: 'de' });
    const entry: ClueEntry = { ownerId: 0, clue: { type: 'CORNER' } };
    const german = translator.render(scene, entry);
    translator.setLocale('en');
    expect(translator.render(scene, entry)).not.toBe(german);
  });

  it('accepts extra resources for a custom theme', () => {
    const translator = createClueTranslator({
      locale: 'en',
      additionalResources: {
        en: { object: { spaceship: { on: 'in a spaceship', dative: 'a spaceship', plural: 'spaceships', nominative: 'a spaceship', bare: 'spaceship', from: 'the spaceship' } } },
      },
    });
    const text = translator.render(scene, { ownerId: 0, clue: { type: 'ON_OBJECT', objectKey: 'spaceship' } });
    expect(text).toContain('spaceship');
  });
});

describe('resource completeness', () => {
  const bundles = { de, en };

  it.each(LOCALES)('%s covers every object of every theme', (locale) => {
    const missing: string[] = [];
    for (const theme of THEMES) {
      for (const object of theme.objects) {
        if (!(object.key in bundles[locale].object)) missing.push(`${theme.key}/${object.key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it.each(LOCALES)('%s covers every room of every theme', (locale) => {
    const missing: string[] = [];
    for (const theme of THEMES) {
      for (const room of theme.roomKeys) {
        if (!(room in bundles[locale].room)) missing.push(`${theme.key}/${room}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it.each(LOCALES)('%s has a template for every clue type', (locale) => {
    const templates = Object.keys(bundles[locale].clue);
    for (const type of CLUE_TYPES) {
      const covered = templates.some((key) => key === type || key.startsWith(`${type}_`));
      expect(covered, `${locale} is missing a template for ${type}`).toBe(true);
    }
  });

  it('renders every clue of real puzzles in both languages', () => {
    const translators = LOCALES.map((locale) => createClueTranslator({ locale }));
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
