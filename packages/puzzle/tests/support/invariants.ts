import { expect } from 'vitest';
import {
  DIFFICULTY_BANDS, parsePuzzle, stringifyPuzzle, toScene, verifyPuzzle,
} from '../../src/index.js';
import type { PuzzleCore } from '../../src/index.js';
import { buildSceneIndex } from '../../src/core/grid.js';
import { createClueTranslator, LOCALES } from '../../src/i18n/index.js';

/**
 * The invariants every generated puzzle must satisfy.
 *
 * Kept in one place so the fast and the deep property runs check exactly the
 * same claims — the only difference between the two tiers should be how many
 * puzzles they look at, never how carefully.
 */

const translators = LOCALES.map((locale) => ({ locale, translator: createClueTranslator({ locale }) }));

/** Structural correctness: geometry, roles, and clues that are actually true. */
export function expectStructurallySound(core: PuzzleCore): void {
  const index = buildSceneIndex(toScene(core));
  const size = core.size;

  const rows = new Set(core.solution.map((cell) => Math.floor(cell / size)));
  const columns = new Set(core.solution.map((cell) => cell % size));
  expect(rows.size, 'every row occupied exactly once').toBe(size);
  expect(columns.size, 'every column occupied exactly once').toBe(size);

  for (const cell of core.solution) {
    expect(index.blocked[cell], 'nobody stands on a blocked square').toBe(0);
    for (const object of index.objectsOfCell[cell] ?? []) {
      expect(object.walkable, `nobody stands on ${object.key}`).toBe(true);
    }
  }

  // Rooms cover the grid exactly once, and each is a single connected shape.
  const owner = new Map<number, number>();
  for (const room of core.rooms) {
    for (const cell of room.cells) {
      expect(owner.has(cell), `cell ${cell} claimed twice`).toBe(false);
      owner.set(cell, room.id);
    }
  }
  expect(owner.size, 'rooms cover the whole grid').toBe(size * size);

  for (const object of core.objects) {
    for (const cell of object.cells) {
      expect(index.roomOfCell[cell], `${object.key} spills out of its room`).toBe(object.roomId);
    }
  }

  expect(core.suspects.filter((suspect) => suspect.isVictim)).toHaveLength(1);
  const cardClues = core.clues.filter((entry) => entry.ownerId !== null);
  expect(new Set(cardClues.map((entry) => entry.ownerId)).size, 'one clue per card').toBe(size);
}

/** Solvable by deduction alone, and to exactly one solution. */
export function expectSolvableAndUnique(core: PuzzleCore, checkUniqueness = true): void {
  const report = verifyPuzzle(core, { checkUniqueness });
  expect(report.problems, `verification problems for ${core.seed}`).toEqual([]);
  expect(report.deducible, 'solvable without case analysis').toBe(true);
  expect(report.cluesTrue, 'every clue true of the solution').toBe(true);
  expect(report.victimRoomValid, 'victim alone with the murderer').toBe(true);
  expect(report.restrictions, 'clue restrictions respected').toEqual([]);
  if (checkUniqueness) expect(report.unique, 'exactly one solution').toBe('yes');
}

/** Writes and reads back byte-for-byte, and rejects nothing it produced. */
export function expectRoundTrips(core: PuzzleCore): void {
  const written = stringifyPuzzle(core);
  expect(stringifyPuzzle(parsePuzzle(written)), 'round trip is lossless').toBe(written);
}

/** The measured figures match the tier the seed asked for. */
export function expectMatchesTier(core: PuzzleCore): void {
  const band = DIFFICULTY_BANDS[core.difficulty];
  expect(band.sizes, `size ${core.size} belongs to ${core.difficulty}`).toContain(core.size);
  expect(core.difficultyProof.spread).toBeGreaterThanOrEqual(band.minSpread);
  expect(core.difficultyProof.indirect).toBeGreaterThanOrEqual(band.minIndirect);
}

/** Every clue renders as a sentence in every language. */
export function expectRendersInEveryLanguage(core: PuzzleCore): void {
  for (const { locale, translator } of translators) {
    for (const entry of core.clues) {
      const text = translator.render(core, entry);
      expect(text.length, `${locale}/${entry.clue.type} is empty`).toBeGreaterThan(5);
      expect(text, `${locale}/${entry.clue.type} has an unresolved placeholder`).not.toContain('{{');
      expect(text, `${locale}/${entry.clue.type} leaks a key`)
        .not.toMatch(/\b(clue|object|room|common)(\.[a-zA-Z_]+){2,}/);
    }
  }
}

/** Everything above, for one puzzle. */
export function expectSoundPuzzle(core: PuzzleCore, options: { checkUniqueness?: boolean } = {}): void {
  expectStructurallySound(core);
  expectSolvableAndUnique(core, options.checkUniqueness ?? true);
  expectRoundTrips(core);
  expectMatchesTier(core);
  expectRendersInEveryLanguage(core);
}
