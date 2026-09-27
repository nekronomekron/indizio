import { boundsOf, cellAt, columnOf, isConnected, orthogonalNeighbours, rowOf } from '../core/grid.js';
import type { Rng } from '../core/rng.js';
import type { Bounds, Cell, Room } from '../core/types.js';

/**
 * Floor plans.
 *
 * A guillotine split gives rectangles; rectangles alone look like a
 * spreadsheet, not a building. So the shapes are then broken up — a corridor
 * is carved out and rectangular bites move between neighbouring rooms, which
 * yields the L-shapes, alcoves and hallways real floor plans have.
 *
 * Every change is kept only if both rooms involved stay connected and neither
 * drops below the minimum area. A room in two disconnected pieces would not be
 * a room, and clues about it would be nonsense.
 */

const MIN_ROOM_EDGE = 2;
const MIN_ROOM_AREA = 4;
/** A corridor may be narrow, but it has to actually go somewhere. */
const MIN_CORRIDOR_LENGTH = 3;
const DEFAULT_CORRIDOR_CHANCE = 0.55;
/** Bite rounds per grid edge — enough to reshape, few enough to stay readable. */
const DEFAULT_BITE_ROUNDS_PER_EDGE = 1.2;
const MAX_BITE_SIZE = 3;

/** Rooms per grid size. More rooms make room clues sharper on bigger grids. */
export function roomCountFor(size: number): number {
  return [3, 3, 4, 5, 6, 7][size - 5] ?? 5;
}

const areaOf = (bounds: Bounds): number =>
  (bounds.maxRow - bounds.minRow + 1) * (bounds.maxColumn - bounds.minColumn + 1);

interface SplitOption {
  axis: 'horizontal' | 'vertical';
  /** Offset from the rectangle's top or left edge. */
  at: number;
}

function splitOptionsFor(bounds: Bounds): SplitOption[] {
  const options: SplitOption[] = [];
  const height = bounds.maxRow - bounds.minRow + 1;
  const width = bounds.maxColumn - bounds.minColumn + 1;

  for (let cut = MIN_ROOM_EDGE; cut <= height - MIN_ROOM_EDGE; cut++) {
    const top = { ...bounds, maxRow: bounds.minRow + cut - 1 };
    const bottom = { ...bounds, minRow: bounds.minRow + cut };
    if (areaOf(top) >= MIN_ROOM_AREA && areaOf(bottom) >= MIN_ROOM_AREA) {
      options.push({ axis: 'horizontal', at: cut });
    }
  }
  for (let cut = MIN_ROOM_EDGE; cut <= width - MIN_ROOM_EDGE; cut++) {
    const left = { ...bounds, maxColumn: bounds.minColumn + cut - 1 };
    const right = { ...bounds, minColumn: bounds.minColumn + cut };
    if (areaOf(left) >= MIN_ROOM_AREA && areaOf(right) >= MIN_ROOM_AREA) {
      options.push({ axis: 'vertical', at: cut });
    }
  }
  return options;
}

function applySplit(bounds: Bounds, option: SplitOption): [Bounds, Bounds] {
  if (option.axis === 'horizontal') {
    return [
      { ...bounds, maxRow: bounds.minRow + option.at - 1 },
      { ...bounds, minRow: bounds.minRow + option.at },
    ];
  }
  return [
    { ...bounds, maxColumn: bounds.minColumn + option.at - 1 },
    { ...bounds, minColumn: bounds.minColumn + option.at },
  ];
}

/**
 * Split the grid into `count` rectangles.
 *
 * Large rectangles are split first, and cuts near the middle are preferred:
 * one huge room plus a few closets makes room clues far less useful than
 * several rooms of comparable size.
 */
function splitIntoRectangles(rng: Rng, size: number, count: number): Bounds[] {
  let rectangles: Bounds[] = [{ minRow: 0, minColumn: 0, maxRow: size - 1, maxColumn: size - 1 }];

  while (rectangles.length < count) {
    const splittable = rectangles
      .map((bounds, position) => ({ bounds, position, options: splitOptionsFor(bounds) }))
      .filter((entry) => entry.options.length > 0);
    if (splittable.length === 0) break;

    const chosen = rng.pickWeighted(splittable, (entry) => areaOf(entry.bounds));
    const span = (option: SplitOption): number =>
      option.axis === 'horizontal'
        ? chosen.bounds.maxRow - chosen.bounds.minRow + 1
        : chosen.bounds.maxColumn - chosen.bounds.minColumn + 1;

    const centred = [...chosen.options]
      .sort((a, b) => Math.abs(a.at - span(a) / 2) - Math.abs(b.at - span(b) / 2));
    const option = centred[rng.nextInt(Math.min(2, centred.length))]!;

    const pieces = applySplit(chosen.bounds, option);
    rectangles = rectangles.filter((_, position) => position !== chosen.position).concat(pieces);
  }

  return rectangles.sort((a, b) => a.minRow - b.minRow || a.minColumn - b.minColumn);
}

