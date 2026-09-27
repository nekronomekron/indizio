import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY_ORDER, GENERATOR_VERSION, MAX_GRID_SIZE, MIN_GRID_SIZE, SIZES_BY_DIFFICULTY,
  SeedError, THEME_KEYS, dailyDifficulty, dailySeed, difficultyOfSize, formatSeed, isValidSeed,
  makeSeed, parseSeed, weekdayOf,
} from '../../src/engine/index.js';

/**
 * Seeds.
 *
 * A seed is a promise that a link keeps: whoever opens it gets the same case.
 * These tests guard both halves of that — the encoding survives a round trip,
 * and anything malformed is rejected loudly rather than quietly reinterpreted.
 */

describe('seed encoding', () => {
  it('round-trips without loss', () => {
    for (const difficulty of DIFFICULTY_ORDER) {
      for (const size of SIZES_BY_DIFFICULTY[difficulty]) {
        const parts = { version: GENERATOR_VERSION, themeKey: 'garage', size, difficulty, random: 0xc0ffee };
        expect(parseSeed(formatSeed(parts))).toEqual(parts);
      }
    }
  });

  it('derives the difficulty from the size', () => {
    for (const size of [5, 6, 7, 8, 9, 10]) {
      expect(parseSeed(makeSeed('garage', size, 1)).difficulty).toBe(difficultyOfSize(size));
    }
  });

  it('is case-insensitive and tolerates surrounding space', () => {
    const seed = makeSeed('garage', 6, 42);
    expect(parseSeed(`  ${seed.toUpperCase()}  `)).toEqual(parseSeed(seed));
  });

  it('rejects anything malformed', () => {
    const bad = [
      '', 'nonsense', 'v2-garage-6-vl', 'v2-garage-6-vl-abc-extra',
      'x2-garage-6-vl-abc', 'v2-garage-99-vl-abc', 'v2-garage-6-zz-abc',
      `v2-garage-${MIN_GRID_SIZE - 1}-vl-abc`, `v2-garage-${MAX_GRID_SIZE + 1}-x-abc`,
    ];
    for (const seed of bad) {
      expect(isValidSeed(seed), `should reject ${seed}`).toBe(false);
      expect(() => parseSeed(seed)).toThrow(SeedError);
    }
  });

  it('rejects an unknown theme when a list is given', () => {
    const seed = makeSeed('garage', 6, 1);
    expect(isValidSeed(seed, { themeKeys: THEME_KEYS })).toBe(true);
    expect(isValidSeed(seed, { themeKeys: ['other'] })).toBe(false);
  });

  it('accepts any syntactically valid theme when no list is given', () => {
    expect(isValidSeed('v2-custom-6-vl-abc')).toBe(true);
  });
});

describe('daily seed', () => {
  const august28 = { year: 2026, month: 8, day: 28 };

  it('is stable for a given date', () => {
    expect(dailySeed(august28, THEME_KEYS)).toBe(dailySeed(august28, THEME_KEYS));
  });

  it('differs from day to day', () => {
    const first = dailySeed(august28, THEME_KEYS);
    const second = dailySeed({ year: 2026, month: 8, day: 29 }, THEME_KEYS);
    expect(first).not.toBe(second);
  });

  it('needs at least one theme', () => {
    expect(() => dailySeed(august28, [])).toThrow(SeedError);
  });

  it('refuses anything that is not a date', () => {
    for (const wrong of [
      { year: 2026, month: 13, day: 1 },
      { year: 2026, month: 0, day: 1 },
      { year: 2026, month: 2, day: 29 },   // 2026 is no leap year
      { year: 2026, month: 4, day: 31 },
      { year: 2026, month: 1, day: 0 },
    ]) {
      expect(() => dailySeed(wrong, THEME_KEYS), JSON.stringify(wrong)).toThrow(SeedError);
    }
    // …but a real leap day is a day like any other.
    expect(() => dailySeed({ year: 2028, month: 2, day: 29 }, THEME_KEYS)).not.toThrow();
  });
});

describe('the weekly rhythm', () => {
  /**
   * The weekday is worked out with arithmetic rather than read from a `Date`,
   * because the engine may not build one. That makes it worth checking against
   * something independent — so these are dates whose weekday is a matter of
   * record, not of the same formula asked twice.
   */
  it('names the weekday of known dates', () => {
    expect(weekdayOf({ year: 2026, month: 1, day: 1 })).toBe(4);    // Thursday
    expect(weekdayOf({ year: 2000, month: 1, day: 1 })).toBe(6);    // Saturday, a leap year
    expect(weekdayOf({ year: 1900, month: 3, day: 1 })).toBe(4);    // Thursday, no leap year
    expect(weekdayOf({ year: 2028, month: 2, day: 29 })).toBe(2);   // Tuesday, the leap day
    expect(weekdayOf({ year: 2026, month: 9, day: 27 })).toBe(0);   // Sunday
  });

  it('agrees with the platform for a whole year', () => {
    for (let day = 0; day < 366; day++) {
      const date = new Date(Date.UTC(2026, 0, 1 + day));
      const mine = weekdayOf({
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
      });
      expect(mine, date.toISOString()).toBe(date.getUTCDay());
    }
  });

  it('gives each weekday its tier, and Sunday the long one', () => {
    // 2026-09-27 is a Sunday; the week after it walks Monday to Saturday.
    const week = [
      ['expert', 27], ['veryEasy', 28], ['easy', 29], ['easy', 30],
    ] as const;
    for (const [tier, day] of week) {
      expect(dailyDifficulty({ year: 2026, month: 9, day }), String(day)).toBe(tier);
    }
    expect(dailyDifficulty({ year: 2026, month: 10, day: 1 })).toBe('medium');   // Thursday
    expect(dailyDifficulty({ year: 2026, month: 10, day: 2 })).toBe('medium');   // Friday
    expect(dailyDifficulty({ year: 2026, month: 10, day: 3 })).toBe('hard');     // Saturday
  });

  it('gives the day a grid size that matches its tier', () => {
    for (let day = 1; day <= 28; day++) {
      const date = { year: 2026, month: 9, day };
      const parts = parseSeed(dailySeed(date, THEME_KEYS));
      expect(parts.difficulty, String(day)).toBe(dailyDifficulty(date));
      expect(difficultyOfSize(parts.size), String(day)).toBe(parts.difficulty);
    }
  });
});
