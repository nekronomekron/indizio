import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SceneObject } from '@engine';
import { TiledObject } from '../src/app/features/game/board/TiledObject.js';
import {
  SHEET_HEIGHT,
  SHEET_WIDTH,
  boardCellPx,
  quarterCase,
  quarterTiles,
  type Corner,
  type QuarterCase,
} from '../src/app/features/game/board/tiles.js';

/**
 * Laid props are assembled from quarters of one fixed sheet (PLAN.md §13.4).
 * What is tested is the arithmetic, not the drawing: a quarter from the sheet
 * for every possible neighbourhood, and never a seam between two cells that
 * belong together.
 */

/** Which sides a quarter is open to — there the drawing runs up to the edge. */
function openTowards(kind: QuarterCase): { vertical: boolean; horizontal: boolean } {
  switch (kind) {
    case 'outer':
      return { vertical: false, horizontal: false };
    case 'horizontal':
      return { vertical: false, horizontal: true };
    case 'vertical':
      return { vertical: true, horizontal: false };
    case 'inner':
    case 'fill':
      return { vertical: true, horizontal: true };
  }
}

const OFFSETS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const;

describe('choosing quarters', () => {
  it('maps the five cases as in the plan', () => {
    expect(quarterCase(false, false, true)).toBe('outer');
    expect(quarterCase(false, true, false)).toBe('horizontal');
    expect(quarterCase(true, false, false)).toBe('vertical');
    expect(quarterCase(true, true, false)).toBe('inner');
    expect(quarterCase(true, true, true)).toBe('fill');
  });

  it('fits a seamless quarter for all 256 neighbourhoods (G22)', () => {
    const size = 3;
    const centre = 4;
    for (let mask = 0; mask < 256; mask++) {
      const cells = [centre];
      OFFSETS.forEach(([row, column], bit) => {
        if (mask & (1 << bit)) cells.push((1 + row) * size + (1 + column));
      });
      const tile = quarterTiles(cells, size).find((entry) => entry.cell === centre)!;
      const has = (row: number, column: number): boolean => cells.includes((1 + row) * size + (1 + column));

      expect(tile.quarters).toHaveLength(4);
      for (const quarter of tile.quarters) {
        // From the sheet, on the quarter grid, in the half of its position.
        expect(quarter.x).toBeGreaterThanOrEqual(0);
        expect(quarter.y).toBeGreaterThanOrEqual(0);
        expect(quarter.x + 12).toBeLessThanOrEqual(SHEET_WIDTH);
        expect(quarter.y + 12).toBeLessThanOrEqual(SHEET_HEIGHT);
        expect(quarter.x % 24, `${quarter.corner} left/right`).toBe(quarter.corner.endsWith('e') ? 12 : 0);
        expect(quarter.y % 24, `${quarter.corner} top/bottom`).toBe(quarter.corner.startsWith('s') ? 12 : 0);

        const vertical = quarter.corner.startsWith('n') ? -1 : 1;
        const horizontal = quarter.corner.endsWith('w') ? -1 : 1;
        const open = openTowards(quarter.case);
        expect(open.vertical, `mask ${mask} ${quarter.corner} vertical`).toBe(has(vertical, 0));
        expect(open.horizontal, `mask ${mask} ${quarter.corner} horizontal`).toBe(has(0, horizontal));
      }
      expect(tile.edges).toEqual({
        north: !has(-1, 0),
        east: !has(0, 1),
        south: !has(1, 0),
        west: !has(0, -1),
      });
    }
  });

  it('uses every source in the sheet for exactly one case', () => {
    const seen = new Map<string, string>();
    for (let mask = 0; mask < 256; mask++) {
      const cells = [4];
      OFFSETS.forEach(([row, column], bit) => {
        if (mask & (1 << bit)) cells.push((1 + row) * 3 + (1 + column));
      });
      for (const quarter of quarterTiles(cells, 3).find((entry) => entry.cell === 4)!.quarters) {
        const source = `${quarter.x},${quarter.y}`;
        const meaning = `${quarter.corner}/${quarter.case}`;
        expect(seen.get(source) ?? meaning, source).toBe(meaning);
        seen.set(source, meaning);
      }
    }
    // Four positions times five cases; the single cell top left stays a preview.
    expect(seen.size).toBe(20);
    expect([...seen.keys()].some((source) => source === '0,0')).toBe(false);
  });

  it('does not wrap into the next row at the grid edge', () => {
    // Cell 3 is at the left edge of the second row, cell 2 at the right edge
    // of the first. Neighbours in the array, not on the board.
    const [left, right] = quarterTiles([2, 3], 3);
    expect(left!.edges.east).toBe(true);
    expect(right!.edges.west).toBe(true);
  });

  it('puts inner corners where an L-shape turns inward', () => {
    // 2×2 minus the bottom right cell: the top left one has all neighbours of
    // the shape, but not the diagonal to the south-east.
    const tiles = quarterTiles([0, 1, 4], 4);
    const corner = (cell: number, name: Corner) =>
      tiles.find((tile) => tile.cell === cell)!.quarters.find((quarter) => quarter.corner === name)!.case;
    expect(corner(0, 'se')).toBe('inner');
    expect(corner(0, 'nw')).toBe('outer');
    expect(corner(1, 'sw')).toBe('horizontal');
    expect(corner(4, 'ne')).toBe('vertical');
  });
});

describe('cell size', () => {
  it('is always even, so a quarter is whole pixels', () => {
    for (let available = 0; available <= 1200; available += 7) {
      for (const size of [5, 6, 7, 8, 9, 10]) {
        const px = boardCellPx(available, available + 13, size);
        expect(px % 2, `${available}/${size}`).toBe(0);
        expect(px).toBeGreaterThanOrEqual(24);
        expect(px).toBeLessThanOrEqual(72);
      }
    }
  });
});

describe('rendering', () => {
  const rug: SceneObject = {
    id: 0,
    key: 'carpet',
    walkable: true,
    placement: 'tiled',
    roomId: 0,
    cells: [0, 1, 6],
  };

  it('draws four quarters from the sheet per cell', () => {
    const html = renderToStaticMarkup(
      createElement(TiledObject, { object: rug, size: 5, cellPx: 48, theme: 'flat' }),
    );
    expect(html.match(/class="object laid walkable"/g)).toHaveLength(3);
    expect(html.match(/class="quarter"/g)).toHaveLength(12);
    expect(html).toContain('background-size:96px 144px');
    // The north-west outer corner is at (0, 24) in the sheet, so at 48 px per cell at -48 px.
    expect(html).toContain('background-position:0px -48px');
  });

  it('frames only the outer edges', () => {
    const html = renderToStaticMarkup(
      createElement(TiledObject, { object: rug, size: 5, cellPx: 48, theme: 'flat' }),
    );
    // Cell 0 has a neighbour to the east (1); to the south 5 is not part of
    // it and 6 is diagonal: edges only north, west and south.
    const first = /<div[^>]*left:0;top:0;[^>]*>/.exec(html)![0];
    expect(first).toContain('inset 0 1px 0 0');
    expect(first).toContain('inset 1px 0 0 0');
    expect(first).toContain('inset 0 -1px 0 0');
    expect(first).not.toContain('inset -1px 0 0 0');
  });

  it('draws only the tint without a sheet, instead of breaking', () => {
    const html = renderToStaticMarkup(
      createElement(TiledObject, {
        object: { ...rug, key: 'unbekannt' },
        size: 5,
        cellPx: 48,
        theme: 'flat',
      }),
    );
    expect(html.match(/class="object laid walkable"/g)).toHaveLength(3);
    expect(html).not.toContain('quarter');
  });
});
