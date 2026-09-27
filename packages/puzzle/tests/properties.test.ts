import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { Rng, THEME_KEYS, generatePuzzle, makeSeed, stringifyPuzzle } from '../src/index.js';
import { expectSoundPuzzle } from './support/invariants.js';

/**
 * Property tests.
 *
 * Examples can only show that the puzzles somebody thought to write down are
 * sound. These generate arbitrary ones and check the same claims on every
 * single one — which is the only honest way to say "every puzzle is solvable"
 * about a generator that will produce puzzles nobody has seen.
 *
 * This tier stays on small grids so it runs in seconds; `test:deep` covers
 * every size with far more cases.
 */

const FAST_RUNS = 12;

/** Seeds for the quick tier: small grids, every theme. */
const smallSeedArbitrary = fc
  .record({
    theme: fc.constantFrom(...THEME_KEYS),
    size: fc.constantFrom(5, 6),
    random: fc.integer({ min: 0, max: 2 ** 30 }),
  })
  .map(({ theme, size, random }) => makeSeed(theme, size, random));

describe('every generated puzzle', () => {
  it('is structurally sound, uniquely solvable, portable and translatable', () => {
    fc.assert(
      fc.property(smallSeedArbitrary, (seed) => {
        const { core } = generatePuzzle(seed);
        expectSoundPuzzle(core);
      }),
      { numRuns: FAST_RUNS, verbose: true },
    );
  });

  it('comes out identical from the same seed', () => {
    fc.assert(
      fc.property(smallSeedArbitrary, (seed) => {
        expect(stringifyPuzzle(generatePuzzle(seed).core))
          .toBe(stringifyPuzzle(generatePuzzle(seed).core));
      }),
      { numRuns: FAST_RUNS },
    );
  });

  it('differs when the seed differs', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.integer({ min: 0, max: 2 ** 30 }), { minLength: 2, maxLength: 2 }),
        ([first, second]) => {
          const one = stringifyPuzzle(generatePuzzle(makeSeed('garage', 5, first!)).core);
          const other = stringifyPuzzle(generatePuzzle(makeSeed('garage', 5, second!)).core);
          expect(one).not.toBe(other);
        },
      ),
      { numRuns: 6 },
    );
  });
});

describe('the random number generator', () => {
  it('replays exactly from the same seed', () => {
    fc.assert(
      fc.property(fc.string(), (seed) => {
        const first = Array.from({ length: 40 }, () => new Rng(seed).nextUint32());
        const second = Array.from({ length: 40 }, () => new Rng(seed).nextUint32());
        expect(first).toEqual(second);
      }),
      { numRuns: 40 },
    );
  });

  it('diverges for seeds that differ by one character', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 12 }), (seed) => {
        const one = new Rng(seed);
        const other = new Rng(`${seed}x`);
        const differs = Array.from({ length: 8 }, () => one.nextUint32() !== other.nextUint32());
        expect(differs.some(Boolean)).toBe(true);
      }),
      { numRuns: 40 },
    );
  });

  it('keeps every draw inside its bounds', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer({ min: 1, max: 1000 }), (seed, bound) => {
        const rng = new Rng(seed);
        for (let draw = 0; draw < 20; draw++) {
          const value = rng.nextInt(bound);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThan(bound);
        }
      }),
      { numRuns: 30 },
    );
  });

  it('shuffles without losing or duplicating anything', () => {
    fc.assert(
      fc.property(fc.string(), fc.array(fc.integer(), { maxLength: 30 }), (seed, items) => {
        const shuffled = new Rng(seed).shuffled(items);
        expect([...shuffled].sort((a, b) => a - b)).toEqual([...items].sort((a, b) => a - b));
      }),
      { numRuns: 30 },
    );
  });

  it('refuses a non-positive bound rather than returning nonsense', () => {
    expect(() => new Rng('x').nextInt(0)).toThrow(RangeError);
    expect(() => new Rng('x').pick([])).toThrow(RangeError);
  });
});