/**
 * Rooms while being reshaped: plain cell sets, plus a cell→room lookup kept in
 * step with them.
 *
 * The lookup is maintained incrementally rather than rebuilt. The previous
 * version rebuilt it inside the carving loop, which made a linear job
 * quadratic for no benefit.
 */
class RoomShapes {
  readonly cellsPerRoom: Set<Cell>[];
  private readonly ownerOfCell: Int32Array;

  constructor(rectangles: readonly Bounds[], private readonly size: number) {
    this.ownerOfCell = new Int32Array(size * size).fill(-1);
    this.cellsPerRoom = rectangles.map((bounds, room) => {
      const cells = new Set<Cell>();
      for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
        for (let column = bounds.minColumn; column <= bounds.maxColumn; column++) {
          const cell = cellAt(row, column, size);
          cells.add(cell);
          this.ownerOfCell[cell] = room;
        }
      }
      return cells;
    });
  }

  ownerOf(cell: Cell): number {
    return this.ownerOfCell[cell] ?? -1;
  }

  get count(): number {
    return this.cellsPerRoom.length;
  }

  cellsOf(room: number): Set<Cell> {
    return this.cellsPerRoom[room] ?? new Set<Cell>();
  }

  move(cell: Cell, toRoom: number): void {
    const from = this.ownerOf(cell);
    if (from >= 0) this.cellsPerRoom[from]?.delete(cell);
    if (toRoom >= 0) this.cellsPerRoom[toRoom]?.add(cell);
    this.ownerOfCell[cell] = toRoom;
  }

  addRoom(cells: Set<Cell>): number {
    const room = this.cellsPerRoom.length;
    this.cellsPerRoom.push(cells);
    for (const cell of cells) this.ownerOfCell[cell] = room;
    return room;
  }

  isConnectedRoom(room: number): boolean {
    return isConnected(this.cellsOf(room), this.size);
  }
}

/** Cells along a straight line, optionally turning once. */
function corridorPath(rng: Rng, size: number): Cell[] {
  const horizontal = rng.nextBoolean();
  const line = rng.nextIntBetween(1, size - 2);
  const turnAt = rng.nextBoolean(0.45) ? rng.nextIntBetween(2, size - 3) : -1;
  const secondLine = rng.nextIntBetween(1, size - 2);

  const path: Cell[] = [];
  for (let step = 0; step < size; step++) {
    const onSecondLeg = turnAt >= 0 && step > turnAt;
    const along = onSecondLeg ? secondLine : line;
    path.push(horizontal ? cellAt(along, step, size) : cellAt(step, along, size));
  }
  return path;
}

/**
 * Carve a narrow corridor out of the floor plan.
 *
 * Cells are taken one at a time and only while the donating room stays
 * connected and above the minimum area — so a corridor can never cut a room
 * in half, it can only nibble along an edge.
 */
function carveCorridor(rng: Rng, shapes: RoomShapes, size: number): Set<Cell> | null {
  const corridor = new Set<Cell>();

  for (const cell of corridorPath(rng, size)) {
    const donor = shapes.ownerOf(cell);
    if (donor < 0) break;
    if (shapes.cellsOf(donor).size - 1 < MIN_ROOM_AREA) break;

    shapes.move(cell, -1);
    if (!shapes.isConnectedRoom(donor)) {
      shapes.move(cell, donor);
      break;
    }
    const grown = new Set(corridor).add(cell);
    if (corridor.size > 0 && !isConnected(grown, size)) {
      shapes.move(cell, donor);
      break;
    }
    corridor.add(cell);
  }

  if (corridor.size >= MIN_CORRIDOR_LENGTH) return corridor;

  // Too short to be a corridor: give the cells back to a neighbouring room.
  for (const cell of corridor) {
    const neighbourRoom = orthogonalNeighbours(cell, size)
      .map((neighbour) => shapes.ownerOf(neighbour))
      .find((room) => room >= 0);
    if (neighbourRoom !== undefined) shapes.move(cell, neighbourRoom);
  }
  return null;
}

