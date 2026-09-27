import { describe, expect, it } from 'vitest';
import { CLUE_TYPES, type ClueEntry, type ClueType } from '../../src/engine/core/types.js';
import { enumerateCardClues, enumerateSceneClues } from '../../src/engine/clues/enumerate.js';
import { createInitialState } from '../../src/engine/solving/candidates.js';
import { nextHint } from '../../src/engine/solving/hint.js';
import { solveByReference } from '../../src/engine/solving/reference.js';
import { measureSpread, solve } from '../../src/engine/solving/solve.js';
import { buildFixture } from './support/fixture.js';

/**
 * The solver.
 *
 * Two claims matter here and both are checked against the independent
 * reference solver rather than against the solver's own opinion: that it never
 * removes a candidate which was actually possible (soundness), and that a
 * completed run means the puzzle has exactly one solution.
 */

const ALL_TYPES: ReadonlySet<ClueType> = new Set(CLUE_TYPES);
const { index, suspects, solution, occupancy } = buildFixture();

/** Every true clue about the fixture — over-determined on purpose. */
function everyTrueClue(): ClueEntry[] {
  const entries: ClueEntry[] = [];
  for (let suspect = 0; suspect < suspects.length; suspect++) {
    for (const clue of enumerateCardClues(index, suspects, occupancy, suspect, ALL_TYPES)) {
      entries.push({ ownerId: suspect, clue });
    }
  }
  entries.push(...enumerateSceneClues(index, occupancy, ALL_TYPES));
  return entries;
}

describe('deductive solver', () => {
  it('solves the fixture from its full clue set', () => {
    const result = solve(index, suspects, everyTrueClue());
    expect(result.status).toBe('solved');
    expect(result.assignment).toEqual(solution);
  });

  it('records one chain step per person, each at the right cell', () => {
    const result = solve(index, suspects, everyTrueClue());
    expect(result.chain).toHaveLength(suspects.length);
    for (const step of result.chain) {
      expect(step.cell).toBe(solution[step.suspectId]);
    }
  });

  it('detects a contradiction', () => {
    const broken: ClueEntry[] = [
      ...everyTrueClue(),
      { ownerId: 0, clue: { type: 'IN_ROOM', roomId: 1 } },
    ];
    expect(solve(index, suspects, broken).status).toBe('contradiction');
  });

  it('reports being stuck rather than guessing', () => {
    // A single weak clue cannot pin anybody down.
    const result = solve(index, suspects, [{ ownerId: 0, clue: { type: 'IN_ROOM', roomId: 0 } }]);
    expect(result.status).toBe('stuck');
    expect(result.assignment).toBeNull();
  });

  it('stops at rule level 1 when asked to', () => {
    const propagationOnly = solve(index, suspects, everyTrueClue(), { maxRule: 1 });
    expect(propagationOnly.passesByRule[2]).toBe(0);
    expect(propagationOnly.maxRule).toBe(1);
  });

  it('measures spread as the mean candidate count after propagation', () => {
    const spread = measureSpread(index, suspects, everyTrueClue());
    expect(spread).toBeGreaterThan(0);
    expect(spread).toBeLessThanOrEqual(index.cellCount);
  });
});

describe('reference solver', () => {
  it('confirms exactly one solution', () => {
    const result = solveByReference(index, suspects, everyTrueClue(), { solutionLimit: 3 });
    expect(result.exhaustive).toBe(true);
    expect(result.count).toBe(1);
    expect(result.first).toEqual(solution);
  });

  it('finds many solutions when clues are sparse', () => {
    const result = solveByReference(index, suspects, [{ ownerId: 4, clue: { type: 'VICTIM' } }], {
      solutionLimit: 2,
    });
    expect(result.count).toBe(2);
  });

  it('reports when the node budget runs out', () => {
    const result = solveByReference(index, suspects, [], { solutionLimit: 999, maxNodes: 5 });
    expect(result.exhaustive).toBe(false);
  });
});

describe('solver soundness', () => {
  /**
   * The claim: every candidate the solver struck out was genuinely impossible.
   * Checked by pinning that suspect to that cell and asking the reference
   * solver whether any solution survives.
   */
  it('never removes a candidate that was actually possible', () => {
    const clues = everyTrueClue();
    const result = solve(index, suspects, clues);
    const start = createInitialState(index, suspects.length);
    let checked = 0;

    for (let suspect = 0; suspect < suspects.length; suspect++) {
      for (let cell = 0; cell < index.cellCount; cell++) {
        // Only the solver's own removals, not the blocked cells it started with.
        if (!start.canBeAt(suspect, cell) || result.state.canBeAt(suspect, cell)) continue;
        const pinned = solveByReference(index, suspects, clues, {
          solutionLimit: 1,
          pin: { suspectId: suspect, cell },
        });
        expect(pinned.count, `removal of suspect ${suspect} at cell ${cell} was not forced`).toBe(0);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });
});

describe('hints', () => {
  it('walks the chain from an empty board', () => {
    const clues = everyTrueClue();
    const empty = suspects.map(() => null);
    const first = nextHint(index, suspects, clues, empty);
    expect(first).not.toBeNull();
    expect(first?.step).toBe(1);
    expect(first?.cell).toBe(solution[first?.suspectId ?? 0]);
  });

  it('skips steps the player already has right', () => {
    const clues = everyTrueClue();
    const board = suspects.map(() => null) as (number | null)[];
    const first = nextHint(index, suspects, clues, board);
    board[first?.suspectId ?? 0] = first?.cell ?? null;
    const second = nextHint(index, suspects, clues, board);
    expect(second?.suspectId).not.toBe(first?.suspectId);
  });

  it('ignores wrong placements entirely', () => {
    // A hint must not become a way to find out whether something is wrong.
    const clues = everyTrueClue();
    const fromEmpty = nextHint(index, suspects, clues, suspects.map(() => null));
    const wrongBoard = suspects.map((_, id) => (id % 2 === 0 ? ((solution[id] ?? 0) + 3) % index.cellCount : null));
    const fromWrong = nextHint(index, suspects, clues, wrongBoard);
    expect(fromWrong?.suspectId).toBe(fromEmpty?.suspectId);
    expect(fromWrong?.cell).toBe(fromEmpty?.cell);
  });

  it('returns nothing once the board is complete', () => {
    const clues = everyTrueClue();
    expect(nextHint(index, suspects, clues, solution)).toBeNull();
  });
});
