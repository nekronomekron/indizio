import { describe, expect, it } from 'vitest';
import {
  PUZZLE_FORMAT, PuzzleFormatError, SCHEMA_VERSION,
  generatePuzzle, makeSeed, parsePuzzle, stringifyPuzzle, toDocument, verifyPuzzle,
} from '../../src/engine/index.js';
import type { PuzzleCore } from '../../src/engine/index.js';

/**
 * The interchange format.
 *
 * Reading is where a library meets data it did not produce, so the tests care
 * as much about the rejections as about the happy path: a wrong document
 * should fail with a description of what is wrong, never load half-broken.
 */

const { core } = generatePuzzle(makeSeed('garage', 6, 0xd0c5));

/** A structurally valid document with one thing deliberately broken. */
function damaged(mutate: (core: PuzzleCore) => void): string {
  const copy = JSON.parse(stringifyPuzzle(core)) as { core: PuzzleCore };
  mutate(copy.core);
  return JSON.stringify(copy);
}

describe('writing', () => {
  it('carries format and schema version', () => {
    const document = JSON.parse(stringifyPuzzle(core)) as Record<string, unknown>;
    expect(document['format']).toBe(PUZZLE_FORMAT);
    expect(document['schemaVersion']).toBe(SCHEMA_VERSION);
    expect(toDocument(core).core).toBe(core);
  });

  it('is field-stable regardless of property order', () => {
    const shuffled: PuzzleCore = {
      difficultyProof: core.difficultyProof,
      murdererId: core.murdererId,
      solution: core.solution,
      clues: core.clues,
      suspects: core.suspects,
      objects: core.objects,
      rooms: core.rooms,
      themeKey: core.themeKey,
      difficulty: core.difficulty,
      size: core.size,
      generatorVersion: core.generatorVersion,
      seed: core.seed,
    };
    expect(stringifyPuzzle(shuffled)).toBe(stringifyPuzzle(core));
  });

  it('can write indented output', () => {
    expect(stringifyPuzzle(core, { pretty: true })).toContain('\n  ');
    expect(JSON.parse(stringifyPuzzle(core, { pretty: true }))).toEqual(JSON.parse(stringifyPuzzle(core)));
  });
});

describe('reading', () => {
  it('round-trips without loss', () => {
    const readBack = parsePuzzle(stringifyPuzzle(core));
    expect(stringifyPuzzle(readBack)).toBe(stringifyPuzzle(core));
    expect(verifyPuzzle(readBack).ok).toBe(true);
  });

  it('accepts an already-parsed object', () => {
    expect(parsePuzzle(JSON.parse(stringifyPuzzle(core)))).toBeTruthy();
  });

  it('rejects malformed JSON with a readable message', () => {
    expect(() => parsePuzzle('{ not json')).toThrow(PuzzleFormatError);
  });

  it('rejects a foreign or future document', () => {
    expect(() => parsePuzzle(JSON.stringify({ format: 'something-else', schemaVersion: 1, core })))
      .toThrow(/format must be/);
    expect(() => parsePuzzle(JSON.stringify({ format: PUZZLE_FORMAT, schemaVersion: 99, core })))
      .toThrow(/newer than supported/);
  });

  it.each([
    ['a room split in two', (draft: PuzzleCore) => {
      const room = draft.rooms[0]!;
      const other = draft.rooms[1]!;
      // Hand one distant cell over, leaving the room disconnected.
      const moved = other.cells.pop()!;
      room.cells.push(moved);
    }, /disconnected/],
    ['a cell in no room', (draft: PuzzleCore) => { draft.rooms[0]!.cells.pop(); }, /belongs to no room/],
    ['two people in one row', (draft: PuzzleCore) => {
      draft.solution[1] = (draft.solution[0]! + 1) % draft.size + Math.floor(draft.solution[0]! / draft.size) * draft.size;
    }, /row|column/],
    ['a suspect without a name', (draft: PuzzleCore) => { draft.suspects[0]!.name = ''; }, /has no name/],
    ['no victim at all', (draft: PuzzleCore) => { for (const s of draft.suspects) s.isVictim = false; }, /exactly one victim/],
    ['two victims', (draft: PuzzleCore) => { for (const s of draft.suspects) s.isVictim = true; }, /exactly one victim/],
    ['an unknown clue type', (draft: PuzzleCore) => {
      (draft.clues[0]!.clue as { type: string }).type = 'NOT_A_CLUE';
    }, /unknown clue type/],
    ['a card without a clue', (draft: PuzzleCore) => { draft.clues.shift(); }, /has 0 clues/],
    ['a murderer out of range', (draft: PuzzleCore) => { draft.murdererId = 99; }, /murdererId/],
  ])('rejects %s', (_name, mutate, pattern) => {
    expect(() => parsePuzzle(damaged(mutate))).toThrow(pattern);
  });

  it('reports every problem at once, not just the first', () => {
    const broken = damaged((draft) => {
      draft.suspects[0]!.name = '';
      draft.murdererId = 99;
    });
    try {
      parsePuzzle(broken);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as PuzzleFormatError).problems.length).toBeGreaterThan(1);
    }
  });
});
