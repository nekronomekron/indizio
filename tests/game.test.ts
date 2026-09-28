import { describe, expect, it } from 'vitest';
import { generatePuzzle, makeSeed } from '@engine';
import { gameReducer, initialGame, type GameSession } from '../src/app/features/game/gameReducer.js';

const { core } = generatePuzzle(makeSeed('garage', 5, 31337));
const size = core.size;
const start = (): GameSession => ({ state: initialGame(core), history: [] });
const cellAt = (row: number, column: number): number => row * size + column;

describe('placing carries out the consequences', () => {
  it('marks the whole row and column with an X', () => {
    let s = start();
    s = gameReducer(s, { type: 'select', suspectId: 0 });
    s = gameReducer(s, { type: 'place', cell: cellAt(2, 3) });

    for (let i = 0; i < size; i++) {
      if (i !== 3) expect(s.state.marks, 'row 2, column ' + i).toContain(cellAt(2, i));
      if (i !== 2) expect(s.state.marks, 'column 3, row ' + i).toContain(cellAt(i, 3));
    }
    // The person's own cell gets no X.
    expect(s.state.marks).not.toContain(cellAt(2, 3));
    expect(s.state.marks).toHaveLength(2 * (size - 1));
  });

  it("removes all of the placed person's notes", () => {
    let s = start();
    s = gameReducer(s, { type: 'select', suspectId: 0 });
    s = gameReducer(s, { type: 'note', cell: cellAt(0, 0) });
    s = gameReducer(s, { type: 'note', cell: cellAt(4, 4) });
    expect(Object.keys(s.state.notes)).toHaveLength(2);

    s = gameReducer(s, { type: 'place', cell: cellAt(2, 2) });
    for (const ids of Object.values(s.state.notes)) {
      expect(ids).not.toContain(0);
    }
  });

  it("removes others' notes in the row and column, keeps the rest", () => {
    let s = start();
    s = gameReducer(s, { type: 'select', suspectId: 1 });
    s = gameReducer(s, { type: 'note', cell: cellAt(2, 0) }); // in the row
    s = gameReducer(s, { type: 'note', cell: cellAt(0, 3) }); // in the column
    s = gameReducer(s, { type: 'note', cell: cellAt(4, 4) }); // unaffected

    s = gameReducer(s, { type: 'select', suspectId: 0 });
    s = gameReducer(s, { type: 'place', cell: cellAt(2, 3) });

    expect(s.state.notes[cellAt(2, 0)]).toBeUndefined();
    expect(s.state.notes[cellAt(0, 3)]).toBeUndefined();
    expect(s.state.notes[cellAt(4, 4)]).toEqual([1]);
  });

  it('takes off a person occupying the same row or column', () => {
    let s = start();
    s = gameReducer(s, { type: 'select', suspectId: 1 });
    s = gameReducer(s, { type: 'place', cell: cellAt(2, 0) });
    expect(s.state.placements[1]).toBe(cellAt(2, 0));

    s = gameReducer(s, { type: 'select', suspectId: 0 });
    s = gameReducer(s, { type: 'place', cell: cellAt(2, 3) });

    // Two people in row 2 would be a board that breaks the basic rule.
    expect(s.state.placements[1]).toBeNull();
    expect(s.state.placements[0]).toBe(cellAt(2, 3));
    expect(s.state.marks).toContain(cellAt(2, 0));
  });

  it('leaves people outside the row and column where they are', () => {
    let s = start();
    s = gameReducer(s, { type: 'select', suspectId: 1 });
    s = gameReducer(s, { type: 'place', cell: cellAt(0, 0) });
    s = gameReducer(s, { type: 'select', suspectId: 0 });
    s = gameReducer(s, { type: 'place', cell: cellAt(2, 3) });

    expect(s.state.placements[1]).toBe(cellAt(0, 0));
    expect(s.state.placements[0]).toBe(cellAt(2, 3));
  });

  it('undoes all of it in one step', () => {
    let s = start();
    s = gameReducer(s, { type: 'select', suspectId: 1 });
    s = gameReducer(s, { type: 'note', cell: cellAt(2, 0) });
    const before = {
      placements: [...s.state.placements],
      notes: JSON.parse(JSON.stringify(s.state.notes)) as Record<number, number[]>,
      marks: [...s.state.marks],
    };

    s = gameReducer(s, { type: 'select', suspectId: 0 });
    s = gameReducer(s, { type: 'place', cell: cellAt(2, 3) });
    expect(s.state.marks.length).toBeGreaterThan(0);

    s = gameReducer(s, { type: 'undo' });
    expect(s.state.placements).toEqual(before.placements);
    expect(s.state.notes).toEqual(before.notes);
    expect(s.state.marks).toEqual(before.marks);
  });

  it('lets the correct solution be placed without conflict', () => {
    let s = start();
    for (let id = 0; id < core.suspects.length; id++) {
      s = gameReducer(s, { type: 'select', suspectId: id });
      s = gameReducer(s, { type: 'place', cell: core.solution[id]! });
    }
    // Nobody was pushed off by a later placement.
    expect(s.state.placements).toEqual(core.solution);
    // And no X lies under a placed person.
    for (const cell of core.solution) expect(s.state.marks).not.toContain(cell);
  });
});

describe('initial selection', () => {
  it('never selects the person last in the list', () => {
    // The victim is last in the card list (features/game/suspects.ts). If it
    // were preselected, the highlight would sit at the bottom while the eye
    // starts at the top.
    for (let i = 0; i < 40; i++) {
      const puzzle = generatePuzzle(makeSeed('garage', 5 + (i % 6), 2000 + i)).core;
      const selected = initialGame(puzzle).selected;
      expect(selected, String(i)).not.toBeNull();
      expect(puzzle.suspects[selected!]!.isVictim, String(i)).toBe(false);
    }
  });
});
