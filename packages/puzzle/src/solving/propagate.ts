import { isUnaryClue, unaryHolds } from '../clues/evaluate.js';
import { columnOf, rowOf, type SceneIndex } from '../core/grid.js';
import type { Cell, Clue, ClueEntry, Direction, RoomId, SuspectId } from '../core/types.js';
import type { CandidateState, Reason, RoomView } from './candidates.js';

/**
 * Rule level 1 — clue propagation: turning what a clue asserts into
 * candidates that can be struck out.
 *
 * This lives with the solver rather than with clue semantics: what a clue
 * *means* is one question, how to reason with it is another, and only the
 * second needs to know about candidate sets.
 *
 * Every rule here is one-directional in the same sense as the solver overall —
 * a candidate is only removed when it is provably impossible, never merely
 * unlikely. That is what keeps a completed solve a proof rather than a guess.
 */

export interface PropagationResult {
  changed: boolean;
  contradiction: boolean;
}

const UNCHANGED: PropagationResult = { changed: false, contradiction: false };
const CONTRADICTION: PropagationResult = { changed: false, contradiction: true };

function pointsToward(direction: Direction, from: Cell, to: Cell, size: number): boolean {
  switch (direction) {
    case 'west': return columnOf(from, size) < columnOf(to, size);
    case 'east': return columnOf(from, size) > columnOf(to, size);
    case 'north': return rowOf(from, size) < rowOf(to, size);
    case 'south': return rowOf(from, size) > rowOf(to, size);
  }
}

function isDiagonal(a: Cell, b: Cell, size: number): boolean {
  const rowDistance = Math.abs(rowOf(a, size) - rowOf(b, size));
  const columnDistance = Math.abs(columnOf(a, size) - columnOf(b, size));
  return rowDistance !== 0 && rowDistance === columnDistance;
}

/**
 * Exactly `expected` people stand in this room.
 *
 * Two sound conclusions follow. If as many suspects are already forced into
 * the room as it can hold, nobody else may be there. If only as many suspects
 * could possibly be there as it must hold, all of them must be.
 */
function constrainRoomCount(
  index: SceneIndex,
  state: CandidateState,
  rooms: RoomView,
  roomId: RoomId,
  expected: number,
  reason: Reason,
): PropagationResult {
  const forced = rooms.forcedInto(roomId);
  const possible = rooms.possibleIn(roomId);
  if (forced.length > expected || possible.length < expected) return CONTRADICTION;

  const isInRoom = (cell: Cell): boolean => index.roomOfCell[cell] === roomId;
  let changed = false;

  if (forced.length === expected) {
    const settled = new Set(forced);
    for (let suspect = 0; suspect < state.suspectCount; suspect++) {
      if (settled.has(suspect)) continue;
      if (state.keepOnly(suspect, (cell) => !isInRoom(cell), reason)) changed = true;
    }
  }
  if (possible.length === expected) {
    for (const suspect of possible) {
      if (state.keepOnly(suspect, isInRoom, reason)) changed = true;
    }
  }

  return { changed, contradiction: state.hasSuspectWithNoCells() };
}

/** Two people share a room: both are limited to rooms both could be in. */
function constrainSameRoom(
  index: SceneIndex,
  state: CandidateState,
  rooms: RoomView,
  first: SuspectId,
  second: SuspectId,
  reason: Reason,
): boolean {
  const shared = new Set([...rooms.roomsFor(first)].filter((room) => rooms.roomsFor(second).has(room)));
  const inShared = (cell: Cell): boolean => shared.has(index.roomOfCell[cell] ?? -1);
  const firstChanged = state.keepOnly(first, inShared, reason);
  const secondChanged = state.keepOnly(second, inShared, reason);
  return firstChanged || secondChanged;
}

/**
 * A suspect cannot be in a room that someone else is already forced into —
 * used by the clues that cap how many people a room may hold.
 */
function excludeCrowdedRooms(
  index: SceneIndex,
  state: CandidateState,
  rooms: RoomView,
  suspect: SuspectId,
  reason: Reason,
  isTooCrowded: (occupantsForcedIn: readonly SuspectId[]) => boolean,
): boolean {
  let changed = false;
  for (const room of index.scene.rooms) {
    const others = rooms.forcedInto(room.id).filter((other) => other !== suspect);
    if (!isTooCrowded(others)) continue;
    if (state.keepOnly(suspect, (cell) => index.roomOfCell[cell] !== room.id, reason)) changed = true;
  }
  return changed;
}

/** Both directional clues restrict each partner against the other's candidates. */
function constrainPairwise(
  state: CandidateState,
  owner: SuspectId,
  otherId: SuspectId,
  holds: (ownerCell: Cell, otherCell: Cell) => boolean,
  reason: Reason,
): boolean {
  const otherCells = state.cellsFor(otherId);
  const ownerCells = state.cellsFor(owner);
  const ownerChanged = state.keepOnly(
    owner,
    (cell) => otherCells.some((otherCell) => holds(cell, otherCell)),
    reason,
  );
  const otherChanged = state.keepOnly(
    otherId,
    (cell) => ownerCells.some((ownerCell) => holds(ownerCell, cell)),
    reason,
  );
  return ownerChanged || otherChanged;
}

