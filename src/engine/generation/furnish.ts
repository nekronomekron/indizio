import { cellAt, columnOf, orthogonalNeighbours, rowOf } from '../core/grid.js';
import type { Rng } from '../core/rng.js';
import type { Cell, Room, RoomId, SceneObject } from '../core/types.js';
import type { Theme, ThemeObject } from '../content/themes/types.js';

/**
 * Furnishing a scene around a solution that is already fixed.
 *
 * The order matters and is the opposite of the obvious one. Furnishing first
 * and then looking for a solution leaves people standing in featureless
 * corners with nothing to say about them; measured on 8×8 grids it produced no
 * solvable puzzle at all. Placing the people first and then furnishing *around*
 * them guarantees every person can be described sharply.
 */

/** Share of a room that may be blocked, so it stays passable and placeable. */
const MAX_BLOCKED_SHARE = 0.4;
/** Chance an anchor is an object underfoot rather than one beside the person. */
const STAND_ON_ANCHOR_CHANCE = 0.55;
const MAX_OBJECTS = 30;
const MIN_OBJECTS = 6;

export interface FurnishResult {
  objects: SceneObject[];
  blocked: Uint8Array;
}

/**
 * A perfect matching of rows to columns over walkable cells (Kuhn's
 * algorithm). Returns one cell per row, or null if the grid cannot hold N
 * non-attacking rooks at all.
 */
export function findPerfectMatching(rng: Rng | null, size: number, blocked: Uint8Array): Cell[] | null {
  const lineOrder = (): number[] =>
    rng ? rng.shuffledIndices(size) : Array.from({ length: size }, (_, i) => i);

  const columnForRow = new Int32Array(size).fill(-1);
  const rowForColumn = new Int32Array(size).fill(-1);

  const tryAssign = (row: number, visited: Uint8Array): boolean => {
    for (const column of lineOrder()) {
      if (visited[column] === 1 || blocked[cellAt(row, column, size)] === 1) continue;
      visited[column] = 1;
      const heldBy = rowForColumn[column] ?? -1;
      if (heldBy === -1 || tryAssign(heldBy, visited)) {
        rowForColumn[column] = row;
        columnForRow[row] = column;
        return true;
      }
    }
    return false;
  };

  for (const row of lineOrder()) {
    if (!tryAssign(row, new Uint8Array(size))) return null;
  }
  return Array.from(columnForRow, (column, row) => cellAt(row, column, size));
}

/** A random permutation as solution cells: exactly one column per row. */
export function randomPermutationCells(rng: Rng, size: number): Cell[] {
  return rng.shuffledIndices(size).map((column, row) => cellAt(row, column, size));
}

/**
 * Bookkeeping while furnishing: what is occupied, what is blocked, how much of
 * each room is already taken, and which object keys have been used as anchors.
 */
class Furnishing {
  readonly objects: SceneObject[] = [];
  readonly blocked: Uint8Array;
  private readonly occupied: Uint8Array;
  private readonly solutionCells: ReadonlySet<Cell>;
  private readonly cellsByRoom: Map<RoomId, Set<Cell>>;
  private readonly roomOfCell: Int32Array;
  private readonly blockedPerRoom = new Map<RoomId, number>();
  private readonly usedPerKey = new Map<string, number>();
  /**
   * Object keys already serving as an anchor.
   *
   * Each key anchors at most one person: two cards reading "on a chair" with
   * two chairs on the board is a genuine symmetry, and the puzzle would have
   * more than one solution.
   */
  private readonly anchorKeys = new Set<string>();

