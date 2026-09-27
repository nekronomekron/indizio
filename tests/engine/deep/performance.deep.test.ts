import { describe, expect, it } from 'vitest';
import { DIFFICULTY_ORDER, SIZES_BY_DIFFICULTY, THEME_KEYS, generatePuzzle, makeSeed } from '../../../src/engine/index.js';
import type { DifficultyKey } from '../../../src/engine/index.js';

/**
 * Generation speed.
 *
 * The generator runs in a browser with a person waiting, so slowness is a
 * defect rather than a preference. The budgets are generous multiples of what
 * was measured before this refactor — the point is to notice a regression of
 * an order of magnitude, not to fail on a busy machine.
 */

/** Ceilings for the 95th percentile, in milliseconds. */
const BUDGET_MS: Record<DifficultyKey, number> = {
  veryEasy: 300,
  easy: 600,
  medium: 900,
  hard: 1500,
  expert: 4000,
};

const SAMPLES = 20;

function percentile(values: readonly number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? 0;
}

describe('generation speed', () => {
  for (const difficulty of DIFFICULTY_ORDER) {
    it(`${difficulty} stays within ${BUDGET_MS[difficulty]}ms at the 95th percentile`, () => {
      const sizes = SIZES_BY_DIFFICULTY[difficulty];
      const durations: number[] = [];
      let failures = 0;

      for (let index = 0; index < SAMPLES; index++) {
        const size = sizes[index % sizes.length]!;
        const seed = makeSeed(THEME_KEYS[index % THEME_KEYS.length]!, size, 0x7e57 + index * 104729);
        const startedAt = Date.now();
        try {
          generatePuzzle(seed);
          durations.push(Date.now() - startedAt);
        } catch {
          failures++;
        }
      }

      // A seed that cannot be generated at all is a correctness problem, and
      // would also skew the timing by silently dropping the slow cases.
      expect(failures, `${difficulty}: seeds that produced no puzzle`).toBe(0);
      expect(percentile(durations, 0.95)).toBeLessThanOrEqual(BUDGET_MS[difficulty]);
    });
  }
});
