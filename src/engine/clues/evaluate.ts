import { columnOf, rowOf, touchSet, type SceneIndex } from '../core/grid.js';
import type { Cell, Clue, ClueEntry, ClueType, Direction, SceneObject, SuspectId } from '../core/types.js';
import { occupantsOf, roomOfSuspect, type Occupancy } from './occupancy.js';

/**
 * What each clue actually asserts.
 *
 * This module is the single authority on clue meaning. Everything else —
 * enumeration, propagation, rendering, validation — defers to it, so a clue
 * can never mean one thing to the generator and another to the solver.
 */

/** Instances of this object key that intersect the cell's touch set. */
export function touchingInstances(index: SceneIndex, cell: Cell, objectKey: string): SceneObject[] {
  const instances = index.objectsByKey.get(objectKey);
  if (!instances || instances.length === 0) return [];
  const touched = new Set(touchSet(index, cell));
  return instances.filter((object) => object.cells.some((covered) => touched.has(covered)));
}

/** Row 0 is north, column 0 is west. */
function pointsToward(direction: Direction, from: Cell, to: Cell, size: number): boolean {
  switch (direction) {
    case 'west':
      return columnOf(from, size) < columnOf(to, size);
    case 'east':
      return columnOf(from, size) > columnOf(to, size);
    case 'north':
      return rowOf(from, size) < rowOf(to, size);
    case 'south':
      return rowOf(from, size) > rowOf(to, size);
  }
}

function isDiagonal(a: Cell, b: Cell, size: number): boolean {
  const rowDistance = Math.abs(rowOf(a, size) - rowOf(b, size));
  const columnDistance = Math.abs(columnOf(a, size) - columnOf(b, size));
  return rowDistance !== 0 && rowDistance === columnDistance;
}

/**
 * Is this clue true under the given assignment?
 *
 * A scene-wide clue (`ownerId === null`) is only meaningful for the two room
 * clue types; anything else without a bearer is false rather than an error,
 * because that combination cannot be constructed by the generator.
 */
export function evaluateClue(
  index: SceneIndex,
  occupancy: Occupancy,
  ownerId: SuspectId | null,
  clue: Clue,
): boolean {
  const { size } = index;

  if (clue.type === 'EMPTY_ROOM') return occupantsOf(occupancy, clue.roomId).length === 0;
  if (clue.type === 'ROOM_COUNT') return occupantsOf(occupancy, clue.roomId).length === clue.count;

  if (ownerId === null) return false;
  const cell = occupancy.assignment[ownerId] ?? 0;
  const room = roomOfSuspect(occupancy, ownerId);

  switch (clue.type) {
    case 'ON_OBJECT':
      return (index.objectsOfCell[cell] ?? []).some(
        (object) => object.key === clue.objectKey && object.walkable,
      );

    case 'IN_ROOM':
      return room === clue.roomId;

    case 'ADJACENT_OBJECT': {
      const touching = touchingInstances(index, cell, clue.objectKey).length;
      return clue.count === undefined ? touching >= 1 : touching === clue.count;
    }

    case 'ALONE':
      if (clue.roomId !== undefined && room !== clue.roomId) return false;
      return occupantsOf(occupancy, room).length === 1;

    case 'SAME_ROOM_AS':
      if (clue.otherId === ownerId) return false;
      return roomOfSuspect(occupancy, clue.otherId) === room;

    case 'DIRECTION_OF_SUSPECT':
      if (clue.otherId === ownerId) return false;
      return pointsToward(clue.direction, cell, occupancy.assignment[clue.otherId] ?? 0, size);

    case 'DIRECTION_OF_OBJECT': {
      // Naming one instance only means something when there is one to name.
      const instances = index.objectsByKey.get(clue.objectKey) ?? [];
      const only = instances.length === 1 ? instances[0] : undefined;
      if (!only) return false;
      return only.cells.every((covered) => pointsToward(clue.direction, cell, covered, size));
    }

    case 'CORNER':
      return index.corner[cell] === 1;

    case 'ALIGNED_WITH_OBJECT': {
      const row = rowOf(cell, size);
      const column = columnOf(cell, size);
      for (const object of index.objectsByKey.get(clue.objectKey) ?? []) {
        // An instance the subject stands on would make the clue trivially true.
        if (object.cells.includes(cell)) continue;
        for (const covered of object.cells) {
          const aligned =
            clue.axis === 'row' ? rowOf(covered, size) === row : columnOf(covered, size) === column;
          if (aligned) return true;
        }
      }
      return false;
    }

    case 'DIAGONAL_OF':
      if (clue.otherId === ownerId) return false;
      return isDiagonal(cell, occupancy.assignment[clue.otherId] ?? 0, size);

    case 'ALONE_WITH': {
      const expected = new Set<SuspectId>([ownerId, ...clue.otherIds]);
      const actual = occupantsOf(occupancy, room);
      return actual.length === expected.size && actual.every((suspect) => expected.has(suspect));
    }

    case 'VICTIM':
      // The victim was in the room with exactly one other person: the murderer.
      return occupantsOf(occupancy, room).length === 2;
  }
}

export function evaluateEntry(index: SceneIndex, occupancy: Occupancy, entry: ClueEntry): boolean {
  return evaluateClue(index, occupancy, entry.ownerId, entry.clue);
}

export function allCluesTrue(
  index: SceneIndex,
  occupancy: Occupancy,
  entries: readonly ClueEntry[],
): boolean {
  return entries.every((entry) => evaluateEntry(index, occupancy, entry));
}

/**
 * Clue types whose truth depends only on the subject's own cell.
 *
 * These are the ones propagation can settle with a single mask lookup, which
 * is why they are worth naming as a group.
 */
export const UNARY_CLUE_TYPES: ReadonlySet<ClueType> = new Set<ClueType>([
  'ON_OBJECT',
  'IN_ROOM',
  'ADJACENT_OBJECT',
  'CORNER',
  'ALIGNED_WITH_OBJECT',
  'DIRECTION_OF_OBJECT',
]);

export function isUnaryClue(clue: Clue): boolean {
  return UNARY_CLUE_TYPES.has(clue.type);
}

/**
 * Truth of a unary clue for one cell, without reference to anyone else.
 *
 * Reads the precomputed masks, so this is O(1) — and it is the hot path of
 * clue propagation, called for every cell of every candidate set.
 */
export function unaryHolds(index: SceneIndex, clue: Clue, cell: Cell): boolean {
  switch (clue.type) {
    case 'ON_OBJECT':
      return index.standsOn.get(clue.objectKey)?.[cell] === 1;
    case 'IN_ROOM':
      return index.roomOfCell[cell] === clue.roomId;
    case 'ADJACENT_OBJECT': {
      const touching = index.touchingCount.get(clue.objectKey)?.[cell] ?? 0;
      return clue.count === undefined ? touching >= 1 : touching === clue.count;
    }
    case 'CORNER':
      return index.corner[cell] === 1;
    case 'ALIGNED_WITH_OBJECT':
      return (
        (clue.axis === 'row' ? index.alignedByRow : index.alignedByColumn).get(clue.objectKey)?.[cell] === 1
      );
    case 'DIRECTION_OF_OBJECT':
      return index.directionOf.get(clue.objectKey)?.[clue.direction][cell] === 1;
    default:
      return false;
  }
}
