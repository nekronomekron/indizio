import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BoardLines, labelRun, wallInset, wallWidth } from '../src/app/features/game/board/BoardLines.js';

/**
 * Labels on the board — room name, letter, notes — must not be cut by the
 * room wall, and the room name must not run over it.
 */

describe('wall inset', () => {
  it('lies beyond half the wall at every cell size', () => {
    for (let cellPx = 24; cellPx <= 72; cellPx += 8) {
      expect(wallInset(cellPx), String(cellPx)).toBeGreaterThanOrEqual(wallWidth(cellPx) / 2 + 2);
    }
  });
});

describe('hover highlight', () => {
  it('stays fully inside the board at its edge', () => {
    // Centred on the board's edge, the outer half of the stroke lay outside
    // and was cut off.
    const size = 4;
    const cellPx = 48;
    const half = wallWidth(cellPx) / 2;
    const roomOfCell = new Int32Array(size * size);
    const html = renderToStaticMarkup(createElement(BoardLines, { size, cellPx, roomOfCell, hoverRoom: 0 }));
    const d = /class="line-hover" d="([^"]+)"/.exec(html)![1]!;
    const points = [...d.matchAll(/M([\d.]+) ([\d.]+)/g)].map((match) => [
      Number(match[1]),
      Number(match[2]),
    ]);
    expect(points.length).toBeGreaterThan(0);
    for (const [x, y] of points) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(size * cellPx - half);
      expect(y).toBeLessThanOrEqual(size * cellPx - half);
    }
    // The top edge sits half a stroke lower, not at 0.
    expect(d).toContain('M0 ' + String(half) + 'h');
    expect(d).toContain('M' + String(half) + ' 0v');
  });
});

describe('room name width', () => {
  // 4×4, two rooms: 0 on the left (columns 0–1), 1 on the right (columns 2–3),
  // plus a corridor, room 2, across the whole last row.
  const size = 4;
  const roomOfCell = Int32Array.from([0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 2, 2, 2, 2]);

  it('reaches to the next wall in the row', () => {
    expect(labelRun(0, roomOfCell, size)).toBe(2);
    expect(labelRun(2, roomOfCell, size)).toBe(2);
    expect(labelRun(12, roomOfCell, size)).toBe(4);
  });

  it('does not wrap into the next row at the board edge', () => {
    // Cells 3 and 4 are not in the same room, but even if they were: 4 is in
    // the next row.
    const sameRoom = new Int32Array(16);
    expect(labelRun(2, sameRoom, size)).toBe(2);
    expect(labelRun(15, sameRoom, size)).toBe(1);
  });

  it('is a single cell wide in a corridor', () => {
    const corridor = Int32Array.from([0, 1, 2, 2, 0, 1, 2, 2, 0, 1, 2, 2, 0, 1, 2, 2]);
    expect(labelRun(1, corridor, size)).toBe(1);
  });
});
