import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BoardLines, labelRun, wallInset, wallWidth } from '../src/app/components/BoardLines.js';

/**
 * Beschriftungen auf dem Brett — Raumname, Buchstabe, Notizen — dürfen die
 * Raumwand nicht anschneiden, und der Raumname nicht über sie hinweglaufen.
 */

describe('Wandabstand', () => {
  it('liegt bei jeder Zellgröße jenseits der halben Wand', () => {
    for (let cellPx = 24; cellPx <= 72; cellPx += 8) {
      expect(wallInset(cellPx), String(cellPx)).toBeGreaterThanOrEqual(wallWidth(cellPx) / 2 + 2);
    }
  });
});

describe('Hervorhebung beim Darüberfahren', () => {
  it('liegt am Brettrand ganz innerhalb des Brettes', () => {
    // Mittig auf der Brettkante lag die äußere Hälfte des Strichs außerhalb
    // und wurde abgeschnitten.
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
    // Die obere Kante liegt um die halbe Strichstärke tiefer, nicht auf 0.
    expect(d).toContain('M0 ' + String(half) + 'h');
    expect(d).toContain('M' + String(half) + ' 0v');
  });
});

describe('Breite des Raumnamens', () => {
  // 4×4, zwei Räume: 0 links (Spalten 0–1), 1 rechts (Spalten 2–3), dazu ein
  // Gang aus Raum 2 in der letzten Zeile über die ganze Breite.
  const size = 4;
  const roomOfCell = Int32Array.from([0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 2, 2, 2, 2]);

  it('reicht bis zur nächsten Wand in der Zeile', () => {
    expect(labelRun(0, roomOfCell, size)).toBe(2);
    expect(labelRun(2, roomOfCell, size)).toBe(2);
    expect(labelRun(12, roomOfCell, size)).toBe(4);
  });

  it('bricht am Brettrand nicht in die nächste Zeile um', () => {
    // Zelle 3 und 4 gehören nicht zum selben Raum, aber selbst wenn: 4 liegt
    // in der nächsten Zeile.
    const sameRoom = new Int32Array(16);
    expect(labelRun(2, sameRoom, size)).toBe(2);
    expect(labelRun(15, sameRoom, size)).toBe(1);
  });

  it('ist in einem Gang ein einziges Feld breit', () => {
    const corridor = Int32Array.from([0, 1, 2, 2, 0, 1, 2, 2, 0, 1, 2, 2, 0, 1, 2, 2]);
    expect(labelRun(1, corridor, size)).toBe(1);
  });
});