interface ClueContext {
  index: SceneIndex;
  state: CandidateState;
  rooms: RoomView;
  owner: SuspectId;
  reason: Reason;
}

/** Apply one card clue. Scene-wide clues are handled by the caller. */
function applyCardClue(context: ClueContext, clue: Clue): PropagationResult {
  const { index, state, rooms, owner, reason } = context;
  const { size } = index;

  switch (clue.type) {
    case 'SAME_ROOM_AS':
      return {
        changed: constrainSameRoom(index, state, rooms, owner, clue.otherId, reason),
        contradiction: state.hasSuspectWithNoCells(),
      };

    case 'DIRECTION_OF_SUSPECT':
      return {
        changed: constrainPairwise(
          state, owner, clue.otherId,
          (from, to) => pointsToward(clue.direction, from, to, size),
          reason,
        ),
        contradiction: state.hasSuspectWithNoCells(),
      };

    case 'DIAGONAL_OF':
      return {
        changed: constrainPairwise(
          state, owner, clue.otherId,
          (from, to) => isDiagonal(from, to, size),
          reason,
        ),
        contradiction: state.hasSuspectWithNoCells(),
      };

    case 'ALONE': {
      let changed = false;
      if (clue.roomId !== undefined) {
        if (state.keepOnly(owner, (cell) => index.roomOfCell[cell] === clue.roomId, reason)) changed = true;
      }
      // Alone means nobody else — so any room with someone forced into it is out.
      if (excludeCrowdedRooms(index, state, rooms, owner, reason, (others) => others.length >= 1)) {
        changed = true;
      }
      const room = rooms.confinedRoom(owner);
      if (room >= 0) {
        const result = constrainRoomCount(index, state, rooms, room, 1, reason);
        return { changed: changed || result.changed, contradiction: result.contradiction };
      }
      return { changed, contradiction: state.hasSuspectWithNoCells() };
    }

    case 'VICTIM': {
      // The victim's room holds exactly two: the victim and the murderer.
      let changed = excludeCrowdedRooms(index, state, rooms, owner, reason, (others) => others.length >= 2);
      const room = rooms.confinedRoom(owner);
      if (room >= 0) {
        const result = constrainRoomCount(index, state, rooms, room, 2, reason);
        changed = changed || result.changed;
        return { changed, contradiction: result.contradiction };
      }
      return { changed, contradiction: state.hasSuspectWithNoCells() };
    }

    case 'ALONE_WITH': {
      const members = [owner, ...clue.otherIds];
      const memberSet = new Set(members);
      let changed = false;

      for (const otherId of clue.otherIds) {
        if (constrainSameRoom(index, state, rooms, owner, otherId, reason)) changed = true;
      }
      // A room holding someone outside the group is out for the whole group.
      for (const room of index.scene.rooms) {
        if (!rooms.forcedInto(room.id).some((suspect) => !memberSet.has(suspect))) continue;
        for (const member of members) {
          if (state.keepOnly(member, (cell) => index.roomOfCell[cell] !== room.id, reason)) changed = true;
        }
      }
      const room = rooms.confinedRoom(owner);
      if (room >= 0) {
        const result = constrainRoomCount(index, state, rooms, room, members.length, reason);
        changed = changed || result.changed;
        return { changed, contradiction: result.contradiction };
      }
      return { changed, contradiction: state.hasSuspectWithNoCells() };
    }

    default:
      // Unary clues are handled before the switch; scene clues have no owner.
      return UNCHANGED;
  }
}

/**
 * Apply every clue once. The caller repeats until nothing changes.
 */
export function propagateClues(
  index: SceneIndex,
  state: CandidateState,
  rooms: RoomView,
  entries: readonly ClueEntry[],
): PropagationResult {
  let changed = false;

  for (const entry of entries) {
    const { clue, ownerId } = entry;
    const reason: Reason = { kind: 'clue', ownerId, clue };

    if (ownerId !== null && isUnaryClue(clue)) {
      if (state.keepOnly(ownerId, (cell) => unaryHolds(index, clue, cell), reason)) changed = true;
    } else if (clue.type === 'EMPTY_ROOM') {
      for (let suspect = 0; suspect < state.suspectCount; suspect++) {
        if (state.keepOnly(suspect, (cell) => index.roomOfCell[cell] !== clue.roomId, reason)) changed = true;
      }
    } else if (clue.type === 'ROOM_COUNT') {
      const result = constrainRoomCount(index, state, rooms, clue.roomId, clue.count, reason);
      if (result.changed) changed = true;
      if (result.contradiction) return { changed, contradiction: true };
    } else if (ownerId !== null) {
      const result = applyCardClue({ index, state, rooms, owner: ownerId, reason }, clue);
      if (result.changed) changed = true;
      if (result.contradiction) return { changed, contradiction: true };
    }

    if (state.hasSuspectWithNoCells()) return { changed, contradiction: true };
  }

  return { changed, contradiction: false };
}
