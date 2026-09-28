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
 * Verlegte Requisiten werden aus Vierteln eines festen Blatts zusammengesetzt
 * (PLAN.md §13.4). Geprueft wird die Rechnung, nicht die Zeichnung: fuer jede
 * denkbare Nachbarschaft ein Viertel aus dem Blatt, und nie eine Naht zwischen
 * zwei Zellen, die zusammengehoeren.
 */

/** Zu welcher Seite ein Viertel offen ist — dort laeuft die Zeichnung bis an die Kante. */
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

describe('Viertelwahl', () => {
  it('ordnet die fuenf Faelle wie im Plan zu', () => {
    expect(quarterCase(false, false, true)).toBe('outer');
    expect(quarterCase(false, true, false)).toBe('horizontal');
    expect(quarterCase(true, false, false)).toBe('vertical');
    expect(quarterCase(true, true, false)).toBe('inner');
    expect(quarterCase(true, true, true)).toBe('fill');
  });

  it('liefert fuer alle 256 Nachbarschaften passende Viertel ohne Naht (G22)', () => {
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
        // Aus dem Blatt, auf dem Viertelraster, in der Haelfte seiner Lage.
        expect(quarter.x).toBeGreaterThanOrEqual(0);
        expect(quarter.y).toBeGreaterThanOrEqual(0);
        expect(quarter.x + 12).toBeLessThanOrEqual(SHEET_WIDTH);
        expect(quarter.y + 12).toBeLessThanOrEqual(SHEET_HEIGHT);
        expect(quarter.x % 24, `${quarter.corner} links/rechts`).toBe(quarter.corner.endsWith('e') ? 12 : 0);
        expect(quarter.y % 24, `${quarter.corner} oben/unten`).toBe(quarter.corner.startsWith('s') ? 12 : 0);

        const vertical = quarter.corner.startsWith('n') ? -1 : 1;
        const horizontal = quarter.corner.endsWith('w') ? -1 : 1;
        const open = openTowards(quarter.case);
        expect(open.vertical, `mask ${mask} ${quarter.corner} senkrecht`).toBe(has(vertical, 0));
        expect(open.horizontal, `mask ${mask} ${quarter.corner} waagerecht`).toBe(has(0, horizontal));
      }
      expect(tile.edges).toEqual({
        north: !has(-1, 0),
        east: !has(0, 1),
        south: !has(1, 0),
        west: !has(0, -1),
      });
    }
  });

  it('verwendet jede Quelle im Blatt fuer genau einen Fall', () => {
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
    // Vier Lagen mal fuenf Faelle; das Einzelfeld oben links bleibt Vorschau.
    expect(seen.size).toBe(20);
    expect([...seen.keys()].some((source) => source === '0,0')).toBe(false);
  });

  it('bricht am Gitterrand nicht in die naechste Zeile um', () => {
    // Zelle 3 liegt am linken Rand der zweiten Zeile, Zelle 2 am rechten der
    // ersten. Nebeneinander im Array, auf dem Brett nicht benachbart.
    const [left, right] = quarterTiles([2, 3], 3);
    expect(left!.edges.east).toBe(true);
    expect(right!.edges.west).toBe(true);
  });

  it('setzt Innenecken, wo eine L-Form nach innen knickt', () => {
    // 2×2 minus die rechte untere Zelle: die linke obere hat alle Nachbarn
    // der Form, aber nicht die Diagonale nach Suedosten.
    const tiles = quarterTiles([0, 1, 4], 4);
    const corner = (cell: number, name: Corner) =>
      tiles.find((tile) => tile.cell === cell)!.quarters.find((quarter) => quarter.corner === name)!.case;
    expect(corner(0, 'se')).toBe('inner');
    expect(corner(0, 'nw')).toBe('outer');
    expect(corner(1, 'sw')).toBe('horizontal');
    expect(corner(4, 'ne')).toBe('vertical');
  });
});

describe('Zellgroesse', () => {
  it('ist immer gerade, damit ein Viertel ganze Pixel misst', () => {
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

describe('Darstellung', () => {
  const rug: SceneObject = {
    id: 0,
    key: 'carpet',
    walkable: true,
    placement: 'tiled',
    roomId: 0,
    cells: [0, 1, 6],
  };

  it('zeichnet je Zelle vier Viertel aus dem Blatt', () => {
    const html = renderToStaticMarkup(
      createElement(TiledObject, { object: rug, size: 5, cellPx: 48, theme: 'flat' }),
    );
    expect(html.match(/class="object laid walkable"/g)).toHaveLength(3);
    expect(html.match(/class="quarter"/g)).toHaveLength(12);
    expect(html).toContain('background-size:96px 144px');
    // Die Aussenecke Nordwest liegt im Blatt bei (0, 24), bei 48 px je Feld also bei -48 px.
    expect(html).toContain('background-position:0px -48px');
  });

  it('rahmt nur die Aussenkanten', () => {
    const html = renderToStaticMarkup(
      createElement(TiledObject, { object: rug, size: 5, cellPx: 48, theme: 'flat' }),
    );
    // Zelle 0 hat Nachbarn im Osten (1) und im Sueden (5 gehoert nicht dazu,
    // 6 liegt diagonal): Rand nur im Norden, Westen und Sueden.
    const first = /<div[^>]*left:0;top:0;[^>]*>/.exec(html)![0];
    expect(first).toContain('inset 0 1px 0 0');
    expect(first).toContain('inset 1px 0 0 0');
    expect(first).toContain('inset 0 -1px 0 0');
    expect(first).not.toContain('inset -1px 0 0 0');
  });

  it('zeichnet ohne Blatt nur die Toenung, statt zu brechen', () => {
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
