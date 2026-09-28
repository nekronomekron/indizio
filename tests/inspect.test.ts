import { describe, expect, it } from 'vitest';
import { describeCell, estimateTipWidth, tipSpot } from '../src/app/features/game/board/cellInfo.js';

/**
 * The names of a cell.
 *
 * Clues name props ("was next to the shelf"); the board used to show only a
 * picture of them. Whoever could not read the drawing could not check the clue
 * — that was guessing pictures, not deduction. Two things have to be right for
 * this: what the text says, and that the tip stays on the board.
 */

const OCCUPIED = 'blocked';

function facts(over: Partial<Parameters<typeof describeCell>[0]> = {}) {
  return { room: 'Workshop', object: null, person: null, blocked: false, occupied: OCCUPIED, ...over };
}

describe('describing a cell', () => {
  it('names only the room on an empty cell', () => {
    expect(describeCell(facts())).toBe('Workshop');
  });

  it('goes from room to prop to person', () => {
    const text = describeCell(facts({ object: 'Workbench', person: 'Nadja' }));
    expect(text).toBe('Workshop · Workbench · Nadja');
  });

  it('leaves missing parts out rather than leaving separators behind', () => {
    expect(describeCell(facts({ person: 'Nadja' }))).toBe('Workshop · Nadja');
    expect(describeCell(facts({ object: 'Workbench' }))).toBe('Workshop · Workbench');
    expect(describeCell(facts({ object: '', person: '' }))).toBe('Workshop');
  });

  /**
   * The case this is really about: the board only flashes red when you reach
   * for a blocked cell. The prop's name is the explanation.
   */
  it('explains a blocked cell with the prop on it', () => {
    expect(describeCell(facts({ object: 'Workbench', blocked: true }))).toBe(
      'Workshop · Workbench · blocked',
    );
  });

  it('names a block without a prop too', () => {
    expect(describeCell(facts({ blocked: true }))).toBe('Workshop · blocked');
  });

  it('never names person and block together', () => {
    // Both cannot happen on the board; if they do, what is visible wins:
    // someone stands there.
    expect(describeCell(facts({ person: 'Nadja', blocked: true }))).toBe('Workshop · Nadja');
  });
});

describe('position of the tip', () => {
  const CELL = 40;
  const SIZE = 5; // board: 200 pixels
  const WIDTH = 60;

  it('hangs centred above the cell', () => {
    const spot = tipSpot(2 * SIZE + 2, SIZE, CELL, WIDTH); // row 2, column 2
    expect(spot.below).toBe(false);
    // Cell centre 100, half the tip 30.
    expect(spot.left).toBe(70);
    expect(spot.top).toBe(2 * CELL - 22 - 4);
  });

  it('flips below in the top row', () => {
    const spot = tipSpot(3, SIZE, CELL, WIDTH);
    expect(spot.below).toBe(true);
    expect(spot.top).toBe(CELL + 4);
  });

  it('stays on the board left and right', () => {
    for (let row = 0; row < SIZE; row++) {
      const left = tipSpot(row * SIZE, SIZE, CELL, WIDTH);
      const right = tipSpot(row * SIZE + SIZE - 1, SIZE, CELL, WIDTH);
      expect(left.left).toBe(0);
      expect(right.left).toBe(SIZE * CELL - WIDTH);
    }
  });

  it('never falls off, for any cell and board size', () => {
    for (const size of [5, 6, 7, 8, 9, 10]) {
      for (const cellPx of [24, 40, 72]) {
        for (let cell = 0; cell < size * size; cell++) {
          const spot = tipSpot(cell, size, cellPx, WIDTH);
          expect(spot.left).toBeGreaterThanOrEqual(0);
          expect(spot.left + WIDTH).toBeLessThanOrEqual(size * cellPx);
          expect(spot.top).toBeGreaterThanOrEqual(0);
          expect(spot.top + 22).toBeLessThanOrEqual(size * cellPx);
        }
      }
    }
  });

  it('starts at the left when the tip is wider than the board', () => {
    const spot = tipSpot(12, SIZE, CELL, 400);
    expect(spot.left).toBe(0);
  });

  it('estimates its width from the length of the text', () => {
    expect(estimateTipWidth('')).toBeGreaterThan(0);
    expect(estimateTipWidth('Workshop · Workbench')).toBeGreaterThan(estimateTipWidth('Workshop'));
  });
});