  constructor(
    private readonly rng: Rng,
    private readonly size: number,
    private readonly rooms: readonly Room[],
    private readonly theme: Theme,
    solutionCells: readonly Cell[],
  ) {
    const cellCount = size * size;
    this.blocked = new Uint8Array(cellCount);
    this.occupied = new Uint8Array(cellCount);
    this.solutionCells = new Set(solutionCells);
    this.cellsByRoom = new Map(rooms.map((room) => [room.id, new Set(room.cells)]));
    this.roomOfCell = new Int32Array(cellCount).fill(-1);
    for (const room of rooms) {
      this.blockedPerRoom.set(room.id, 0);
      for (const cell of room.cells) this.roomOfCell[cell] = room.id;
    }
  }

  roomOf(cell: Cell): Room | undefined {
    return this.rooms.find((room) => room.id === this.roomOfCell[cell]);
  }

  isAnchorKey(key: string): boolean {
    return this.anchorKeys.has(key);
  }

  private canPlace(cells: readonly Cell[], walkable: boolean, room: Room): boolean {
    for (const cell of cells) {
      if (this.occupied[cell] === 1) return false;
      // A blocking object on a solution cell would invalidate the solution.
      if (!walkable && this.solutionCells.has(cell)) return false;
    }
    if (walkable) return true;
    const blockedAfter = (this.blockedPerRoom.get(room.id) ?? 0) + cells.length;
    return blockedAfter <= Math.floor(room.cells.length * MAX_BLOCKED_SHARE);
  }

  place(object: ThemeObject, cells: Cell[], room: Room, asAnchor: boolean): void {
    for (const cell of cells) {
      this.occupied[cell] = 1;
      if (!object.walkable) this.blocked[cell] = 1;
    }
    if (!object.walkable) {
      this.blockedPerRoom.set(room.id, (this.blockedPerRoom.get(room.id) ?? 0) + cells.length);
    }
    this.usedPerKey.set(object.key, (this.usedPerKey.get(object.key) ?? 0) + 1);
    if (asAnchor) this.anchorKeys.add(object.key);
    this.objects.push({
      id: this.objects.length,
      key: object.key,
      walkable: object.walkable,
      roomId: room.id,
      cells,
    });
  }

  /**
   * Every position where a footprint fits wholly inside the room and, if
   * asked, covers a particular cell. Rooms are not rectangles, so membership
   * is checked cell by cell rather than against the bounding box.
   */
  positionsFor(room: Room, width: number, height: number, mustCover: Cell | null): Cell[][] {
    const inRoom = this.cellsByRoom.get(room.id) ?? new Set<Cell>();
    const { minRow, minColumn, maxRow, maxColumn } = room.bounds;
    const positions: Cell[][] = [];

    for (let firstRow = minRow; firstRow + height - 1 <= maxRow; firstRow++) {
      for (let firstColumn = minColumn; firstColumn + width - 1 <= maxColumn; firstColumn++) {
        const cells: Cell[] = [];
        let fits = true;
        for (let row = firstRow; row < firstRow + height && fits; row++) {
          for (let column = firstColumn; column < firstColumn + width; column++) {
            const cell = cellAt(row, column, this.size);
            if (!inRoom.has(cell)) {
              fits = false;
              break;
            }
            cells.push(cell);
          }
        }
        if (!fits) continue;
        if (mustCover !== null && !cells.includes(mustCover)) continue;
        positions.push(cells);
      }
    }
    return positions;
  }

  /** Object kinds allowed in this room, rarest first — that keeps clues sharp. */
  candidatesFor(room: Room, walkable: boolean | null): ThemeObject[] {
    return this.theme.objects
      .filter((object) =>
        object.rooms.includes(room.nameKey)
        && (walkable === null || object.walkable === walkable)
        && (this.usedPerKey.get(object.key) ?? 0) < object.maxPerScene)
      .sort((a, b) => (this.usedPerKey.get(a.key) ?? 0) - (this.usedPerKey.get(b.key) ?? 0));
  }

