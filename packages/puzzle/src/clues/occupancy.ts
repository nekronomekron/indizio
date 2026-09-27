import type { SceneIndex } from '../core/grid.js';
import type { Assignment, RoomId, SuspectId } from '../core/types.js';

/**
 * Who stands in which room, derived once per assignment.
 *
 * Several clue types ask about room occupancy, so computing it once and
 * reading it many times is both faster and easier to reason about than
 * scanning the assignment each time.
 */
export interface Occupancy {
  assignment: Assignment;
  /** Room id per suspect. */
  roomOfSuspect: Int32Array;
  /** Suspect ids per room, ascending. */
  occupantsByRoom: ReadonlyMap<RoomId, SuspectId[]>;
}

export function buildOccupancy(index: SceneIndex, assignment: Assignment): Occupancy {
  const roomOfSuspect = new Int32Array(assignment.length);
  const occupantsByRoom = new Map<RoomId, SuspectId[]>();
  for (const room of index.scene.rooms) occupantsByRoom.set(room.id, []);

  for (let suspect = 0; suspect < assignment.length; suspect++) {
    const cell = assignment[suspect] ?? 0;
    const room = index.roomOfCell[cell] ?? -1;
    roomOfSuspect[suspect] = room;
    occupantsByRoom.get(room)?.push(suspect);
  }
  return { assignment, roomOfSuspect, occupantsByRoom };
}

export function occupantsOf(occupancy: Occupancy, roomId: RoomId): readonly SuspectId[] {
  return occupancy.occupantsByRoom.get(roomId) ?? [];
}

export function roomOfSuspect(occupancy: Occupancy, suspectId: SuspectId): RoomId {
  return occupancy.roomOfSuspect[suspectId] ?? -1;
}
