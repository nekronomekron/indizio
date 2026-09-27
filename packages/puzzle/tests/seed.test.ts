import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY_ORDER, GENERATOR_VERSION, MAX_GRID_SIZE, MIN_GRID_SIZE, SIZES_BY_DIFFICULTY,
  SeedError, THEME_KEYS, dailySeed, difficultyOfSize, formatSeed, isValidSeed, makeSeed, parseSeed,
} from '../src/index.js';

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
  it('is stable for a given date', () => {
    const date = new Date(Date.UTC(2026, 7, 28));
    expect(dailySeed(date, THEME_KEYS, 6)).toBe(dailySeed(date, THEME_KEYS, 6));
  });

  it('differs from day to day', () => {
    const first = dailySeed(new Date(Date.UTC(2026, 7, 28)), THEME_KEYS, 6);
    const second = dailySeed(new Date(Date.UTC(2026, 7, 29)), THEME_KEYS, 6);
    expect(first).not.toBe(second);
  });

  it('needs at least one theme', () => {
    expect(() => dailySeed(new Date(), [], 6)).toThrow(SeedError);
  });
});
