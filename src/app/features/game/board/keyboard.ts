import { columnOf, rowOf } from '@engine';
import type { Cell } from '@engine';

/**
 * Where the keyboard frame moves from here.
 *
 * A function of its own because bumping into the edges is exactly where an
 * off-by-one error lives — and because otherwise keyboard use would not be
 * tested at all: a key press in the grid cannot be replayed without a DOM,
 * this arithmetic can.
 *
 * Returns `null` when the key is not a movement. At the edge the frame stays
 * put instead of jumping to the next row: a grid is not a line of text, and
 * whoever holds right does not want to end up one row down on the far left.
 */
export function moveCursor(at: Cell, key: string, size: number): Cell | null {
  const row = rowOf(at, size);
  const column = columnOf(at, size);

  switch (key) {
    case 'ArrowLeft':
      return column > 0 ? at - 1 : at;
    case 'ArrowRight':
      return column < size - 1 ? at + 1 : at;
    case 'ArrowUp':
      return row > 0 ? at - size : at;
    case 'ArrowDown':
      return row < size - 1 ? at + size : at;
    case 'Home':
      return at - column;
    case 'End':
      return at - column + size - 1;
    default:
      return null;
  }
}