/**
 * Move rectangular bites from one room into a neighbour.
 *
 * Deliberately not cell by cell: single cells wandering across produce ragged
 * edges that read as noise. A rectangular bite out of a corner or an edge
 * gives exactly the shapes buildings have — L-shapes, T-shapes and alcoves
 * with straight walls.
 */
function biteBoundaries(rng: Rng, shapes: RoomShapes, size: number, rounds: number): void {
  for (let round = 0; round < rounds; round++) {
    const donor = rng.nextInt(shapes.count);
    const donorCells = shapes.cellsOf(donor);
    if (donorCells.size <= MIN_ROOM_AREA) continue;

    // Edge cells of the donor, together with the room they border on.
    const edges: { cell: Cell; target: number }[] = [];
    for (const cell of donorCells) {
      for (const neighbour of orthogonalNeighbours(cell, size)) {
        const target = shapes.ownerOf(neighbour);
        if (target >= 0 && target !== donor) {
          edges.push({ cell, target });
          break;
        }
      }
    }
    if (edges.length === 0) continue;

    const { cell, target } = rng.pick(edges);
    const width = rng.nextIntBetween(1, MAX_BITE_SIZE);
    const height = rng.nextIntBetween(1, MAX_BITE_SIZE);
    // A single cell rarely reshapes anything; mostly skip those.
    if (width === 1 && height === 1 && rng.nextBoolean(0.6)) continue;

    const firstRow = rowOf(cell, size) - rng.nextInt(height);
    const firstColumn = columnOf(cell, size) - rng.nextInt(width);

    const bite: Cell[] = [];
    for (let row = firstRow; row < firstRow + height; row++) {
      for (let column = firstColumn; column < firstColumn + width; column++) {
        if (row < 0 || column < 0 || row >= size || column >= size) continue;
        const candidate = cellAt(row, column, size);
        if (shapes.ownerOf(candidate) === donor) bite.push(candidate);
      }
    }
    if (bite.length === 0 || donorCells.size - bite.length < MIN_ROOM_AREA) continue;

    for (const bitten of bite) shapes.move(bitten, target);
    const bothConnected = shapes.isConnectedRoom(donor) && shapes.isConnectedRoom(target);
    if (!bothConnected) {
      for (const bitten of bite) shapes.move(bitten, donor);
    }
  }
}

export interface LayoutOptions {
  /** Probability that the floor plan gets a corridor. */
  corridorChance?: number;
  /** Bite rounds per grid edge. */
  biteRoundsPerEdge?: number;
}

/**
 * Build `count` connected rooms of arbitrary shape. Every cell belongs to
 * exactly one room and no room is empty.
 */
export function generateRooms(
  rng: Rng,
  size: number,
  count: number,
  nameKeys: readonly string[],
  options: LayoutOptions = {},
): Room[] {
  if (nameKeys.length < count) {
    throw new RangeError(`Theme offers ${nameKeys.length} room names, ${count} are needed`);
  }

  const wantCorridor = count >= 3 && rng.nextBoolean(options.corridorChance ?? DEFAULT_CORRIDOR_CHANCE);
  let shapes = new RoomShapes(splitIntoRectangles(rng, size, wantCorridor ? count - 1 : count), size);

  if (wantCorridor) {
    const corridor = carveCorridor(rng, shapes, size);
    if (corridor) shapes.addRoom(corridor);
    // No corridor possible here — then one more rectangle instead.
    else shapes = new RoomShapes(splitIntoRectangles(rng, size, count), size);
  }

  biteBoundaries(rng, shapes, size, Math.round((options.biteRoundsPerEdge ?? DEFAULT_BITE_ROUNDS_PER_EDGE) * size));

  const populated = shapes.cellsPerRoom.filter((cells) => cells.size > 0);
  const names = rng.shuffled(nameKeys).slice(0, populated.length);

  const rooms = populated.map((cellSet, position) => {
    const cells = [...cellSet].sort((a, b) => a - b);
    return {
      id: position,
      nameKey: names[position]!,
      cells,
      bounds: boundsOf(cells, size),
    };
  });

  // Stable order: top to bottom, then left to right.
  rooms.sort((a, b) => a.bounds.minRow - b.bounds.minRow || a.bounds.minColumn - b.bounds.minColumn);
  return rooms.map((room, position) => ({ ...room, id: position }));
}
