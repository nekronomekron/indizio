import { describe, expect, it } from 'vitest';
import { touchSet } from '../../src/engine/core/grid.js';
import { CLUE_TYPES, type Clue, type ClueType } from '../../src/engine/core/types.js';
import { evaluateClue } from '../../src/engine/clues/evaluate.js';
import { enumerateCardClues, enumerateSceneClues } from '../../src/engine/clues/enumerate.js';
import { findClueRestrictionViolations } from '../../src/engine/clues/restrictions.js';
import { buildFixture } from './support/fixture.js';

/**
 * Clue meaning.
 *
 * Every type gets its own case with an answer that can be checked by eye
 * against the fixture drawing. Semantics is where a subtle mistake does the
 * most damage: a clue that means something slightly different than the player
 * reads makes a puzzle unfair in a way no other test would notice.
 */

const ALL_TYPES: ReadonlySet<ClueType> = new Set(CLUE_TYPES);
const fixture = buildFixture();
const { index, occupancy, solution, suspects, cell } = fixture;

const holds = (ownerId: number | null, clue: Clue): boolean => evaluateClue(index, occupancy, ownerId, clue);

describe('scene index', () => {
  it('blocks only cells covered by non-walkable objects', () => {
    expect(index.blocked[cell(0, 0)]).toBe(1); // shelf
    expect(index.blocked[cell(0, 1)]).toBe(1); // shelf
    expect(index.blocked[cell(1, 2)]).toBe(0); // chair is walkable
    expect(index.blocked[cell(4, 4)]).toBe(1); // tree
    expect(index.walkableCells).toHaveLength(25 - 3);
  });

  it('marks a corner where two perpendicular walls meet', () => {
    for (const corner of [cell(0, 0), cell(0, 4), cell(2, 0), cell(2, 4), cell(3, 0), cell(4, 4)]) {
      expect(index.corner[corner], `cell ${corner}`).toBe(1);
    }
    expect(index.corner[cell(1, 2)]).toBe(0); // middle of the upper room
    expect(index.corner[cell(0, 2)]).toBe(0); // on an edge, but not a corner
  });

  it("keeps the touch set inside the cell's own room", () => {
    // (2,0) is the bottom edge of the upper room; (3,0) belongs to the lower one.
    expect([...touchSet(index, cell(2, 0))].sort((a, b) => a - b)).toEqual(
      [cell(1, 0), cell(2, 0), cell(2, 1)].sort((a, b) => a - b),
    );
  });
});

