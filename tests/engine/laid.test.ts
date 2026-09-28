import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  GenerationError, Rng, THEMES, generatePuzzle, makeSeed, themeProblems, verifyPuzzle,
} from '../../src/engine/index.js';
import type { Theme, ThemeObject, TiledPlacement } from '../../src/engine/index.js';
import { boundsOf, isConnected, orthogonalNeighbours } from '../../src/engine/core/grid.js';
import { furnishScene, randomPermutationCells } from '../../src/engine/generation/furnish.js';
import { generateRooms, roomCountFor } from '../../src/engine/generation/layout.js';
import { expectObjectShapes } from './support/invariants.js';

/**
 * Laid objects (PLAN.md §13): carpets, mats and later corridors that take any
 * connected shape inside a room, grown cell by cell rather than picked from a
 * list of rectangles.
 */

const ROOMS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

function laid(key: string, walkable: boolean, placement: Omit<TiledPlacement, 'kind'>): ThemeObject {
  return { key, walkable, placement: { kind: 'tiled', ...placement }, rooms: ROOMS, maxPerScene: 4, weight: 4 };
}

function single(key: string, walkable: boolean): ThemeObject {
  return { key, walkable, placement: { kind: 'fixed', footprints: [[1, 1]] }, rooms: ROOMS, maxPerScene: 6, weight: 1 };
}

/** A theme made of laid objects only, plus the single squares every room needs. */
function laidTheme(placement: Omit<TiledPlacement, 'kind'>): Theme {
  return {
    key: 'laid',
    roomKeys: ROOMS,
    objects: [
      laid('rug', true, placement),
      laid('runner', true, placement),
      laid('hedge', false, placement),
      single('stool', true),
      single('crate', false),
    ],
  };
}

const placementArbitrary = fc
  .record({
    minCells: fc.integer({ min: 1, max: 5 }),
    extra: fc.integer({ min: 0, max: 8 }),
    compactness: fc.double({ min: 0, max: 1, noNaN: true }),
    straightness: fc.double({ min: 0, max: 1, noNaN: true }),
  })
  .map(({ minCells, extra, compactness, straightness }) =>
    ({ minCells, maxCells: minCells + extra, compactness, straightness }));

