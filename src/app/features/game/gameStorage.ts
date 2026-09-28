import * as v from 'valibot';
import type { PuzzleCore } from '@engine';
import { readStored, saveKey, writeStored } from '../../shared/storage/store.js';
import type { GameState } from './gameReducer.js';

const Count = v.pipe(v.number(), v.integer(), v.minValue(0));

const HintSchema = v.union([
  v.object({ cell: Count, suspectId: Count, step: Count, totalSteps: Count }),
  v.object({ cell: v.null() }),
]);

const SavedGameSchema = v.object({
  size: Count,
  placements: v.array(v.nullable(Count)),
  notes: v.record(v.pipe(v.string(), v.regex(/^\d+$/)), v.array(Count)),
  marks: v.array(Count),
  selected: v.nullable(Count),
  tool: v.picklist(['place', 'mark', 'erase']),
  hintsUsed: Count,
  hint: v.nullable(HintSchema),
  verdict: v.picklist(['none', 'wrong', 'solved']),
  elapsedMs: v.pipe(v.number(), v.minValue(0)),
  running: v.boolean(),
});

/**
 * A save that parses can still belong to another puzzle — or have been edited
 * by hand. Every cell and person it names must exist in this one.
 */
function fitsPuzzle(state: GameState, core: PuzzleCore): boolean {
  const cells = core.size * core.size;
  const people = core.suspects.length;
  const isCell = (cell: number): boolean => cell < cells;
  const isPerson = (id: number): boolean => id < people;
  return (
    state.size === core.size &&
    state.placements.length === people &&
    state.placements.every((cell) => cell === null || isCell(cell)) &&
    Object.entries(state.notes).every(([cell, ids]) => isCell(Number(cell)) && ids.every(isPerson)) &&
    state.marks.every(isCell) &&
    (state.selected === null || isPerson(state.selected)) &&
    (state.hint?.cell == null || (isCell(state.hint.cell) && isPerson(state.hint.suspectId)))
  );
}

/**
 * The game in progress, per seed. Whether one exists is shared knowledge (the
 * calendar shows it); what it holds belongs to this feature.
 */
export function loadSave(core: PuzzleCore): GameState | null {
  const saved = readStored(saveKey(core.seed), SavedGameSchema);
  return saved && fitsPuzzle(saved, core) ? saved : null;
}

export function saveGame(seed: string, state: GameState): void {
  writeStored(saveKey(seed), state);
}
