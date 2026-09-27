import { propagateClues } from './propagate.js';
import type { SceneIndex } from '../core/grid.js';
import type { Assignment, Cell, ClueEntry, RuleLevel, Suspect, SuspectId } from '../core/types.js';
import { type CandidateState, RoomView, createInitialState, type Reason } from './candidates.js';
import { applyPermutationRules } from './permutation.js';

/**
 * The deductive solver.
 *
 * It alternates between the two rule levels, always preferring the cheaper
 * one, and never branches. Because every removal it makes is provably
 * necessary, a run that pins down every suspect is at the same time a proof
 * that the puzzle has exactly one solution.
 */

export type SolveStatus = 'solved' | 'stuck' | 'contradiction';

export interface DeductionStep {
  rule: RuleLevel;
  suspectId: SuspectId;
  cell: Cell;
  reason: Reason | null;
}

export interface SolveResult {
  status: SolveStatus;
  assignment: Assignment | null;
  /** Highest rule level that ever produced a change. */
  maxRule: RuleLevel;
  /** Productive passes per rule level. */
  passesByRule: Record<RuleLevel, number>;
  state: CandidateState;
  /** Canonical chain: the order in which suspects became certain. */
  chain: DeductionStep[];
}

export interface SolveOptions {
  /** Highest rule level the solver may use. Defaults to full depth. */
  maxRule?: RuleLevel;
  /** Start from a given state instead of an empty board. */
  startFrom?: CandidateState;
}

/**
 * Upper bound on alternations. Each productive pass strictly shrinks at least
 * one candidate set, so the loop terminates well before this; the bound only
 * exists so a future bug cannot hang a caller.
 */
const MAX_PASSES = 10_000;

export function solve(
  index: SceneIndex,
  suspects: readonly Suspect[],
  clues: readonly ClueEntry[],
  options: SolveOptions = {},
): SolveResult {
  const ruleLimit = options.maxRule ?? 2;
  const suspectCount = suspects.length;
  const state = options.startFrom ? options.startFrom.clone() : createInitialState(index, suspectCount);
  const rooms = new RoomView(index, state);

  const passesByRule: Record<RuleLevel, number> = { 1: 0, 2: 0 };
  const chain: DeductionStep[] = [];
  const alreadyChained = new Set<SuspectId>();
  let maxRule: RuleLevel = 1;

  const recordNewlyCertain = (rule: RuleLevel): void => {
    for (let suspect = 0; suspect < suspectCount; suspect++) {
      if (alreadyChained.has(suspect)) continue;
      const cell = state.onlyCellFor(suspect);
      if (cell < 0) continue;
      alreadyChained.add(suspect);
      chain.push({ rule, suspectId: suspect, cell, reason: state.lastReason[suspect] ?? null });
    }
  };

  const finish = (status: SolveStatus): SolveResult => ({
    status,
    assignment: status === 'solved' ? state.toAssignment() : null,
    maxRule,
    passesByRule,
    state,
    chain,
  });

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const propagation = propagateClues(index, state, rooms, clues);
    if (propagation.contradiction) return finish('contradiction');
    if (propagation.changed) {
      passesByRule[1]++;
      recordNewlyCertain(1);
      continue;
    }

    if (ruleLimit < 2) break;

    const permutation = applyPermutationRules(state);
    if (permutation.contradiction) return finish('contradiction');
    if (permutation.changed) {
      passesByRule[2]++;
      maxRule = 2;
      recordNewlyCertain(2);
      continue;
    }

    break;
  }

  const assignment = state.toAssignment();
  if (!assignment) return finish('stuck');

  const rows = new Set(assignment.map((cell) => Math.floor(cell / index.size)));
  const columns = new Set(assignment.map((cell) => cell % index.size));
  if (rows.size !== suspectCount || columns.size !== suspectCount) return finish('contradiction');

  return finish('solved');
}

/**
 * Mean candidate count per suspect after clue propagation alone.
 *
 * This is the difficulty measure that actually discriminates: it says how much
 * work the clues leave to the permutation reasoning, which is what a player
 * experiences as difficulty.
 */
export function measureSpread(
  index: SceneIndex,
  suspects: readonly Suspect[],
  clues: readonly ClueEntry[],
): number {
  const propagationOnly = solve(index, suspects, clues, { maxRule: 1 });
  let total = 0;
  for (let suspect = 0; suspect < suspects.length; suspect++) {
    total += propagationOnly.state.countFor(suspect);
  }
  return total / suspects.length;
}
