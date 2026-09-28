import { boundsOf, buildSceneIndex, cellAt, type SceneIndex } from '../../../src/engine/core/grid.js';
import type { Assignment, Cell, Room, Scene, SceneObject, Suspect } from '../../../src/engine/core/types.js';
import { buildOccupancy, type Occupancy } from '../../../src/engine/clues/occupancy.js';

/**
 * A hand-built scene with known geometry.
 *
 * Property tests cover the generator; this covers *meaning*. Every clue type
 * has an answer here that can be worked out by eye, which is what makes a
 * failure diagnosable rather than merely red.
 *
 * ```
 * Room names are real theme keys, so the i18n tests find translations.
 *
 *      c0   c1   c2   c3   c4
 * r0  [SH] [SH]  A                  rooms: workshop = rows 0-2
 * r1            [CH]B               rooms: storage  = rows 3-4
 * r2                      C
 * r3   D                            SH = shelf (blocking, 2 cells)
 * r4        E             [TR]      CH = chair (walkable), TR = tree (blocking)
 * ```
 */

const SIZE = 5;

function room(id: number, nameKey: string, cells: Cell[]): Room {
  return { id, nameKey, cells, bounds: boundsOf(cells, SIZE) };
}

function rectangle(fromRow: number, toRow: number): Cell[] {
  const cells: Cell[] = [];
  for (let row = fromRow; row <= toRow; row++) {
    for (let column = 0; column < SIZE; column++) cells.push(cellAt(row, column, SIZE));
  }
  return cells;
}

function object(
  id: number,
  key: string,
  walkable: boolean,
  roomId: number,
  cells: [number, number][],
): SceneObject {
  return {
    id,
    key,
    walkable,
    placement: 'fixed',
    roomId,
    cells: cells.map(([row, column]) => cellAt(row, column, SIZE)),
  };
}

export interface Fixture {
  scene: Scene;
  index: SceneIndex;
  suspects: Suspect[];
  solution: Assignment;
  occupancy: Occupancy;
  cell: (row: number, column: number) => Cell;
}

export function buildFixture(): Fixture {
  const scene: Scene = {
    size: SIZE,
    themeKey: 'test',
    rooms: [room(0, 'workshop', rectangle(0, 2)), room(1, 'storage', rectangle(3, 4))],
    objects: [
      object(0, 'shelf', false, 0, [
        [0, 0],
        [0, 1],
      ]),
      object(1, 'chair', true, 0, [[1, 2]]),
      object(2, 'tree', false, 1, [[4, 4]]),
    ],
  };

  // Rows 0-4 occupied in columns 3, 2, 4, 0, 1 — one per row and column.
  const solution: Assignment = [
    cellAt(0, 3, SIZE),
    cellAt(1, 2, SIZE),
    cellAt(2, 4, SIZE),
    cellAt(3, 0, SIZE),
    cellAt(4, 1, SIZE),
  ];

  const suspects: Suspect[] = Array.from({ length: 5 }, (_, id) => ({
    id,
    name: String.fromCharCode(65 + id),
    gender: id % 2 === 0 ? ('male' as const) : ('female' as const),
    portraitKey: `p${String(id + 1).padStart(2, '0')}`,
    // E shares the lower room with D, so E is the victim and D the murderer.
    isVictim: id === 4,
  }));

  const index = buildSceneIndex(scene);
  return {
    scene,
    index,
    suspects,
    solution,
    occupancy: buildOccupancy(index, solution),
    cell: (row, column) => cellAt(row, column, SIZE),
  };
}