  /** Try to put a walkable object under this cell, so the person stands on it. */
  anchorUnderfoot(cell: Cell, room: Room): boolean {
    for (const object of this.candidatesFor(room, true)) {
      if (this.isAnchorKey(object.key)) continue;
      const bySize = this.rng
        .shuffled(object.footprints)
        .sort((a, b) => a[0] * a[1] - b[0] * b[1]);
      for (const [width, height] of bySize) {
        const positions = this.positionsFor(room, width, height, cell)
          .filter((cells) => this.canPlace(cells, true, room));
        if (positions.length === 0) continue;
        this.place(object, this.rng.pick(positions), room, true);
        return true;
      }
    }
    return false;
  }

  /** Otherwise put a blocking object right beside it, in the same room. */
  anchorBeside(cell: Cell, room: Room): boolean {
    const freeNeighbours = this.rng.shuffled(orthogonalNeighbours(cell, this.size))
      .filter((neighbour) =>
        this.roomOfCell[neighbour] === room.id
        && !this.solutionCells.has(neighbour)
        && this.occupied[neighbour] === 0);

    for (const spot of freeNeighbours) {
      for (const object of this.candidatesFor(room, false)) {
        if (this.isAnchorKey(object.key)) continue;
        if (!object.footprints.some(([width, height]) => width === 1 && height === 1)) continue;
        if (!this.canPlace([spot], false, room)) continue;
        this.place(object, [spot], room, true);
        return true;
      }
    }
    return false;
  }

  /** Fill the rest of the scene for atmosphere, never touching anchor keys. */
  addFiller(targetCount: number): void {
    const attempts = targetCount * 14;
    for (let attempt = 0; attempt < attempts && this.objects.length < targetCount; attempt++) {
      const room = this.rng.pick(this.rooms);
      const candidates = this.candidatesFor(room, null).filter((object) => !this.isAnchorKey(object.key));
      if (candidates.length === 0) continue;

      const object = this.rng.pickWeighted(candidates, (candidate) => candidate.weight);
      const [width, height] = this.rng.pick(object.footprints);
      const positions = this.positionsFor(room, width, height, null)
        .filter((cells) => this.canPlace(cells, object.walkable, room));
      if (positions.length === 0) continue;
      this.place(object, this.rng.pick(positions), room, false);
    }
  }
}

/**
 * Furnish a scene around a fixed solution.
 *
 * First every solution cell gets an anchor: a walkable object underneath
 * ("was in a car") or a blocking one beside it ("was next to a shelf"). Only
 * then comes filler. Blocking objects never land on a solution cell, so the
 * solution stays valid by construction rather than by checking afterwards.
 */
export function furnishScene(
  rng: Rng,
  size: number,
  rooms: readonly Room[],
  theme: Theme,
  solutionCells: readonly Cell[],
  density: number,
): FurnishResult {
  const furnishing = new Furnishing(rng, size, rooms, theme, solutionCells);

  for (const cell of rng.shuffled(solutionCells)) {
    const room = furnishing.roomOf(cell);
    if (!room) continue;
    // Whether an anchor was actually placed does not matter here: if no spot
    // fits, this person simply gets none. Which of the two is tried first is a
    // coin flip, and the second is only tried when the first found nothing —
    // the same short circuit as before, spelled out rather than assigned to a
    // variable that existed only to be discarded.
    if (rng.nextBoolean(STAND_ON_ANCHOR_CHANCE)) {
      if (!furnishing.anchorUnderfoot(cell, room)) furnishing.anchorBeside(cell, room);
    } else {
      if (!furnishing.anchorBeside(cell, room)) furnishing.anchorUnderfoot(cell, room);
    }
  }

  furnishing.addFiller(Math.min(MAX_OBJECTS, Math.max(MIN_OBJECTS, Math.round(size * density))));
  return { objects: furnishing.objects, blocked: furnishing.blocked };
}

/** Row and column of a cell, for callers that want them named. */
export function positionOf(cell: Cell, size: number): { row: number; column: number } {
  return { row: rowOf(cell, size), column: columnOf(cell, size) };
}
