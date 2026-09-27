import { DIRECTIONS, type SceneIndex } from '../core/grid.js';
import type { Axis, Clue, ClueEntry, ClueType, Suspect, SuspectId } from '../core/types.js';
import { evaluateClue, touchingInstances } from './evaluate.js';
import { occupantsOf, roomOfSuspect, type Occupancy } from './occupancy.js';

/**
 * Every clue that is *true* for a given solution.
 *
 * The generator picks from this pool, which is why no untrue clue can ever
 * reach a player: truth is a property of the pool, not something checked
 * afterwards. Restrictions that would make a clue ambiguous or trivial are
 * applied here too, at the only place where they can be enforced by
 * construction.
 */

const AXES: readonly Axis[] = ['row', 'column'];

function findVictimId(suspects: readonly Suspect[]): SuspectId {
  return suspects.findIndex((suspect) => suspect.isVictim);
}

/** Clues about the subject's own cell: what is under it, around it, where it lies. */
function enumerateCellClues(
  index: SceneIndex,
  occupancy: Occupancy,
  ownerId: SuspectId,
  allowed: ReadonlySet<ClueType>,
): Clue[] {
  const clues: Clue[] = [];
  const cell = occupancy.assignment[ownerId] ?? 0;

  if (allowed.has('ON_OBJECT')) {
    const keys = new Set<string>();
    for (const object of index.objectsOfCell[cell] ?? []) {
      if (object.walkable) keys.add(object.key);
    }
    for (const objectKey of keys) clues.push({ type: 'ON_OBJECT', objectKey });
  }

  if (allowed.has('IN_ROOM')) {
    clues.push({ type: 'IN_ROOM', roomId: roomOfSuspect(occupancy, ownerId) });
  }

  if (allowed.has('ADJACENT_OBJECT')) {
    // What the subject is standing on. "Next to a chair" is true while sitting
    // on one — the touch set includes the subject's own square, exactly as
    // Murdoku's rules say — but it reads as a denial of the plainer truth, and
    // a player who works out that she sat on the chair is right to feel misled.
    // ALIGNED_WITH_OBJECT has always skipped the instance underfoot for the
    // same reason; this brings the two into line.
    const underfoot = new Set((index.objectsOfCell[cell] ?? []).map((object) => object.key));

    for (const objectKey of index.objectsByKey.keys()) {
      if (underfoot.has(objectKey)) continue;
      const touching = touchingInstances(index, cell, objectKey).length;
      if (touching === 0) continue;
      // Both readings are offered: "next to a shelf" and "next to exactly two".
      clues.push({ type: 'ADJACENT_OBJECT', objectKey });
      clues.push({ type: 'ADJACENT_OBJECT', objectKey, count: touching });
    }
  }

  if (allowed.has('CORNER') && index.corner[cell] === 1) {
    clues.push({ type: 'CORNER' });
  }

  if (allowed.has('DIRECTION_OF_OBJECT')) {
    for (const [objectKey, instances] of index.objectsByKey) {
      if (instances.length !== 1) continue;
      for (const direction of DIRECTIONS) {
        const clue: Clue = { type: 'DIRECTION_OF_OBJECT', direction, objectKey };
        if (evaluateClue(index, occupancy, ownerId, clue)) clues.push(clue);
      }
    }
  }

  if (allowed.has('ALIGNED_WITH_OBJECT')) {
    for (const objectKey of index.objectsByKey.keys()) {
      for (const axis of AXES) {
        const clue: Clue = { type: 'ALIGNED_WITH_OBJECT', axis, objectKey };
        if (evaluateClue(index, occupancy, ownerId, clue)) clues.push(clue);
      }
    }
  }

  return clues;
}

/** Clues that relate the subject to another person. */
function enumerateRelationClues(
  index: SceneIndex,
  suspects: readonly Suspect[],
  occupancy: Occupancy,
  ownerId: SuspectId,
  allowed: ReadonlySet<ClueType>,
): Clue[] {
  const clues: Clue[] = [];
  const victimId = findVictimId(suspects);
  const ownRoom = roomOfSuspect(occupancy, ownerId);

  for (let otherId = 0; otherId < suspects.length; otherId++) {
    if (otherId === ownerId) continue;

    // Naming the victim in a room statement would hand over the murderer.
    if (allowed.has('SAME_ROOM_AS') && otherId !== victimId
      && roomOfSuspect(occupancy, otherId) === ownRoom) {
      clues.push({ type: 'SAME_ROOM_AS', otherId });
    }

    if (allowed.has('DIRECTION_OF_SUSPECT')) {
      for (const direction of DIRECTIONS) {
        const clue: Clue = { type: 'DIRECTION_OF_SUSPECT', direction, otherId };
        if (evaluateClue(index, occupancy, ownerId, clue)) clues.push(clue);
      }
    }

    if (allowed.has('DIAGONAL_OF')) {
      const clue: Clue = { type: 'DIAGONAL_OF', otherId };
      if (evaluateClue(index, occupancy, ownerId, clue)) clues.push(clue);
    }
  }

  return clues;
}

/** Clues about how crowded the subject's room is. */
function enumerateOccupancyClues(
  suspects: readonly Suspect[],
  occupancy: Occupancy,
  ownerId: SuspectId,
  allowed: ReadonlySet<ClueType>,
): Clue[] {
  const clues: Clue[] = [];
  const room = roomOfSuspect(occupancy, ownerId);
  const occupants = occupantsOf(occupancy, room);

  if (allowed.has('ALONE') && occupants.length === 1) {
    clues.push({ type: 'ALONE' });
    clues.push({ type: 'ALONE', roomId: room });
  }

  if (allowed.has('ALONE_WITH')) {
    const others = occupants.filter((suspect) => suspect !== ownerId);
    if (others.length > 0 && !others.includes(findVictimId(suspects))) {
      clues.push({ type: 'ALONE_WITH', otherIds: [...others].sort((a, b) => a - b) });
    }
  }

  return clues;
}

/**
 * All true card clues for one suspect, limited to the allowed vocabulary.
 * The victim's card is fixed: it always carries the murder clue.
 */
export function enumerateCardClues(
  index: SceneIndex,
  suspects: readonly Suspect[],
  occupancy: Occupancy,
  ownerId: SuspectId,
  allowed: ReadonlySet<ClueType>,
): Clue[] {
  if (suspects[ownerId]?.isVictim) return [{ type: 'VICTIM' }];
  return [
    ...enumerateCellClues(index, occupancy, ownerId, allowed),
    ...enumerateRelationClues(index, suspects, occupancy, ownerId, allowed),
    ...enumerateOccupancyClues(suspects, occupancy, ownerId, allowed),
  ];
}

/** All true scene-wide clues: at most one per room, so they never overlap. */
export function enumerateSceneClues(
  index: SceneIndex,
  occupancy: Occupancy,
  allowed: ReadonlySet<ClueType>,
): ClueEntry[] {
  const entries: ClueEntry[] = [];
  for (const room of index.scene.rooms) {
    const count = occupantsOf(occupancy, room.id).length;
    if (count === 0 && allowed.has('EMPTY_ROOM')) {
      entries.push({ ownerId: null, clue: { type: 'EMPTY_ROOM', roomId: room.id } });
    } else if (count >= 1 && allowed.has('ROOM_COUNT')) {
      entries.push({ ownerId: null, clue: { type: 'ROOM_COUNT', roomId: room.id, count } });
    }
  }
  return entries;
}
