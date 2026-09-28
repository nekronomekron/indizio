import { describe, expect, it } from 'vitest';
import { generatePuzzle, makeSeed } from '@engine';
import type { Suspect } from '@engine';
import { cardOrder, suspectLetters } from '../src/app/features/game/suspects.js';

/**
 * How suspects are shown. Both are display questions — the id stays untouched,
 * since it is the index into solution, placements and notes.
 */

function person(id: number, name: string, isVictim = false): Suspect {
  return { id, name, gender: 'female', portraitKey: 'p01', isVictim };
}

describe('suspect letters', () => {
  it('take the first letter of the name', () => {
    const letters = suspectLetters([person(0, 'Nadja'), person(1, 'Urs'), person(2, 'Oskar')]);
    expect(letters).toEqual(['N', 'U', 'O']);
  });

  it('are stored by id, not by display order', () => {
    // The grid looks them up by id: letters[placedId].
    const letters = suspectLetters([person(0, 'Anton'), person(1, 'Vera', true), person(2, 'Carlo')]);
    expect(letters[1]).toBe('V');
  });

  it('lengthen both marks when initials collide', () => {
    // The shipped name pool has different initials throughout; a foreign one
    // need not.
    expect(suspectLetters([person(0, 'Marek'), person(1, 'Nadja')])).toEqual(['M', 'N']);
    expect(suspectLetters([person(0, 'Marek'), person(1, 'Mia')])).toEqual(['MA', 'MI']);
    // Only as far as needed: 'Marek' and 'Marta' part at the fourth letter,
    // 'Dana' stays a single letter.
    const three = suspectLetters([person(0, 'Marek'), person(1, 'Marta'), person(2, 'Dana')]);
    expect(three).toEqual(['MARE', 'MART', 'D']);
    expect(new Set(three).size).toBe(3);
  });

  it('stay single and distinct in real puzzles', () => {
    for (const size of [5, 6, 7, 8, 9, 10]) {
      const { core } = generatePuzzle(makeSeed('garage', size, 4711 + size));
      const letters = suspectLetters(core.suspects);
      expect(
        letters.every((letter) => letter.length === 1),
        String(size),
      ).toBe(true);
      expect(new Set(letters).size, String(size)).toBe(core.suspects.length);
    }
  });
});

describe('card order', () => {
  it('puts the victim last', () => {
    const list = [person(0, 'Anton'), person(1, 'Vera', true), person(2, 'Carlo')];
    expect(cardOrder(list).map((s) => s.name)).toEqual(['Anton', 'Carlo', 'Vera']);
  });

  it('keeps everyone else in order', () => {
    const list = [person(0, 'Anton'), person(1, 'Brigitte'), person(2, 'Carlo', true), person(3, 'Dana')];
    expect(cardOrder(list).map((s) => s.id)).toEqual([0, 1, 3, 2]);
  });

  it('loses and invents nobody', () => {
    for (const size of [5, 8, 10]) {
      const { core } = generatePuzzle(makeSeed('flat', size, 99 + size));
      const order = cardOrder(core.suspects);
      expect(order.length).toBe(core.suspects.length);
      expect(new Set(order.map((s) => s.id)).size).toBe(core.suspects.length);
      expect(order[order.length - 1]!.isVictim).toBe(true);
    }
  });

  it('copes with a list without a victim', () => {
    // Cannot happen in the game, but would be worth a silent crash.
    const list = [person(0, 'Anton'), person(1, 'Brigitte')];
    expect(cardOrder(list).map((s) => s.id)).toEqual([0, 1]);
  });
});
