import { describe, expect, it } from 'vitest';
import { generatePuzzle, makeSeed } from '@indizio/puzzle';
import { gameReducer, initialGame, type GameSession } from '../src/app/state/game.js';

const { core } = generatePuzzle(makeSeed('garage', 5, 31337));
const size = core.size;
const start = (): GameSession => ({ state: initialGame(core), history: [] });
const zelle = (r: number, c: number): number => r * size + c;

describe('Platzieren zieht die Konsequenzen nach', () => {
  it('markiert die ganze Zeile und Spalte mit X', () => {
    let s = start();
    s = gameReducer(s, { type: 'select', suspectId: 0 });
    s = gameReducer(s, { type: 'place', cell: zelle(2, 3) });

    for (let i = 0; i < size; i++) {
      if (i !== 3) expect(s.state.marks, 'Zeile 2, Spalte ' + i).toContain(zelle(2, i));
      if (i !== 2) expect(s.state.marks, 'Spalte 3, Zeile ' + i).toContain(zelle(i, 3));
    }
    // Das Feld der Person selbst traegt kein X.
    expect(s.state.marks).not.toContain(zelle(2, 3));
    expect(s.state.marks).toHaveLength(2 * (size - 1));
  });

  it('loescht alle Notizen der gesetzten Person', () => {
    let s = start();
    s = gameReducer(s, { type: 'select', suspectId: 0 });
    s = gameReducer(s, { type: 'note', cell: zelle(0, 0) });
    s = gameReducer(s, { type: 'note', cell: zelle(4, 4) });
    expect(Object.keys(s.state.notes)).toHaveLength(2);

    s = gameReducer(s, { type: 'place', cell: zelle(2, 2) });
    for (const ids of Object.values(s.state.notes)) {
      expect(ids).not.toContain(0);
    }
  });

  it('loescht fremde Notizen in Zeile und Spalte, andere bleiben', () => {
    let s = start();
    s = gameReducer(s, { type: 'select', suspectId: 1 });
    s = gameReducer(s, { type: 'note', cell: zelle(2, 0) }); // in der Zeile
    s = gameReducer(s, { type: 'note', cell: zelle(0, 3) }); // in der Spalte
    s = gameReducer(s, { type: 'note', cell: zelle(4, 4) }); // unbeteiligt

    s = gameReducer(s, { type: 'select', suspectId: 0 });
    s = gameReducer(s, { type: 'place', cell: zelle(2, 3) });

    expect(s.state.notes[zelle(2, 0)]).toBeUndefined();
    expect(s.state.notes[zelle(0, 3)]).toBeUndefined();
    expect(s.state.notes[zelle(4, 4)]).toEqual([1]);
  });

  it('nimmt eine Person herunter, die dieselbe Zeile oder Spalte belegt', () => {
    let s = start();
    s = gameReducer(s, { type: 'select', suspectId: 1 });
    s = gameReducer(s, { type: 'place', cell: zelle(2, 0) });
    expect(s.state.placements[1]).toBe(zelle(2, 0));

    s = gameReducer(s, { type: 'select', suspectId: 0 });
    s = gameReducer(s, { type: 'place', cell: zelle(2, 3) });

    // Zwei Personen in Zeile 2 waeren ein Brett, das die Grundregel bricht.
    expect(s.state.placements[1]).toBeNull();
    expect(s.state.placements[0]).toBe(zelle(2, 3));
    expect(s.state.marks).toContain(zelle(2, 0));
  });

  it('laesst Personen ausserhalb von Zeile und Spalte stehen', () => {
    let s = start();
    s = gameReducer(s, { type: 'select', suspectId: 1 });
    s = gameReducer(s, { type: 'place', cell: zelle(0, 0) });
    s = gameReducer(s, { type: 'select', suspectId: 0 });
    s = gameReducer(s, { type: 'place', cell: zelle(2, 3) });

    expect(s.state.placements[1]).toBe(zelle(0, 0));
    expect(s.state.placements[0]).toBe(zelle(2, 3));
  });

  it('macht alles in einem Schritt rueckgaengig', () => {
    let s = start();
    s = gameReducer(s, { type: 'select', suspectId: 1 });
    s = gameReducer(s, { type: 'note', cell: zelle(2, 0) });
    const vorher = {
      placements: [...s.state.placements],
      notes: JSON.parse(JSON.stringify(s.state.notes)) as Record<number, number[]>,
      marks: [...s.state.marks],
    };

    s = gameReducer(s, { type: 'select', suspectId: 0 });
    s = gameReducer(s, { type: 'place', cell: zelle(2, 3) });
    expect(s.state.marks.length).toBeGreaterThan(0);

    s = gameReducer(s, { type: 'undo' });
    expect(s.state.placements).toEqual(vorher.placements);
    expect(s.state.notes).toEqual(vorher.notes);
    expect(s.state.marks).toEqual(vorher.marks);
  });

  it('die richtige Loesung bleibt widerspruchsfrei setzbar', () => {
    let s = start();
    for (let id = 0; id < core.suspects.length; id++) {
      s = gameReducer(s, { type: 'select', suspectId: id });
      s = gameReducer(s, { type: 'place', cell: core.solution[id]! });
    }
    // Keine Person wurde durch eine spaetere verdraengt.
    expect(s.state.placements).toEqual(core.solution);
    // Und kein X liegt unter einer gesetzten Person.
    for (const cell of core.solution) expect(s.state.marks).not.toContain(cell);
  });
});

describe('Anfangsauswahl', () => {
  it('waehlt niemanden aus, der in der Liste zuletzt steht', () => {
    // Das Opfer steht in der Kartenliste am Ende (app/suspects.ts). Waere es
    // vorausgewaehlt, saesse die Markierung unten, waehrend der Blick oben
    // anfaengt.
    for (let i = 0; i < 40; i++) {
      const puzzle = generatePuzzle(makeSeed('garage', 5 + (i % 6), 2000 + i)).core;
      const selected = initialGame(puzzle).selected;
      expect(selected, String(i)).not.toBeNull();
      expect(puzzle.suspects[selected!]!.isVictim, String(i)).toBe(false);
    }
  });
});
