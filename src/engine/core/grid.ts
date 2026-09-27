import type { Bounds, Cell, Direction, Room, RoomId, Scene, SceneObject } from './types.js';

/**
 * Cell arithmetic and the precomputed lookup tables every other module reads.
 *
 * Cells are flat indices rather than `{row, column}` pairs because the solver
 * keeps candidate sets in typed arrays; a flat index is the array offset.
 */

export const cellAt = (row: number, column: number, size: number): Cell => row * size + column;
export const rowOf = (cell: Cell, size: number): number => Math.floor(cell / size);
export const columnOf = (cell: Cell, size: number): number => cell % size;

export const DIRECTIONS: readonly Direction[] = ['north', 'east', 'south', 'west'];

/** Orthogonal neighbours inside the grid. Diagonals never count as adjacent. */
export function orthogonalNeighbours(cell: Cell, size: number): Cell[] {
  const row = rowOf(cell, size);
  const column = columnOf(cell, size);
  const neighbours: Cell[] = [];
  if (row > 0) neighbours.push(cell - size);
  if (row < size - 1) neighbours.push(cell + size);
  if (column > 0) neighbours.push(cell - 1);
  if (column < size - 1) neighbours.push(cell + 1);
  return neighbours;
}

export function cellsInBounds(bounds: Bounds, size: number): Cell[] {
  const cells: Cell[] = [];
  for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
    for (let column = bounds.minColumn; column <= bounds.maxColumn; column++) {
      cells.push(cellAt(row, column, size));
    }
  }
  return cells;
}

export function boundsOf(cells: readonly Cell[], size: number): Bounds {
  let minRow = Infinity;
  let minColumn = Infinity;
  let maxRow = -Infinity;
  let maxColumn = -Infinity;
  for (const cell of cells) {
    const row = rowOf(cell, size);
    const column = columnOf(cell, size);
    if (row < minRow) minRow = row;
    if (row > maxRow) maxRow = row;
    if (column < minColumn) minColumn = column;
    if (column > maxColumn) maxColumn = column;
  }
  return { minRow, minColumn, maxRow, maxColumn };
}

/** Is this cell set connected under four-neighbourhood? */
export function isConnected(cells: ReadonlySet<Cell>, size: number): boolean {
  if (cells.size === 0) return false;
  const start: Cell = cells.values().next().value!;
  const seen = new Set<Cell>([start]);
  const pending: Cell[] = [start];
  while (pending.length > 0) {
    const cell = pending.pop()!;
    for (const neighbour of orthogonalNeighbours(cell, size)) {
      if (cells.has(neighbour) && !seen.has(neighbour)) {
        seen.add(neighbour);
        pending.push(neighbour);
      }
    }
  }
  return seen.size === cells.size;
}

/**
 * Precomputed lookup tables for one scene. Built once, read constantly.
 *
 * The per-object masks are what make clue propagation cheap: answering "does
 * this clue hold for this cell" becomes an array read instead of a scan over
 * every object in the scene.
 */
export interface SceneIndex {
  scene: Scene;
  size: number;
  cellCount: number;
  /** Room id per cell. */
  roomOfCell: Int32Array;
  /** 1 = blocked for suspects (covered by a non-walkable object). */
  blocked: Uint8Array;
  /** 1 = a corner of its room, in the sense of two perpendicular walls meeting. */
  corner: Uint8Array;
  objectsOfCell: SceneObject[][];
  objectsByKey: Map<string, SceneObject[]>;
  roomById: Map<RoomId, Room>;
  walkableCells: Cell[];
  /** Cells covered by a walkable instance of this object key. */
  standsOn: Map<string, Uint8Array>;
  /** Number of distinct instances of this key touching each cell. */
  touchingCount: Map<string, Int32Array>;
  /** Shares a row with an instance of this key that is not under the cell itself. */
  alignedByRow: Map<string, Uint8Array>;
  alignedByColumn: Map<string, Uint8Array>;
  /** Only present for keys with exactly one instance in the scene. */
  directionOf: Map<string, Record<Direction, Uint8Array>>;
}

/**
 * The touch set of a cell: the cell itself plus its orthogonal neighbours
 * within the same room.
 *
 * Including the cell itself is deliberate — sitting on a chair also counts as
 * standing next to one, which is how players read it.
 */
export function touchSetFrom(roomOfCell: Int32Array, cell: Cell, size: number): Cell[] {
  const room = roomOfCell[cell];
  const cells: Cell[] = [cell];
  for (const neighbour of orthogonalNeighbours(cell, size)) {
    if (roomOfCell[neighbour] === room) cells.push(neighbour);
  }
  return cells;
}

export function touchSet(index: SceneIndex, cell: Cell): Cell[] {
  return touchSetFrom(index.roomOfCell, cell, index.size);
}

function markCorners(roomOfCell: Int32Array, size: number, cellCount: number): Uint8Array {
  const corner = new Uint8Array(cellCount);
  for (let cell = 0; cell < cellCount; cell++) {
    const room = roomOfCell[cell] ?? -1;
    if (room < 0) continue;
    const row = rowOf(cell, size);
    const column = columnOf(cell, size);
    const verticalWall =
      row === 0 || roomOfCell[cell - size] !== room ||
      row === size - 1 || roomOfCell[cell + size] !== room;
    const horizontalWall =
      column === 0 || roomOfCell[cell - 1] !== room ||
      column === size - 1 || roomOfCell[cell + 1] !== room;
    if (verticalWall && horizontalWall) corner[cell] = 1;
  }
  return corner;
}

