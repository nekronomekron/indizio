import { describe, expect, it } from 'vitest';
import { generatePuzzle, makeSeed } from '@engine';
import type { Suspect } from '@engine';
import { cardOrder, suspectLetters } from '../src/app/suspects.js';

/**
 * Darstellung der Verdaechtigen. Beides sind Anzeigefragen — die Id bleibt
 * unangetastet, denn sie ist der Index in Loesung, Platzierungen und Notizen.
 */

function person(id: number, name: string, isVictim = false): Suspect {
  return { id, name, gender: 'female', portraitKey: 'p01', isVictim };
}

describe('Buchstaben der Verdaechtigen', () => {
  it('nimmt den Anfangsbuchstaben des Namens', () => {
    const letters = suspectLetters([person(0, 'Nadja'), person(1, 'Urs'), person(2, 'Oskar')]);
    expect(letters).toEqual(['N', 'U', 'O']);
  });

  it('liegt nach Id, nicht nach Anzeigereihenfolge', () => {
    // Das Gitter schlaegt mit der Id nach: letters[placedId].
    const letters = suspectLetters([person(0, 'Anton'), person(1, 'Vera', true), person(2, 'Carlo')]);
    expect(letters[1]).toBe('V');
  });

  it('verlaengert bei gleichem Anfangsbuchstaben beide Marken', () => {
    // Der mitgelieferte Namensvorrat hat durchweg verschiedene Anfangs-
    // buchstaben; ein fremder muss das nicht.
    expect(suspectLetters([person(0, 'Marek'), person(1, 'Nadja')])).toEqual(['M', 'N']);
    expect(suspectLetters([person(0, 'Marek'), person(1, 'Mia')])).toEqual(['MA', 'MI']);
    // Erst dort verlaengert, wo es noetig ist: 'Marek' und 'Marta' trennen
    // sich beim vierten Buchstaben, 'Dana' bleibt einbuchstabig.
    const drei = suspectLetters([person(0, 'Marek'), person(1, 'Marta'), person(2, 'Dana')]);
    expect(drei).toEqual(['MARE', 'MART', 'D']);
    expect(new Set(drei).size).toBe(3);
  });

  it('bleibt bei echten Raetseln einbuchstabig und eindeutig', () => {
    for (const size of [5, 6, 7, 8, 9, 10]) {
      const { core } = generatePuzzle(makeSeed('garage', size, 4711 + size));
      const letters = suspectLetters(core.suspects);
      expect(letters.every((letter) => letter.length === 1), String(size)).toBe(true);
      expect(new Set(letters).size, String(size)).toBe(core.suspects.length);
    }
  });
});

describe('Reihenfolge der Karten', () => {
  it('stellt das Opfer ans Ende', () => {
    const list = [person(0, 'Anton'), person(1, 'Vera', true), person(2, 'Carlo')];
    expect(cardOrder(list).map((s) => s.name)).toEqual(['Anton', 'Carlo', 'Vera']);
  });

  it('laesst die uebrigen in ihrer Reihenfolge', () => {
    const list = [person(0, 'Anton'), person(1, 'Brigitte'), person(2, 'Carlo', true), person(3, 'Dana')];
    expect(cardOrder(list).map((s) => s.id)).toEqual([0, 1, 3, 2]);
  });

  it('verliert und erfindet niemanden', () => {
    for (const size of [5, 8, 10]) {
      const { core } = generatePuzzle(makeSeed('flat', size, 99 + size));
      const order = cardOrder(core.suspects);
      expect(order.length).toBe(core.suspects.length);
      expect(new Set(order.map((s) => s.id)).size).toBe(core.suspects.length);
      expect(order[order.length - 1]!.isVictim).toBe(true);
    }
  });

  it('kommt ohne Opfer in der Liste zurecht', () => {
    // Kann im Spiel nicht vorkommen, waere aber ein stiller Absturz wert.
    const list = [person(0, 'Anton'), person(1, 'Brigitte')];
    expect(cardOrder(list).map((s) => s.id)).toEqual([0, 1]);
  });
});
