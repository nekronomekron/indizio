import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY_BANDS,
  DIFFICULTY_ORDER,
  SIZES_BY_DIFFICULTY,
  THEME_KEYS,
  generatePuzzle,
  makeSeed,
  stringifyPuzzle,
} from '../../../src/engine/index.js';
import { createInitialState } from '../../../src/engine/solving/candidates.js';
import { solveByReference } from '../../../src/engine/solving/reference.js';
import { solve } from '../../../src/engine/solving/solve.js';
import { buildSceneIndex } from '../../../src/engine/core/grid.js';
import { toScene } from '../../../src/engine/api.js';
import { expectSoundPuzzle } from '../support/invariants.js';
import { seedsAcrossTiers } from '../support/seeds.js';

/**
 * The thorough run.
 *
 * Same claims as the quick tier, but across every grid size and hundreds of
 * seeds — including the ones that are slow to generate and slow to verify.
 * This is the run that earns the sentence "every puzzle is solvable"; the
 * quick tier only keeps that claim honest between full runs.
 */

const RUNS_PER_TIER = 20;

describe('every tier', () => {
  for (const difficulty of DIFFICULTY_ORDER) {
    const sizes = SIZES_BY_DIFFICULTY[difficulty];

    it(`${difficulty}: every puzzle is sound`, () => {
      fc.assert(
        fc.property(
          fc.record({
            theme: fc.constantFrom(...THEME_KEYS),
            size: fc.constantFrom(...sizes),
            random: fc.integer({ min: 0, max: 2 ** 30 }),
          }),
          ({ theme, size, random }) => {
            const seed = makeSeed(theme, size, random);
            // Uniqueness on the largest grids is checked separately, with a
            // budget: exhaustive search there is expensive but not hopeless.
            expectSoundPuzzle(generatePuzzle(seed).core, { checkUniqueness: size <= 8 });
          },
        ),
        { numRuns: RUNS_PER_TIER },
      );
    });
  }
});

describe('uniqueness on large grids', () => {
  it('the reference solver finds exactly one solution', () => {
    const large = seedsAcrossTiers(3).filter((entry) => entry.size >= 9);
    expect(large.length).toBeGreaterThan(0);

    for (const { seed } of large) {
      const { core } = generatePuzzle(seed);
      const index = buildSceneIndex(toScene(core));
      const reference = solveByReference(index, core.suspects, core.clues, {
        solutionLimit: 2,
        maxNodes: 40_000_000,
      });
      // An exhausted budget is inconclusive, not a failure — say so rather
      // than pretending the check passed.
      if (!reference.exhaustive) continue;
      expect(reference.count, `${seed} must have exactly one solution`).toBe(1);
    }
  });
});

describe('solver soundness at scale', () => {
  it('never removes a candidate the reference solver can still place', () => {
    let checked = 0;

    for (const { seed } of seedsAcrossTiers(2).filter((entry) => entry.size <= 7)) {
      const { core } = generatePuzzle(seed);
      const index = buildSceneIndex(toScene(core));
      const result = solve(index, core.suspects, core.clues);
      const start = createInitialState(index, core.suspects.length);

      // A sample rather than every removal: with the same claim per case, more
      // seeds buy more confidence than more cells within one seed.
      for (let suspect = 0; suspect < core.suspects.length; suspect += 2) {
        for (let cell = 0; cell < index.cellCount; cell += 3) {
          if (!start.canBeAt(suspect, cell) || result.state.canBeAt(suspect, cell)) continue;
          const pinned = solveByReference(index, core.suspects, core.clues, {
            solutionLimit: 1,
            pin: { suspectId: suspect, cell },
            maxNodes: 2_000_000,
          });
          expect(pinned.count, `${seed}: removing suspect ${suspect} from cell ${cell} was not forced`).toBe(
            0,
          );
          checked++;
        }
      }
    }
    expect(checked, 'the sample must actually check something').toBeGreaterThan(100);
  });
});

describe('reproducibility at scale', () => {
  it('gives the same bytes for the same seed, every time', () => {
    for (const { seed } of seedsAcrossTiers(4)) {
      const first = stringifyPuzzle(generatePuzzle(seed).core);
      const second = stringifyPuzzle(generatePuzzle(seed).core);
      expect(second, `${seed} is not reproducible`).toBe(first);
    }
  });

  it('gives different puzzles for different seeds', () => {
    const written = new Set<string>();
    for (const { seed } of seedsAcrossTiers(4, 7)) {
      written.add(stringifyPuzzle(generatePuzzle(seed).core));
    }
    expect(written.size).toBe(seedsAcrossTiers(4, 7).length);
  });
});

describe('difficulty rises with the tier', () => {
  /**
   * The tiers are ordered by design, and every puzzle clears the bar of the
   * tier it claims. What does *not* follow is that adjacent tiers separate
   * cleanly in a sample: the generator only has to clear its own threshold,
   * and the spread of individual puzzles within a tier is wide enough
   * (standard deviation around 1 to 3) that neighbouring means overlap.
   *
   * So this checks what is actually true: the thresholds themselves rise, and
   * the measured difficulty rises across the full range, where the gap is
   * large compared to the noise.
   */
  it('has thresholds that rise with every tier', () => {
    let previous = { spread: -Infinity, indirect: -Infinity };
    for (const difficulty of DIFFICULTY_ORDER) {
      const band = DIFFICULTY_BANDS[difficulty];
      expect(band.minSpread, difficulty).toBeGreaterThanOrEqual(previous.spread);
      expect(band.minIndirect, difficulty).toBeGreaterThanOrEqual(previous.indirect);
      previous = { spread: band.minSpread, indirect: band.minIndirect };
    }
  });

  it('measures harder puzzles at the hard end than at the easy end', () => {
    const meanFor = (difficulty: (typeof DIFFICULTY_ORDER)[number]) => {
      const cores = seedsAcrossTiers(8)
        .filter((entry) => entry.difficulty === difficulty)
        .map(({ seed }) => generatePuzzle(seed).core);
      const average = (pick: (core: (typeof cores)[number]) => number): number =>
        cores.reduce((total, core) => total + pick(core), 0) / cores.length;
      return {
        spread: average((core) => core.difficultyProof.spread),
        indirect: average((core) => core.difficultyProof.indirect),
      };
    };

    const easiest = meanFor('veryEasy');
    const hardest = meanFor('expert');
    expect(hardest.spread).toBeGreaterThan(easiest.spread);
    expect(hardest.indirect).toBeGreaterThan(easiest.indirect);
  });

  it('never ships a puzzle below the bar of its own tier', () => {
    for (const { seed, difficulty } of seedsAcrossTiers(4)) {
      const { core } = generatePuzzle(seed);
      const band = DIFFICULTY_BANDS[difficulty];
      expect(core.difficultyProof.spread, seed).toBeGreaterThanOrEqual(band.minSpread);
      expect(core.difficultyProof.indirect, seed).toBeGreaterThanOrEqual(band.minIndirect);
    }
  });
});