interface ObjectMasks {
  standsOn: Uint8Array;
  touchingCount: Int32Array;
  alignedByRow: Uint8Array;
  alignedByColumn: Uint8Array;
}

function buildObjectMasks(
  instances: readonly SceneObject[],
  roomOfCell: Int32Array,
  size: number,
  cellCount: number,
): ObjectMasks {
  const standsOn = new Uint8Array(cellCount);
  const touchingCount = new Int32Array(cellCount);
  const alignedByRow = new Uint8Array(cellCount);
  const alignedByColumn = new Uint8Array(cellCount);

  for (const object of instances) {
    if (object.walkable) for (const cell of object.cells) standsOn[cell] = 1;
  }

  for (let cell = 0; cell < cellCount; cell++) {
    if ((roomOfCell[cell] ?? -1) < 0) continue;
    const touching = new Set(touchSetFrom(roomOfCell, cell, size));
    const row = rowOf(cell, size);
    const column = columnOf(cell, size);
    for (const object of instances) {
      if (object.cells.some((covered) => touching.has(covered))) {
        touchingCount[cell] = (touchingCount[cell] ?? 0) + 1;
      }
      // An instance the subject is standing on does not count as "aligned
      // with" — otherwise the clue would be trivially true.
      if (object.cells.includes(cell)) continue;
      for (const covered of object.cells) {
        if (rowOf(covered, size) === row) alignedByRow[cell] = 1;
        if (columnOf(covered, size) === column) alignedByColumn[cell] = 1;
      }
    }
  }

  return { standsOn, touchingCount, alignedByRow, alignedByColumn };
}

function buildDirectionMasks(cells: readonly Cell[], size: number, cellCount: number): Record<Direction, Uint8Array> {
  const masks: Record<Direction, Uint8Array> = {
    north: new Uint8Array(cellCount),
    east: new Uint8Array(cellCount),
    south: new Uint8Array(cellCount),
    west: new Uint8Array(cellCount),
  };
  for (let cell = 0; cell < cellCount; cell++) {
    const row = rowOf(cell, size);
    const column = columnOf(cell, size);
    if (cells.every((covered) => row < rowOf(covered, size))) masks.north[cell] = 1;
    if (cells.every((covered) => row > rowOf(covered, size))) masks.south[cell] = 1;
    if (cells.every((covered) => column < columnOf(covered, size))) masks.west[cell] = 1;
    if (cells.every((covered) => column > columnOf(covered, size))) masks.east[cell] = 1;
  }
  return masks;
}

export function buildSceneIndex(scene: Scene): SceneIndex {
  const { size } = scene;
  const cellCount = size * size;
  const roomOfCell = new Int32Array(cellCount).fill(-1);
  const blocked = new Uint8Array(cellCount);
  const objectsOfCell: SceneObject[][] = Array.from({ length: cellCount }, () => []);
  const objectsByKey = new Map<string, SceneObject[]>();
  const roomById = new Map<RoomId, Room>();

  for (const room of scene.rooms) {
    roomById.set(room.id, room);
    for (const cell of room.cells) roomOfCell[cell] = room.id;
  }

  for (const object of scene.objects) {
    const sameKey = objectsByKey.get(object.key);
    if (sameKey) sameKey.push(object);
    else objectsByKey.set(object.key, [object]);
    for (const cell of object.cells) {
      objectsOfCell[cell]?.push(object);
      if (!object.walkable) blocked[cell] = 1;
    }
  }

  const walkableCells: Cell[] = [];
  for (let cell = 0; cell < cellCount; cell++) if (blocked[cell] === 0) walkableCells.push(cell);

  const standsOn = new Map<string, Uint8Array>();
  const touchingCount = new Map<string, Int32Array>();
  const alignedByRow = new Map<string, Uint8Array>();
  const alignedByColumn = new Map<string, Uint8Array>();
  const directionOf = new Map<string, Record<Direction, Uint8Array>>();

  for (const [key, instances] of objectsByKey) {
    const masks = buildObjectMasks(instances, roomOfCell, size, cellCount);
    standsOn.set(key, masks.standsOn);
    touchingCount.set(key, masks.touchingCount);
    alignedByRow.set(key, masks.alignedByRow);
    alignedByColumn.set(key, masks.alignedByColumn);

    // Directional clues name one specific instance, so they are only
    // meaningful when there is exactly one to name.
    const only = instances.length === 1 ? instances[0] : undefined;
    if (only) directionOf.set(key, buildDirectionMasks(only.cells, size, cellCount));
  }

  return {
    scene,
    size,
    cellCount,
    roomOfCell,
    blocked,
    corner: markCorners(roomOfCell, size, cellCount),
    objectsOfCell,
    objectsByKey,
    roomById,
    walkableCells,
    standsOn,
    touchingCount,
    alignedByRow,
    alignedByColumn,
    directionOf,
  };
}
