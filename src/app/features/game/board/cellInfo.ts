import { columnOf, rowOf } from '@engine';
import type { Cell } from '@engine';

/**
 * What a cell shows, as text — and where its tip goes.
 *
 * Both live here rather than in the grid because both can be tested without
 * a DOM: the text has an order and gaps, the tip has edges. Off-by-one errors
 * live at edges, and an order only gets noticed once it is wrong.
 */

/** A middle dot rather than a comma: the parts are equals, not a list. */
const SEPARATOR = ' · ';

export interface CellFacts {
  /** Room name without article, like the label on the board. */
  room: string;
  /** The prop on this cell, if there is one. */
  object: string | null;
  /** The person the player placed here. */
  person: string | null;
  /** Blocked: nobody can stand here (PLAN.md §3.2, rule 3). */
  blocked: boolean;
  /** The word for "blocked", in the language of the UI. */
  occupied: string;
}

/**
 * One line: room, then prop, then person.
 *
 * From coarse to fine so the eye does not jump, and missing parts simply drop
 * out — an empty cell names only its room. Blocked cells end with the word
 * for "blocked": exactly there the prop's name explains why the board refuses
 * the person. Person and block exclude each other; nobody ever stands on a
 * blocked cell.
 */
export function describeCell(facts: CellFacts): string {
  const last = facts.person ?? (facts.blocked ? facts.occupied : null);
  return [facts.room, facts.object, last]
    .filter((part): part is string => part !== null && part.length > 0)
    .join(SEPARATOR);
}

/** Height of a one-line tip including padding, and its distance from the cell. */
const TIP_HEIGHT = 22;
const TIP_GAP = 4;
/** Width per character and padding, for the estimate below. */
const TIP_CHAR = 7;
const TIP_PAD = 14;

/**
 * Width of the tip, estimated from its character count.
 *
 * Estimated, not measured: measuring after rendering makes the position depend
 * on when rendering happens, and the board computes its cell size up front as
 * well instead of reading it back. For a tooltip it is enough not to fall off
 * the board; nobody notices a few pixels off centre.
 */
export function estimateTipWidth(text: string): number {
  return text.length * TIP_CHAR + TIP_PAD;
}

export interface TipSpot {
  left: number;
  top: number;
  /** The tip hangs below the cell rather than above. */
  below: boolean;
}

/**
 * Position of the tip on the board, in pixels from its top-left corner.
 *
 * Above the cell and centred, because pointer or finger sit on the cell
 * itself. In the top row it flips below, and at the sides it moves inward —
 * the board clips (`overflow: hidden`), and a tip at the edge would be half
 * gone. It cannot get wider than the board; then it simply starts at the left.
 */
export function tipSpot(cell: Cell, size: number, cellPx: number, width: number): TipSpot {
  const boardPx = size * cellPx;
  const row = rowOf(cell, size);
  const column = columnOf(cell, size);

  const centre = column * cellPx + cellPx / 2;
  const left = Math.max(0, Math.min(centre - width / 2, boardPx - width));

  const above = row * cellPx - TIP_HEIGHT - TIP_GAP;
  const below = above < 0;
  const top = below ? row * cellPx + cellPx + TIP_GAP : above;

  return { left: Math.round(left), top: Math.round(top), below };
}