describe('clue semantics', () => {
  it('ON_OBJECT holds only on walkable instances', () => {
    expect(holds(1, { type: 'ON_OBJECT', objectKey: 'chair' })).toBe(true);
    expect(holds(0, { type: 'ON_OBJECT', objectKey: 'chair' })).toBe(false);
  });

  it('IN_ROOM', () => {
    expect(holds(0, { type: 'IN_ROOM', roomId: 0 })).toBe(true);
    expect(holds(3, { type: 'IN_ROOM', roomId: 0 })).toBe(false);
  });

  it('ADJACENT_OBJECT counts instances, not cells', () => {
    // A stands at (0,3); the shelf covers (0,0) and (0,1) and does not touch.
    expect(holds(0, { type: 'ADJACENT_OBJECT', objectKey: 'shelf' })).toBe(false);
    // B sits on the chair — sitting on one also counts as being next to one.
    expect(holds(1, { type: 'ADJACENT_OBJECT', objectKey: 'chair' })).toBe(true);
    expect(holds(1, { type: 'ADJACENT_OBJECT', objectKey: 'chair', count: 1 })).toBe(true);
    expect(holds(1, { type: 'ADJACENT_OBJECT', objectKey: 'chair', count: 2 })).toBe(false);
  });

  it('ALONE counts the victim as a person', () => {
    // The lower room holds D and the victim E, so nobody there is alone.
    expect(holds(3, { type: 'ALONE' })).toBe(false);
    expect(holds(4, { type: 'ALONE' })).toBe(false);
  });

  it('CORNER', () => {
    expect(holds(2, { type: 'CORNER' })).toBe(true); // C at (2,4)
    expect(holds(0, { type: 'CORNER' })).toBe(false); // A at (0,3)
  });

  it('DIAGONAL_OF needs a real distance on both axes', () => {
    expect(holds(0, { type: 'DIAGONAL_OF', otherId: 1 })).toBe(true); // (0,3) to (1,2)
    expect(holds(0, { type: 'DIAGONAL_OF', otherId: 0 })).toBe(false); // itself
    expect(holds(0, { type: 'DIAGONAL_OF', otherId: 3 })).toBe(true); // (0,3) to (3,0)
    expect(holds(0, { type: 'DIAGONAL_OF', otherId: 2 })).toBe(false); // (0,3) to (2,4)
  });

  it('directions: row 0 is north, column 0 is west', () => {
    expect(holds(3, { type: 'DIRECTION_OF_SUSPECT', direction: 'west', otherId: 4 })).toBe(true);
    expect(holds(3, { type: 'DIRECTION_OF_SUSPECT', direction: 'north', otherId: 4 })).toBe(true);
    expect(holds(4, { type: 'DIRECTION_OF_SUSPECT', direction: 'east', otherId: 3 })).toBe(true);
    expect(holds(4, { type: 'DIRECTION_OF_SUSPECT', direction: 'south', otherId: 3 })).toBe(true);
  });

  it('DIRECTION_OF_OBJECT only with a single instance to name', () => {
    // The tree is unique: A at (0,3) lies north and west of it.
    expect(holds(0, { type: 'DIRECTION_OF_OBJECT', direction: 'north', objectKey: 'tree' })).toBe(true);
    expect(holds(0, { type: 'DIRECTION_OF_OBJECT', direction: 'west', objectKey: 'tree' })).toBe(true);
    expect(holds(0, { type: 'DIRECTION_OF_OBJECT', direction: 'south', objectKey: 'tree' })).toBe(false);
  });

  it('ALIGNED_WITH_OBJECT ignores the instance under the subject', () => {
    expect(holds(2, { type: 'ALIGNED_WITH_OBJECT', axis: 'column', objectKey: 'tree' })).toBe(true);
    // B sits on the chair, so that instance does not count as an alignment.
    expect(holds(1, { type: 'ALIGNED_WITH_OBJECT', axis: 'row', objectKey: 'chair' })).toBe(false);
  });

  it("VICTIM: exactly two people in the victim's room", () => {
    expect(holds(4, { type: 'VICTIM' })).toBe(true);
    expect(holds(0, { type: 'VICTIM' })).toBe(false); // upper room holds three
  });

  it('room clues', () => {
    expect(holds(null, { type: 'ROOM_COUNT', roomId: 0, count: 3 })).toBe(true);
    expect(holds(null, { type: 'ROOM_COUNT', roomId: 1, count: 2 })).toBe(true);
    expect(holds(null, { type: 'EMPTY_ROOM', roomId: 0 })).toBe(false);
  });

  it('ALONE_WITH compares room occupancy as a set', () => {
    expect(holds(3, { type: 'ALONE_WITH', otherIds: [4] })).toBe(true);
    expect(holds(3, { type: 'ALONE_WITH', otherIds: [0] })).toBe(false);
  });

  it('a clue about oneself is never true', () => {
    expect(holds(0, { type: 'SAME_ROOM_AS', otherId: 0 })).toBe(false);
    expect(holds(0, { type: 'DIRECTION_OF_SUSPECT', direction: 'west', otherId: 0 })).toBe(false);
  });
});

