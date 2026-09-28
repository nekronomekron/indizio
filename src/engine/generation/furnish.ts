import { cellAt, columnOf, orthogonalNeighbours, rowOf } from '../core/grid.js';
import type { Rng } from '../core/rng.js';
import type { Cell, Room, RoomId, SceneObject } from '../core/types.js';
import type { Theme, ThemeObject, TiledPlacement } from '../content/themes/types.js';

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
/** How much a cell continuing the direction of growth outweighs a turn, at full straightness. */
const STRAIGHT_BONUS = 3;

export interface FurnishResult {
  objects: SceneObject[];
  blocked: Uint8Array;
  /** Ids of the objects placed as anchors, for tests that check anchor rules. */
  anchorIds: number[];
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
  readonly anchorIds: number[] = [];
  readonly blocked: Uint8Array;
  private readonly occupied: Uint8Array;
  private readonly solutionCells: ReadonlySet<Cell>;
  private readonly cellsByRoom: Map<RoomId, Set<Cell>>;
  private readonly roomOfCell: Int32Array;
  private readonly blockedPerRoom = new Map<RoomId, number>();
  private readonly usedPerKey = new Map<string, number>();
  /**
   * Cells covered by laid (tiled) instances, per key. Two instances of the
   * same key never touch: side by side they would read as one, and "next to
   * exactly two carpets" would hinge on a seam nobody can see.
   */
  private readonly tiledCellsByKey = new Map<string, Uint8Array>();
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
    if (object.placement.kind === 'tiled') {
      let mask = this.tiledCellsByKey.get(object.key);
      if (!mask) { mask = new Uint8Array(this.size * this.size); this.tiledCellsByKey.set(object.key, mask); }
      for (const cell of cells) mask[cell] = 1;
    }
    for (const cell of cells) {
      this.occupied[cell] = 1;
      if (!object.walkable) this.blocked[cell] = 1;
    }
    if (!object.walkable) {
      this.blockedPerRoom.set(room.id, (this.blockedPerRoom.get(room.id) ?? 0) + cells.length);
    }
    this.usedPerKey.set(object.key, (this.usedPerKey.get(object.key) ?? 0) + 1);
    if (asAnchor) {
      this.anchorKeys.add(object.key);
      this.anchorIds.push(this.objects.length);
    }
    this.objects.push({
      id: this.objects.length,
      key: object.key,
      walkable: object.walkable,
      placement: object.placement.kind,
      roomId: room.id,
      cells,
    });
  }

  /**
   * Whether a laid shape of this object may take this cell: inside the room,
   * free, not touching another instance of the same key, and — for anything
   * blocking, or for an anchor — off every solution cell it must not cover.
   */
  private mayLay(object: ThemeObject, room: Room, cell: Cell, anchorCell: Cell | null): boolean {
    if (this.roomOfCell[cell] !== room.id || this.occupied[cell] === 1) return false;
    if (this.solutionCells.has(cell)) {
      // Blocking would invalidate the solution. An anchor covering somebody
      // else's square would make "on the carpet" true of two people at once.
      if (!object.walkable) return false;
      if (anchorCell !== null && cell !== anchorCell) return false;
    }
    const sameKey = this.tiledCellsByKey.get(object.key);
    if (sameKey) {
      if (sameKey[cell] === 1) return false;
      for (const neighbour of orthogonalNeighbours(cell, this.size)) {
        if (sameKey[neighbour] === 1) return false;
      }
    }
    return true;
  }

  /**
   * Grow a laid shape from one cell.
   *
   * Each step adds one cell from the rim. A rim cell touching the shape once
   * weighs 1; one touching it k ≥ 2 times weighs `compactness · k`, so at 0
   * the shape stays a tree of lanes and at 1 it fills out. Continuing the
   * direction a neighbour grew in is favoured by `straightness`. Returns null
   * if the room does not leave room for `minCells`.
   */
  growShape(object: ThemeObject, placement: TiledPlacement, room: Room, start: Cell, anchorCell: Cell | null): Cell[] | null {
    if (!this.mayLay(object, room, start, anchorCell)) return null;

    let target = this.rng.nextIntBetween(placement.minCells, placement.maxCells);
    if (!object.walkable) {
      const budget = Math.floor(room.cells.length * MAX_BLOCKED_SHARE) - (this.blockedPerRoom.get(room.id) ?? 0);
      target = Math.min(target, budget);
    }
    if (target < placement.minCells) return null;

    const shape: Cell[] = [start];
    const inShape = new Set<Cell>(shape);
    // Direction each cell was entered from, as a cell offset; 0 for the start.
    const grownBy = new Map<Cell, number>([[start, 0]]);

    while (shape.length < target) {
      const rim = new Set<Cell>();
      for (const cell of shape) {
        for (const neighbour of orthogonalNeighbours(cell, this.size)) {
          if (!inShape.has(neighbour)) rim.add(neighbour);
        }
      }
      // Sorted before the draw: the result must not depend on the order a
      // Set happened to be filled in, or the same seed would drift.
      const candidates: { cell: Cell; weight: number; step: number }[] = [];
      for (const cell of [...rim].sort((a, b) => a - b)) {
        if (!this.mayLay(object, room, cell, anchorCell)) continue;
        const parents = orthogonalNeighbours(cell, this.size).filter((neighbour) => inShape.has(neighbour));
        const touching = parents.length;
        let weight = touching === 1 ? 1 : placement.compactness * touching;
        if (weight <= 0) continue;
        const straightFrom = parents.find((parent) => grownBy.get(parent) === cell - parent);
        if (straightFrom !== undefined) weight *= 1 + STRAIGHT_BONUS * placement.straightness;
        const parent = straightFrom ?? parents[0]!;
        candidates.push({ cell, weight, step: cell - parent });
      }
      if (candidates.length === 0) break;

      const chosen = this.rng.pickWeighted(candidates, (candidate) => candidate.weight);
      shape.push(chosen.cell);
      inShape.add(chosen.cell);
      grownBy.set(chosen.cell, chosen.step);
    }

    if (shape.length < placement.minCells) return null;
    return shape.sort((a, b) => a - b);
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
      if (object.placement.kind === 'tiled') {
        const shape = this.growShape(object, object.placement, room, cell, cell);
        if (!shape) continue;
        this.place(object, shape, room, true);
        return true;
      }
      const bySize = this.rng
        .shuffled(object.placement.footprints)
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
        // Only single squares: a laid shape beside a person already counts as
        // "next to" through the touch set, it needs no special anchoring.
        if (object.placement.kind !== 'fixed') continue;
        if (!object.placement.footprints.some(([width, height]) => width === 1 && height === 1)) continue;
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
      if (object.placement.kind === 'tiled') {
        const starts = room.cells.filter((cell) => this.mayLay(object, room, cell, null));
        if (starts.length === 0) continue;
        const shape = this.growShape(object, object.placement, room, this.rng.pick(starts), null);
        if (shape) this.place(object, shape, room, false);
        continue;
      }
      const [width, height] = this.rng.pick(object.placement.footprints);
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
  return { objects: furnishing.objects, blocked: furnishing.blocked, anchorIds: furnishing.anchorIds };
}

/** Row and column of a cell, for callers that want them named. */
export function positionOf(cell: Cell, size: number): { row: number; column: number } {
  return { row: rowOf(cell, size), column: columnOf(cell, size) };
}