describe('growing laid shapes', () => {
  it('only ever produces shapes the rules allow', () => {
    fc.assert(
      fc.property(
        placementArbitrary,
        fc.integer({ min: 0, max: 2 ** 30 }),
        fc.constantFrom(5, 6, 8, 10),
        (placement, random, size) => {
          const rng = new Rng(random);
          const rooms = generateRooms(rng, size, roomCountFor(size), ROOMS);
          const solution = randomPermutationCells(rng, size);
          const theme = laidTheme(placement);
          const { objects, anchorIds } = furnishScene(rng, size, rooms, theme, solution, 3);
          const solutionCells = new Set(solution);
          const roomOf = new Map<number, number>();
          for (const room of rooms) for (const cell of room.cells) roomOf.set(cell, room.id);

          const owner = new Map<number, { key: string; id: number }>();
          for (const object of objects) {
            expect(object.placement).toBe(theme.objects.find((entry) => entry.key === object.key)!.placement.kind);
            expect(isConnected(new Set(object.cells), size)).toBe(true);
            for (const cell of object.cells) {
              expect(roomOf.get(cell)).toBe(object.roomId);
              expect(owner.has(cell), 'objects never overlap').toBe(false);
              owner.set(cell, { key: object.key, id: object.id });
              if (!object.walkable) expect(solutionCells.has(cell), 'nothing blocks a solution cell').toBe(false);
            }
            if (object.placement !== 'tiled') continue;
            expect(object.cells.length).toBeGreaterThanOrEqual(placement.minCells);
            expect(object.cells.length).toBeLessThanOrEqual(placement.maxCells);
            expect(object.cells, 'cells are sorted').toEqual([...object.cells].sort((a, b) => a - b));
            if (anchorIds.includes(object.id)) {
              const covered = object.cells.filter((cell) => solutionCells.has(cell));
              expect(covered, 'an anchor covers only its own person').toHaveLength(1);
            }
          }

          for (const [cell, mine] of owner) {
            for (const neighbour of orthogonalNeighbours(cell, size)) {
              const other = owner.get(neighbour);
              if (!other || other.id === mine.id || other.key !== mine.key) continue;
              const kind = objects[mine.id]!.placement;
              expect(kind, `two ${mine.key} touch`).not.toBe('tiled');
            }
          }
        },
      ),
      { numRuns: 60 },
    );
  });

  it('grows lanes without any filled square at compactness 0', () => {
    // At 0 a cell is only added while it touches the shape once, so the shape
    // is a tree: corners, branches and crossings, but never a 2×2 block.
    for (let random = 0; random < 40; random++) {
      const rng = new Rng(random);
      const size = 8;
      const rooms = generateRooms(rng, size, roomCountFor(size), ROOMS);
      const theme = laidTheme({ minCells: 3, maxCells: 12, compactness: 0, straightness: 0.5 });
      const { objects } = furnishScene(rng, size, rooms, theme, randomPermutationCells(rng, size), 3);
      for (const object of objects.filter((entry) => entry.placement === 'tiled')) {
        const cells = new Set(object.cells);
        for (const cell of object.cells) {
          const block = [cell, cell + 1, cell + size, cell + size + 1];
          const sameRow = cell % size !== size - 1;
          expect(sameRow && block.every((entry) => cells.has(entry)), `${object.key} has a filled square`).toBe(false);
        }
      }
    }
  });

  it('fills out into areas at compactness 1', () => {
    let squares = 0;
    for (let random = 0; random < 40; random++) {
      const rng = new Rng(random);
      const size = 8;
      const rooms = generateRooms(rng, size, roomCountFor(size), ROOMS);
      const theme = laidTheme({ minCells: 4, maxCells: 6, compactness: 1, straightness: 0 });
      const { objects } = furnishScene(rng, size, rooms, theme, randomPermutationCells(rng, size), 3);
      for (const object of objects.filter((entry) => entry.placement === 'tiled')) {
        const bounds = boundsOf(object.cells, size);
        const area = (bounds.maxRow - bounds.minRow + 1) * (bounds.maxColumn - bounds.minColumn + 1);
        if (area < object.cells.length * 2) squares++;
      }
    }
    expect(squares, 'compact shapes should be common').toBeGreaterThan(10);
  });
});

describe('themes with laid objects', () => {
  it('shipped themes are valid', () => {
    for (const theme of THEMES) expect(themeProblems(theme), theme.key).toEqual([]);
  });

  it.each([
    ['minCells below 1', { minCells: 0, maxCells: 3, compactness: 0.5, straightness: 0.5 }, /minCells/],
    ['maxCells below minCells', { minCells: 4, maxCells: 3, compactness: 0.5, straightness: 0.5 }, /maxCells/],
    ['compactness above 1', { minCells: 1, maxCells: 3, compactness: 1.5, straightness: 0.5 }, /compactness/],
    ['straightness below 0', { minCells: 1, maxCells: 3, compactness: 0.5, straightness: -0.1 }, /straightness/],
  ])('reject %s', (_name, placement, pattern) => {
    const theme = laidTheme(placement);
    expect(themeProblems(theme).join('; ')).toMatch(pattern);
    expect(() => generatePuzzle(makeSeed('laid', 5, 1), { themes: [theme] })).toThrow(GenerationError);
  });

  it('reject a fixed object without a footprint', () => {
    const theme: Theme = { key: 'x', roomKeys: ROOMS, objects: [{ ...single('stool', true), placement: { kind: 'fixed', footprints: [] } }] };
    expect(themeProblems(theme)).toEqual(['x/stool has no footprint']);
  });

  it('generate verifiable puzzles from a theme of laid objects', () => {
    const theme = laidTheme({ minCells: 2, maxCells: 7, compactness: 0.4, straightness: 0.6 });
    for (const random of [1, 2, 3]) {
      const { core } = generatePuzzle(makeSeed('laid', 6, random), { themes: [theme] });
      expect(verifyPuzzle(core).ok).toBe(true);
      expect(core.objects.some((object) => object.placement === 'tiled')).toBe(true);
      expectObjectShapes(core);
    }
  });
});
