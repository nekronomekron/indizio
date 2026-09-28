import type { Cell } from '@engine';

/**
 * Drawing laid props (PLAN.md §13.4).
 *
 * A carpet turning a corner is no rectangle and so no single picture. Every
 * cell is put together from *four quarters*, and every quarter comes from one
 * fixed sheet of 48 × 72 (2 × 3 cells):
 *
 * ```
 * [ single cell ][ inner corners ]   y  0–24
 * [ 2×2 block: outer corners,    ]   y 24–72
 * [ edges and fill               ]
 * ```
 *
 * Which quarter a cell gets depends only on the two neighbours that quarter
 * borders and the diagonal between them. A quarter always comes from the same
 * position in the sheet as it takes on the board — nothing is rotated, so the
 * drawing's light and perspective stay right.
 *
 * Pure arithmetic without a DOM, so it can be tested completely.
 */

/** Sheet size in drawing units. */
export const SHEET_WIDTH = 48;
export const SHEET_HEIGHT = 72;
/** Side of one cell in the sheet; a quarter is half as big. */
export const SHEET_UNIT = 24;

export type Corner = 'nw' | 'ne' | 'sw' | 'se';

/**
 * What a quarter borders on.
 *
 * - `outer`: neither the vertical nor the horizontal neighbour belongs to the shape
 * - `horizontal`: only the horizontal one; the quarter is part of a horizontal edge
 * - `vertical`: only the vertical one; part of a vertical edge
 * - `inner`: both, but not the diagonal — an inner corner
 * - `fill`: all three
 */
export type QuarterCase = 'outer' | 'horizontal' | 'vertical' | 'inner' | 'fill';

export interface Quarter {
  corner: Corner;
  case: QuarterCase;
  /** Top-left corner of the source in the sheet, in drawing units. */
  x: number;
  y: number;
}

/** Outer edges of a cell: where the shape ends and a border belongs. */
export interface OpenEdges {
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
}

export interface TileCell {
  cell: Cell;
  row: number;
  column: number;
  quarters: Quarter[];
  edges: OpenEdges;
}

/**
 * Source per position and case. The north-west row is also in PLAN.md §13.4;
 * the others follow from an east quarter coming from the right half of its
 * cell and a south quarter from the lower half.
 */
const SOURCE: Record<Corner, Record<QuarterCase, readonly [number, number]>> = {
  nw: { outer: [0, 24], horizontal: [24, 24], vertical: [0, 48], fill: [24, 48], inner: [24, 0] },
  ne: { outer: [36, 24], horizontal: [12, 24], vertical: [36, 48], fill: [12, 48], inner: [36, 0] },
  sw: { outer: [0, 60], horizontal: [24, 60], vertical: [0, 36], fill: [24, 36], inner: [24, 12] },
  se: { outer: [36, 60], horizontal: [12, 60], vertical: [36, 36], fill: [12, 36], inner: [36, 12] },
};

/** Which neighbours a quarter touches, as row and column steps: vertical, horizontal, diagonal. */
const REACH: Record<Corner, { vertical: number; horizontal: number }> = {
  nw: { vertical: -1, horizontal: -1 },
  ne: { vertical: -1, horizontal: 1 },
  sw: { vertical: 1, horizontal: -1 },
  se: { vertical: 1, horizontal: 1 },
};

const CORNERS: readonly Corner[] = ['nw', 'ne', 'sw', 'se'];

export function quarterCase(vertical: boolean, horizontal: boolean, diagonal: boolean): QuarterCase {
  if (!vertical && !horizontal) return 'outer';
  if (!vertical) return 'horizontal';
  if (!horizontal) return 'vertical';
  return diagonal ? 'fill' : 'inner';
}

/** Quarters and outer edges for every cell of a shape. */
export function quarterTiles(cells: readonly Cell[], size: number): TileCell[] {
  const inShape = new Set(cells);
  const has = (row: number, column: number): boolean =>
    row >= 0 && row < size && column >= 0 && column < size && inShape.has(row * size + column);

  return cells.map((cell) => {
    const row = Math.floor(cell / size);
    const column = cell % size;
    const quarters = CORNERS.map((corner): Quarter => {
      const { vertical, horizontal } = REACH[corner];
      const kind = quarterCase(
        has(row + vertical, column),
        has(row, column + horizontal),
        has(row + vertical, column + horizontal),
      );
      const [x, y] = SOURCE[corner][kind];
      return { corner, case: kind, x, y };
    });
    return {
      cell,
      row,
      column,
      quarters,
      edges: {
        north: !has(row - 1, column),
        east: !has(row, column + 1),
        south: !has(row + 1, column),
        west: !has(row, column - 1),
      },
    };
  });
}

/**
 * Side of a cell in pixels for the space available.
 *
 * In steps of eight: that keeps lines sharp and makes a quarter (half a cell)
 * a whole number. Half a pixel there would let a seam show between the
 * quarters of a laid shape.
 */
export function boardCellPx(availableW: number, availableH: number, size: number): number {
  return Math.min(72, Math.max(24, Math.floor(Math.min(availableW, availableH) / size / 8) * 8));
}
