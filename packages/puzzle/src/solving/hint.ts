import type { SceneIndex } from '../core/grid.js';
import type { Cell, ClueEntry, RuleLevel, Suspect, SuspectId } from '../core/types.js';
import type { Reason } from './candidates.js';
import { solve } from './solve.js';

export interface Hint {
  suspectId: SuspectId;
  cell: Cell;
  rule: RuleLevel;
  reason: Reason | null;
  /** Position in the canonical chain, 1-based. */
  step: number;
  totalSteps: number;
}

/**
 * The next forced step.
 *
 * The deduction always runs on an empty board; the player's board is used
 * only to skip steps they already have right. That is deliberate: if hints
 * reasoned from the current position, asking for one would reveal whether a
 * placement is wrong, and checking an answer is supposed to be the only way
 * to learn that.
 */
export function nextHint(
  index: SceneIndex,
  suspects: readonly Suspect[],
  clues: readonly ClueEntry[],
  board: readonly (Cell | null)[],
): Hint | null {
  const { chain } = solve(index, suspects, clues);
  for (let step = 0; step < chain.length; step++) {
    const entry = chain[step];
    if (!entry) continue;
    if (board[entry.suspectId] === entry.cell) continue;
    return {
      suspectId: entry.suspectId,
      cell: entry.cell,
      rule: entry.rule,
      reason: entry.reason,
      step: step + 1,
      totalSteps: chain.length,
    };
  }
  return null;
}
