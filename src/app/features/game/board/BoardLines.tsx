import { useMemo, type ReactElement } from 'react';
import { columnOf, rowOf } from '@engine';
import styles from './board.module.css';

export interface BoardLinesProps {
  size: number;
  cellPx: number;
  /** Room id per cell. Rooms may be any shape, hence per cell. */
  roomOfCell: Int32Array;
  /** Room under the mouse, or `null`. Always `null` on touch devices. */
  hoverRoom: number | null;
}

/**
 * Line widths, measured against the cell rather than fixed in pixels.
 *
 * A fixed width would be too thin on a phone and too coarse on a desktop. The
 * minimums keep both lines readable as two different weights even on the
 * smallest grid (10×10 at 360 px, a cell ≈ 32 px) — which is what matters: a
 * room border has to *differ* from the cell grid, not merely exist.
 */
export function wallWidth(cellPx: number): number {
  return Math.max(4, Math.round(cellPx * 0.1));
}

export function gridWidth(cellPx: number): number {
  return Math.max(1, Math.round(cellPx * 0.035));
}

/**
 * Distance from the cell edge that labels keep: room name, letter, notes.
 *
 * The wall sits centred on the cell edge and so reaches half its width into
 * the cell. Anything closer to the edge gets cut by it. The distance applies
 * always, not only at edges with a wall — otherwise letters would jump in by
 * different amounts depending on where they are.
 */
export function wallInset(cellPx: number): number {
  return wallWidth(cellPx) / 2 + 2;
}

/**
 * How many cells of the same room lie from `cell` to the right in its row,
 * `cell` included. That is how wide the room name may get without running
 * over a wall into the next room.
 */
export function labelRun(cell: number, roomOfCell: Int32Array, size: number): number {
  const room = roomOfCell[cell];
  let run = 1;
  // Column 0 means the next cell is already in the next row.
  while (cell + run < size * size && columnOf(cell + run, size) !== 0 && roomOfCell[cell + run] === room)
    run++;
  return run;
}

/**
 * The board's lines: thin between cells, *thick around every room*.
 *
 * Room borders are game information, not decoration — almost every clue
 * refers to rooms ("alone in the room", "in the same room as"). Whoever cannot
 * see the border cannot apply the clue.
 *
 * So the borders are *always* visible, not only on hover: phones have no
 * hover, and information only a mouse can reach is missing for half the
 * players. The coloured highlight on hover comes on top at a desk; it replaces
 * nothing.
 *
 * Everything in *one* SVG rather than a shadow per cell: a shared edge is drawn
 * once instead of twice by halves, and the stroke is exactly the given width —
 * with tile shadows it would be twice as thick at room borders as at the
 * board's edge.
 */
export function BoardLines({ size, cellPx, roomOfCell, hoverRoom }: BoardLinesProps): ReactElement {
  const boardPx = size * cellPx;
  const thick = wallWidth(cellPx);
  const thin = gridWidth(cellPx);

  const paths = useMemo(() => {
    const walls: string[] = [];
    const grid: string[] = [];

    // Only the top and left edge per cell: so every inner edge is drawn
    // exactly once. The board's edge is a rectangle of its own below.
    for (let cell = 0; cell < size * size; cell++) {
      const room = roomOfCell[cell];
      const r = rowOf(cell, size);
      const c = columnOf(cell, size);
      const x = c * cellPx;
      const y = r * cellPx;

      if (r > 0) {
        const line = 'M' + String(x) + ' ' + String(y) + 'h' + String(cellPx);
        (roomOfCell[cell - size] === room ? grid : walls).push(line);
      }
      if (c > 0) {
        const line = 'M' + String(x) + ' ' + String(y) + 'v' + String(cellPx);
        (roomOfCell[cell - 1] === room ? grid : walls).push(line);
      }
    }

    return { walls: walls.join(''), grid: grid.join('') };
  }, [roomOfCell, size, cellPx]);

  /**
   * Border of the room under the mouse, as its own stroke above the black line.
   *
   * At the board's edge it moves in by half the stroke width, like the black
   * border beneath — centred on the edge, its outer half would lie outside the
   * board and be cut off.
   */
  const hovered = useMemo(() => {
    if (hoverRoom === null) return '';
    const half = thick / 2;
    const segments: string[] = [];
    for (let cell = 0; cell < size * size; cell++) {
      if (roomOfCell[cell] !== hoverRoom) continue;
      const r = rowOf(cell, size);
      const c = columnOf(cell, size);
      const x = c * cellPx;
      const y = r * cellPx;
      const top = r === 0 ? half : y;
      const bottom = r === size - 1 ? boardPx - half : y + cellPx;
      const left = c === 0 ? half : x;
      const right = c === size - 1 ? boardPx - half : x + cellPx;
      if (r === 0 || roomOfCell[cell - size] !== hoverRoom)
        segments.push('M' + String(x) + ' ' + String(top) + 'h' + String(cellPx));
      if (r === size - 1 || roomOfCell[cell + size] !== hoverRoom)
        segments.push('M' + String(x) + ' ' + String(bottom) + 'h' + String(cellPx));
      if (c === 0 || roomOfCell[cell - 1] !== hoverRoom)
        segments.push('M' + String(left) + ' ' + String(y) + 'v' + String(cellPx));
      if (c === size - 1 || roomOfCell[cell + 1] !== hoverRoom)
        segments.push('M' + String(right) + ' ' + String(y) + 'v' + String(cellPx));
    }
    return segments.join('');
  }, [hoverRoom, roomOfCell, size, cellPx, thick, boardPx]);

  return (
    <svg
      className={styles.lines}
      width={boardPx}
      height={boardPx}
      viewBox={'0 0 ' + String(boardPx) + ' ' + String(boardPx)}
      aria-hidden="true"
      focusable="false"
    >
      <path className={styles.lineGrid} d={paths.grid} strokeWidth={thin} shapeRendering="crispEdges" />
      <path className={styles.lineWall} d={paths.walls} strokeWidth={thick} />
      {/* The board's edge lies half inside, or the edge would cut it off. */}
      <rect
        className={styles.lineWall}
        x={thick / 2}
        y={thick / 2}
        width={boardPx - thick}
        height={boardPx - thick}
        strokeWidth={thick}
      />
      {hovered !== '' && <path className={styles.lineHover} d={hovered} strokeWidth={thick} />}
    </svg>
  );
}
