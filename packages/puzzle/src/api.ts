import { allCluesTrue } from './clues/evaluate.js';
import { buildOccupancy } from './clues/occupancy.js';
import { findClueRestrictionViolations, type ClueRestrictionViolation } from './clues/restrictions.js';
import { meetsBand } from './core/difficulty.js';
import { buildSceneIndex, type SceneIndex } from './core/grid.js';
import type { Assignment, Cell, PuzzleCore, RuleLevel, Scene, SuspectId } from './core/types.js';
import { solveByReference } from './solving/reference.js';
import { nextHint, type Hint } from './solving/hint.js';
import { solve } from './solving/solve.js';

/**
 * Everything a consumer needs, taking nothing but a puzzle.
 *
 * Candidate sets, scene indices and rule levels are implementation detail;
 * using this library should not require knowing they exist. These functions
 * rebuild whatever they need from the puzzle itself.
 */

export function toScene(core: PuzzleCore): Scene {
  return { size: core.size, themeKey: core.themeKey, rooms: core.rooms, objects: core.objects };
}

function indexFor(core: PuzzleCore): SceneIndex {
  return buildSceneIndex(toScene(core));
}

export interface BoardLayout {
  /** Room id per cell — rooms are any shape, so this is per cell. */
  roomOfCell: Int32Array;
  /** 1 where nobody may stand, because a solid object covers the cell. */
  blocked: Uint8Array;
  cellCount: number;
}

/**
 * The two lookups a renderer needs: which room a cell belongs to, and where
 * nobody may stand. Deliberately narrow — the solver's full index stays
 * private, so it can change without breaking anyone drawing a board.
 */
export function boardLayout(core: PuzzleCore): BoardLayout {
  const index = indexFor(core);
  return { roomOfCell: index.roomOfCell, blocked: index.blocked, cellCount: index.cellCount };
}

export interface SolveOutcome {
  /** Fully deduced without any case analysis. */
  solved: boolean;
  status: 'solved' | 'stuck' | 'contradiction';
  assignment: Assignment | null;
  maxRule: RuleLevel;
  /** The order in which suspects became certain. */
  chain: { suspectId: SuspectId; cell: Cell; rule: RuleLevel }[];
}

/** Solve a puzzle deductively. Never guesses, never branches. */
export function solvePuzzle(core: PuzzleCore): SolveOutcome {
  const result = solve(indexFor(core), core.suspects, core.clues);
  return {
    solved: result.status === 'solved',
    status: result.status,
    assignment: result.assignment,
    maxRule: result.maxRule,
    chain: result.chain.map(({ suspectId, cell, rule }) => ({ suspectId, cell, rule })),
  };
}

/**
 * The next forced step. The board is only used to skip steps already taken —
 * see {@link nextHint} for why that matters.
 */
export function hintFor(core: PuzzleCore, board: readonly (Cell | null)[]): Hint | null {
  return nextHint(indexFor(core), core.suspects, core.clues, board);
}

/** Check a board against the solution. Binary, without revealing what is wrong. */
export function checkSolution(core: PuzzleCore, board: readonly (Cell | null)[]): boolean {
  return core.solution.every((cell, suspect) => board[suspect] === cell);
}

export interface VerifyOptions {
  /** Also confirm uniqueness with the reference solver. Defaults to true. */
  checkUniqueness?: boolean;
  maxNodes?: number;
}

export interface VerificationReport {
  ok: boolean;
  /** Solvable without case analysis, and to the stated solution. */
  deducible: boolean;
  /** Every clue is true of the solution. */
  cluesTrue: boolean;
  /** Uniqueness per the reference solver. 'unknown' means the budget ran out. */
  unique: 'yes' | 'no' | 'unknown';
  /** One person per row and column, nobody on a blocked square. */
  placementValid: boolean;
  /** The victim's room holds exactly the victim and the murderer. */
  victimRoomValid: boolean;
  /** The measured figures match the difficulty tier claimed. */
  tierValid: boolean;
  restrictions: readonly ClueRestrictionViolation[];
  problems: readonly string[];
}

/**
 * Check a puzzle from first principles, whatever produced it — this generator,
 * another tool, or a person writing JSON by hand.
 */
export function verifyPuzzle(core: PuzzleCore, options: VerifyOptions = {}): VerificationReport {
  const index = indexFor(core);
  const occupancy = buildOccupancy(index, core.solution);
  const problems: string[] = [];
  const size = core.size;

  const rows = new Set(core.solution.map((cell) => Math.floor(cell / size)));
  const columns = new Set(core.solution.map((cell) => cell % size));
  const onWalkable = core.solution.every((cell) => index.blocked[cell] === 0);
  const placementValid = rows.size === size && columns.size === size && onWalkable;
  if (!placementValid) problems.push('placement breaks the row, column or blocking rule');

  const cluesTrue = allCluesTrue(index, occupancy, core.clues);
  if (!cluesTrue) problems.push('at least one clue is false for the stated solution');

  const outcome = solve(index, core.suspects, core.clues);
  const deducible = outcome.status === 'solved'
    && outcome.assignment?.every((cell, suspect) => cell === core.solution[suspect]) === true;
  if (!deducible) problems.push('not solvable without case analysis');

  const victim = core.suspects.find((suspect) => suspect.isVictim);
  let victimRoomValid = false;
  if (!victim) {
    problems.push('no victim is set');
  } else {
    const room = index.roomOfCell[core.solution[victim.id] ?? 0] ?? -1;
    const occupants = occupancy.occupantsByRoom.get(room) ?? [];
    victimRoomValid = occupants.length === 2
      && occupants.includes(core.murdererId)
      && core.murdererId !== victim.id;
    if (!victimRoomValid) problems.push('the victim\'s room does not hold exactly victim and murderer');
  }

  const restrictions = findClueRestrictionViolations(index, core.suspects, core.solution, core.clues);
  if (restrictions.length > 0) problems.push('clue restrictions are violated');

  const tierValid = meetsBand(core.difficulty, core.size, core.difficultyProof);
  if (!tierValid) problems.push('the measured figures do not match the stated difficulty tier');

  let unique: VerificationReport['unique'] = 'unknown';
  if (options.checkUniqueness !== false) {
    const reference = solveByReference(index, core.suspects, core.clues, {
      solutionLimit: 2,
      maxNodes: options.maxNodes ?? 8_000_000,
    });
    if (!reference.exhaustive) unique = 'unknown';
    else if (reference.count === 1) unique = 'yes';
    else {
      unique = 'no';
      problems.push(`not unique, solutions found: ${reference.count}`);
    }
  }

  return {
    ok: problems.length === 0,
    deducible,
    cluesTrue,
    unique,
    placementValid,
    victimRoomValid,
    tierValid,
    restrictions,
    problems,
  };
}
