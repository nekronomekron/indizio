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

/** Three cells of one room forming an L — connected, but no rectangle. */
function lShapeIn(draft: PuzzleCore): { roomId: number; cells: number[] } {
  for (const room of draft.rooms) {
    const inRoom = new Set(room.cells);
    for (const cell of room.cells) {
      const right = cell + 1;
      const below = cell + draft.size;
      if (cell % draft.size !== draft.size - 1 && inRoom.has(right) && inRoom.has(below)) {
        return { roomId: room.id, cells: [cell, right, below] };
      }
    }
  }
  throw new Error('no room with an L in it');
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

  it('reads a document from before schema 3 as all fixed', () => {
    // The garden lays nothing, so its objects are exactly what an old
    // document held: rectangles without a placement field.
    const { core: garden } = generatePuzzle(makeSeed('garden', 6, 0xd0c5));
    expect(garden.objects.every((object) => object.placement === 'fixed')).toBe(true);
    const old = JSON.parse(stringifyPuzzle(garden)) as { schemaVersion: number; core: PuzzleCore };
    old.schemaVersion = 2;
    for (const object of old.core.objects) delete (object as Partial<typeof object>).placement;
    const readBack = parsePuzzle(JSON.stringify(old));
    expect(readBack.objects.every((object) => object.placement === 'fixed')).toBe(true);
    expect(stringifyPuzzle(readBack)).toBe(stringifyPuzzle(garden));
  });

  it('carries laid shapes through unchanged', () => {
    const text = damaged((draft) => {
      const { roomId, cells } = lShapeIn(draft);
      draft.objects.push({ id: draft.objects.length, key: 'rug', walkable: true, placement: 'tiled', roomId, cells });
    });
    const readBack = parsePuzzle(text);
    expect(readBack.objects.at(-1)!.placement).toBe('tiled');
    expect(readBack.objects.at(-1)!.cells).toHaveLength(3);
  });

  it.each([
    ['an unknown placement', (draft: PuzzleCore) => {
      (draft.objects[0] as { placement: string }).placement = 'woven';
    }, /unknown placement/],
    ['a fixed object that is no rectangle', (draft: PuzzleCore) => {
      const { roomId, cells } = lShapeIn(draft);
      draft.objects.push({ id: draft.objects.length, key: 'rug', walkable: true, placement: 'fixed', roomId, cells });
    }, /not a rectangle/],
    ['an object in two pieces', (draft: PuzzleCore) => {
      const { roomId, cells } = lShapeIn(draft);
      draft.objects.push({ id: draft.objects.length, key: 'rug', walkable: true, placement: 'tiled', roomId, cells: [cells[1]!, cells[2]!] });
    }, /disconnected/],
    ['an object reaching into another room', (draft: PuzzleCore) => {
      const object = draft.objects[0]!;
      const foreign = draft.rooms.find((room) => room.id !== object.roomId)!;
      object.placement = 'tiled';
      object.cells = [...object.cells, foreign.cells[0]!];
    }, /outside room/],
    ['two laid objects of one kind touching', (draft: PuzzleCore) => {
      const { roomId, cells } = lShapeIn(draft);
      draft.objects.push(
        { id: draft.objects.length, key: 'rug', walkable: true, placement: 'tiled', roomId, cells: [cells[0]!] },
        { id: draft.objects.length + 1, key: 'rug', walkable: true, placement: 'tiled', roomId, cells: [cells[1]!] },
      );
    }, /touch each other/],
  ])('rejects %s', (_name, mutate, pattern) => {
    expect(() => parsePuzzle(damaged(mutate))).toThrow(pattern);
  });

  it('lets laid objects of different kinds touch', () => {
    const text = damaged((draft) => {
      const { roomId, cells } = lShapeIn(draft);
      draft.objects.push(
        { id: draft.objects.length, key: 'rug', walkable: true, placement: 'tiled', roomId, cells: [cells[0]!] },
        { id: draft.objects.length + 1, key: 'mat', walkable: true, placement: 'tiled', roomId, cells: [cells[1]!] },
      );
    });
    expect(() => parsePuzzle(text)).not.toThrow();
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