describe('clue enumeration', () => {
  it('only ever produces clues that are true', () => {
    for (let suspect = 0; suspect < suspects.length; suspect++) {
      const clues = enumerateCardClues(index, suspects, occupancy, suspect, ALL_TYPES);
      expect(clues.length).toBeGreaterThan(0);
      for (const clue of clues) {
        expect(holds(suspect, clue), `${suspect}: ${JSON.stringify(clue)}`).toBe(true);
      }
    }
    for (const entry of enumerateSceneClues(index, occupancy, ALL_TYPES)) {
      expect(holds(null, entry.clue)).toBe(true);
    }
  });

  it("never names the victim in another card's room statement", () => {
    for (let suspect = 0; suspect < suspects.length; suspect++) {
      for (const clue of enumerateCardClues(index, suspects, occupancy, suspect, ALL_TYPES)) {
        if (clue.type === 'SAME_ROOM_AS') expect(clue.otherId).not.toBe(4);
        if (clue.type === 'ALONE_WITH') expect(clue.otherIds).not.toContain(4);
      }
    }
  });

  it('respects the allowed vocabulary', () => {
    const onlyRooms: ReadonlySet<ClueType> = new Set<ClueType>(['IN_ROOM']);
    for (let suspect = 0; suspect < suspects.length; suspect++) {
      if (suspects[suspect]?.isVictim) continue;
      const clues = enumerateCardClues(index, suspects, occupancy, suspect, onlyRooms);
      expect(clues.every((clue) => clue.type === 'IN_ROOM')).toBe(true);
    }
  });

  it('never offers "next to" for what the subject stands on', () => {
    // Suspect 1 stands on the chair: 'on a chair' stays, 'next to a chair'
    // goes. ALIGNED_WITH_OBJECT has always skipped the instance underfoot;
    // this brings the two into line.
    const clues = enumerateCardClues(index, suspects, occupancy, 1, ALL_TYPES);
    expect(clues).toContainEqual({ type: 'ON_OBJECT', objectKey: 'chair' });
    expect(clues.filter((clue) => clue.type === 'ADJACENT_OBJECT' && clue.objectKey === 'chair')).toEqual([]);
  });

  it('gives the victim exactly the murder clue', () => {
    expect(enumerateCardClues(index, suspects, occupancy, 4, ALL_TYPES)).toEqual([{ type: 'VICTIM' }]);
  });
});

describe('clue restrictions', () => {
  it('accepts a clean set', () => {
    expect(
      findClueRestrictionViolations(index, suspects, solution, [
        { ownerId: 0, clue: { type: 'IN_ROOM', roomId: 0 } },
        { ownerId: 4, clue: { type: 'VICTIM' } },
      ]),
    ).toEqual([]);
  });

  it('spots an ambiguous object reference', () => {
    // Two chairs would make "west of the chair" meaningless — here there is
    // one, so the shelf (also one instance) is fine but a duplicated key is not.
    const violations = findClueRestrictionViolations(index, suspects, solution, [
      { ownerId: 0, clue: { type: 'DIRECTION_OF_OBJECT', direction: 'west', objectKey: 'missing' } },
    ]);
    expect(violations.map((violation) => violation.kind)).toContain('ambiguousReference');
  });

  it('spots a clue naming the victim', () => {
    const violations = findClueRestrictionViolations(index, suspects, solution, [
      { ownerId: 3, clue: { type: 'SAME_ROOM_AS', otherId: 4 } },
    ]);
    expect(violations.map((violation) => violation.kind)).toContain('namesVictim');
  });

  it('spots two cards pointing at each other', () => {
    const violations = findClueRestrictionViolations(index, suspects, solution, [
      { ownerId: 0, clue: { type: 'DIRECTION_OF_SUSPECT', direction: 'west', otherId: 1 } },
      { ownerId: 1, clue: { type: 'DIRECTION_OF_SUSPECT', direction: 'east', otherId: 0 } },
    ]);
    expect(violations.map((violation) => violation.kind)).toContain('mutualReference');
  });

  it('spots "next to" naming what the subject stands on', () => {
    // Suspect 1 stands on the chair. "Next to a chair" is true — the touch set
    // includes the subject's own square — but it reads as a denial of the
    // plainer truth, so it must not ship.
    const violations = findClueRestrictionViolations(index, suspects, solution, [
      { ownerId: 1, clue: { type: 'ADJACENT_OBJECT', objectKey: 'chair' } },
    ]);
    expect(violations.map((violation) => violation.kind)).toContain('standsOnNamedObject');
  });

  it('leaves "next to" alone when the subject stands elsewhere', () => {
    const violations = findClueRestrictionViolations(index, suspects, solution, [
      { ownerId: 0, clue: { type: 'ADJACENT_OBJECT', objectKey: 'shelf' } },
    ]);
    expect(violations.map((violation) => violation.kind)).not.toContain('standsOnNamedObject');
  });

  it('spots a card referring to itself', () => {
    const violations = findClueRestrictionViolations(index, suspects, solution, [
      { ownerId: 2, clue: { type: 'DIAGONAL_OF', otherId: 2 } },
    ]);
    expect(violations.map((violation) => violation.kind)).toContain('selfReference');
  });
});
