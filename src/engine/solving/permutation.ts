import type { Axis, Cell, SuspectId } from '../core/types.js';
import type { CandidateState, Reason } from './candidates.js';

/**
 * The permutation rules.
 *
 * Exactly one person stands in every row and every column, so the solution is
 * a permutation matrix. Four consequences follow, and together they are strong
 * enough to finish every puzzle this library generates — no case analysis, no
 * guessing.
 */

export interface RuleResult {
  changed: boolean;
  contradiction: boolean;
}

const AXES: readonly Axis[] = ['row', 'column'];

const lineOf = (cell: Cell, size: number, axis: Axis): number =>
  axis === 'row' ? Math.floor(cell / size) : cell % size;

const crossAxis = (axis: Axis): Axis => (axis === 'row' ? 'column' : 'row');

function countBits(mask: number): number {
  let bits = 0;
  let rest = mask;
  while (rest !== 0) {
    rest &= rest - 1;
    bits++;
  }
  return bits;
}

/** A pinned suspect clears their row and column for everyone else. */
function applyPinnedSuspects(state: CandidateState): boolean {
  const { size } = state;
  let changed = false;
  for (let suspect = 0; suspect < state.suspectCount; suspect++) {
    const cell = state.onlyCellFor(suspect);
    if (cell < 0) continue;
    const row = Math.floor(cell / size);
    const column = cell % size;
    const reason: Reason = { kind: 'placedElsewhere', suspectId: suspect };
    for (let other = 0; other < state.suspectCount; other++) {
      if (other === suspect) continue;
      const clears = state.keepOnly(
        other,
        (candidate) => Math.floor(candidate / size) !== row && candidate % size !== column,
        reason,
      );
      if (clears) changed = true;
    }
  }
  return changed;
}

/**
 * If a line has only one occupiable cell left, that cell is taken — which in
 * turn uses up its crossing line for everyone else.
 */
function applyOnlyCellInLine(state: CandidateState, axis: Axis): RuleResult {
  const { size } = state;
  const cross = crossAxis(axis);
  let changed = false;

  for (let line = 0; line < size; line++) {
    const openCells: Cell[] = [];
    for (let step = 0; step < size; step++) {
      const cell = axis === 'row' ? line * size + step : step * size + line;
      if (state.isAnyonePossibleAt(cell)) openCells.push(cell);
    }
    if (openCells.length === 0) return { changed, contradiction: true };
    if (openCells.length !== 1) continue;

    const taken = openCells[0]!;
    const crossLine = lineOf(taken, size, cross);
    const reason: Reason = { kind: 'onlyCellInLine', axis, line };
    for (let suspect = 0; suspect < state.suspectCount; suspect++) {
      const clears = state.keepOnly(
        suspect,
        (cell) => cell === taken || lineOf(cell, size, cross) !== crossLine,
        reason,
      );
      if (clears) changed = true;
    }
  }
  return { changed, contradiction: false };
}

/** If a suspect can only be in one line, that line is off limits to everyone else. */
function applyOnlyLineForSuspect(state: CandidateState, axis: Axis): RuleResult {
  const { size } = state;
  let changed = false;

  for (let suspect = 0; suspect < state.suspectCount; suspect++) {
    const mask = state.lineMask(suspect, axis);
    if (mask === 0) return { changed, contradiction: true };
    if (countBits(mask) !== 1) continue;

    const line = Math.log2(mask);
    const reason: Reason = { kind: 'onlyLineForSuspect', axis, line, suspectId: suspect };
    for (let other = 0; other < state.suspectCount; other++) {
      if (other === suspect) continue;
      if (state.keepOnly(other, (cell) => lineOf(cell, size, axis) !== line, reason)) changed = true;
    }
  }
  return { changed, contradiction: false };
}

/**
 * If only one suspect can occupy a line, they must — every line is occupied,
 * so there is nobody else left to take it.
 */
function applyOnlySuspectForLine(state: CandidateState, axis: Axis): RuleResult {
  const { size } = state;
  let changed = false;

  for (let line = 0; line < size; line++) {
    const candidates: SuspectId[] = [];
    for (let suspect = 0; suspect < state.suspectCount; suspect++) {
      if ((state.lineMask(suspect, axis) >> line) & 1) candidates.push(suspect);
    }
    if (candidates.length === 0) return { changed, contradiction: true };
    if (candidates.length !== 1) continue;

    const suspect = candidates[0]!;
    const reason: Reason = { kind: 'onlyCellInLine', axis, line };
    if (state.keepOnly(suspect, (cell) => lineOf(cell, size, axis) === line, reason)) changed = true;
  }
  return { changed, contradiction: false };
}

/** Apply every permutation rule once. The caller repeats until nothing changes. */
export function applyPermutationRules(state: CandidateState): RuleResult {
  let changed = applyPinnedSuspects(state);
  if (state.hasSuspectWithNoCells()) return { changed, contradiction: true };

  for (const axis of AXES) {
    for (const rule of [applyOnlyCellInLine, applyOnlyLineForSuspect, applyOnlySuspectForLine]) {
      const result = rule(state, axis);
      if (result.changed) changed = true;
      if (result.contradiction) return { changed, contradiction: true };
    }
  }

  return { changed, contradiction: state.hasSuspectWithNoCells() };
}
