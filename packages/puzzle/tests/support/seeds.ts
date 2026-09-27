import { DIFFICULTY_ORDER, SIZES_BY_DIFFICULTY, THEME_KEYS, makeSeed } from '../../src/index.js';
import type { DifficultyKey } from '../../src/index.js';

/**
 * Seed helpers shared by the test suites.
 *
 * Tests pick seeds deterministically rather than at random, so any failure can
 * be reproduced from the report alone — which matters more here than variety,
 * because the property tests already supply the variety.
 */

export interface TieredSeed {
  seed: string;
  difficulty: DifficultyKey;
  size: number;
}

/** `count` seeds per difficulty tier, walking themes and sizes in step. */
export function seedsAcrossTiers(count: number, salt = 0): TieredSeed[] {
  const seeds: TieredSeed[] = [];
  for (const difficulty of DIFFICULTY_ORDER) {
    const sizes = SIZES_BY_DIFFICULTY[difficulty];
    for (let index = 0; index < count; index++) {
      const size = sizes[index % sizes.length]!;
      const theme = THEME_KEYS[index % THEME_KEYS.length]!;
      seeds.push({ seed: makeSeed(theme, size, 0x51e0 + salt + index * 15485863), difficulty, size });
    }
  }
  return seeds;
}

/** Seeds on the smallest grids — fast enough for the quick tier. */
export function smallSeeds(count: number, salt = 0): string[] {
  return Array.from({ length: count }, (_, index) =>
    makeSeed(THEME_KEYS[index % THEME_KEYS.length]!, index % 2 === 0 ? 5 : 6, 0x9a11 + salt + index * 7919));
}
