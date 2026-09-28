import type { SceneIndex } from '../core/grid.js';
import type { Assignment, Clue, ClueEntry, Suspect, SuspectId } from '../core/types.js';

/**
 * Restrictions that keep clues unambiguous and non-trivial.
 *
 * These are not solver rules — a puzzle violating them may still be solvable.
 * They exist because such a puzzle would be *unfair or pointless* to a player,
 * and the only place to catch that is before it ships.
 */

export interface ClueRestrictionViolation {
  kind: 'ambiguousReference' | 'namesVictim' | 'selfReference' | 'mutualReference' | 'standsOnNamedObject';
  message: string;
}

/** Suspects a clue refers to by name. */
function referencedSuspects(clue: Clue): SuspectId[] {
  if (clue.type === 'ALONE_WITH') return [...clue.otherIds];
  if ('otherId' in clue) return [clue.otherId];
  return [];
}

export function findClueRestrictionViolations(
  index: SceneIndex,
  suspects: readonly Suspect[],
  assignment: Assignment,
  clues: readonly ClueEntry[],
): ClueRestrictionViolation[] {
  const violations: ClueRestrictionViolation[] = [];
  const victimId = suspects.findIndex((suspect) => suspect.isVictim);
  const referencesByOwner = new Map<SuspectId, Set<SuspectId>>();

  for (const { clue, ownerId } of clues) {
    // "West of the shelf" only means something when there is one shelf.
    if (clue.type === 'DIRECTION_OF_OBJECT') {
      const instances = index.objectsByKey.get(clue.objectKey)?.length ?? 0;
      if (instances !== 1) {
        violations.push({
          kind: 'ambiguousReference',
          message: `DIRECTION_OF_OBJECT names ${clue.objectKey}, of which there are ${instances}`,
        });
      }
    }

    // Naming the victim in a room statement would hand over the murderer.
    const namesVictim =
      (clue.type === 'SAME_ROOM_AS' && clue.otherId === victimId) ||
      (clue.type === 'ALONE_WITH' && clue.otherIds.includes(victimId));
    if (namesVictim) {
      violations.push({ kind: 'namesVictim', message: `${clue.type} names the victim` });
    }

    if (ownerId === null) continue;

    // "Next to a chair" while sitting on it is true, but it reads as a denial
    // of the plainer truth. The clue pool no longer offers it; this catches a
    // set assembled elsewhere.
    if (clue.type === 'ADJACENT_OBJECT') {
      const cell = assignment[ownerId];
      const standsOn =
        cell === undefined
          ? false
          : (index.objectsOfCell[cell] ?? []).some((object) => object.key === clue.objectKey);
      if (standsOn) {
        violations.push({
          kind: 'standsOnNamedObject',
          message: `ADJACENT_OBJECT names ${clue.objectKey}, which the subject is standing on`,
        });
      }
    }

    const targets = referencedSuspects(clue);
    if (targets.includes(ownerId)) {
      violations.push({ kind: 'selfReference', message: `${clue.type} refers to its own card` });
    }

    const known = referencesByOwner.get(ownerId) ?? new Set<SuspectId>();
    for (const target of targets) known.add(target);
    referencesByOwner.set(ownerId, known);
  }

  // Two cards pointing at each other carry less between them than their count
  // suggests — the pair is circular rather than informative.
  for (const [owner, targets] of referencesByOwner) {
    for (const target of targets) {
      if (referencesByOwner.get(target)?.has(owner)) {
        violations.push({
          kind: 'mutualReference',
          message: `cards ${owner} and ${target} refer to each other`,
        });
      }
    }
  }

  return dedupeByMessage(violations);
}

function dedupeByMessage(violations: ClueRestrictionViolation[]): ClueRestrictionViolation[] {
  const seen = new Set<string>();
  return violations.filter((violation) => {
    if (seen.has(violation.message)) return false;
    seen.add(violation.message);
    return true;
  });
}
