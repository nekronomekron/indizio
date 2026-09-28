import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY_BANDS,
  GenerationError,
  MAX_GRID_SIZE,
  NAME_POOL,
  PORTRAIT_KEYS,
  Rng,
  THEMES,
  THEME_KEYS,
  generatePuzzle,
  makeSeed,
  toScene,
  verifyPuzzle,
} from '../../src/engine/index.js';
// The scene index is deliberately not public: consumers get verifyPuzzle
// instead. Tests may look inside.
import { buildSceneIndex, isConnected } from '../../src/engine/core/grid.js';
import { generateRooms, roomCountFor } from '../../src/engine/generation/layout.js';
import { findPerfectMatching } from '../../src/engine/generation/furnish.js';
import { seedsAcrossTiers, smallSeeds } from './support/seeds.js';
import { testTheme } from './support/themes.js';

/**
 * Generation.
 *
 * The tests here are about the shape of what comes out — floor plans that
 * could exist in a building, furniture nobody stands on top of, difficulty
 * that means what it claims. Solvability and uniqueness are covered by the
 * property tests, which can try far more cases than examples ever could.
 */

describe('names', () => {
  it('are all different', () => {
    expect(new Set(NAME_POOL.map((entry) => entry.name)).size).toBe(NAME_POOL.length);
  });

  /**
   * Players tell people apart on the board by a single letter. Two names
   * starting alike would put the same mark on two different squares, which
   * makes a solvable puzzle look unsolvable. The renderer falls back to two
   * letters if it ever happens, but that is a safety net, not the plan.
   */
  it('start with different letters', () => {
    const initials = NAME_POOL.map((entry) => entry.name[0]?.toUpperCase() ?? '');
    const seen = new Set<string>();
    const clashing = initials.filter((letter) => !seen.add(letter));
    expect(clashing).toEqual([]);
  });

  it('are enough for the largest grid, with a portrait each', () => {
    expect(NAME_POOL.length).toBeGreaterThanOrEqual(MAX_GRID_SIZE);
    expect(PORTRAIT_KEYS.length).toBeGreaterThanOrEqual(MAX_GRID_SIZE);
  });
});

describe('themes', () => {
  it('offer enough room names for the largest grid', () => {
    const largest = Math.max(...[5, 6, 7, 8, 9, 10].map(roomCountFor));
    for (const theme of THEMES) {
      expect(theme.rooms.length, theme.key).toBeGreaterThanOrEqual(largest);
    }
  });

  it('offer both a walkable and a blocking object in every room', () => {
    for (const theme of THEMES) {
      for (const { key: room } of theme.rooms) {
        const here = theme.objects.filter((object) => object.rooms.includes(room));
        expect(
          here.some((object) => object.walkable),
          `${theme.key}/${room} needs somewhere to stand`,
        ).toBe(true);
        expect(
          here.some((object) => !object.walkable),
          `${theme.key}/${room} needs something solid`,
        ).toBe(true);
      }
    }
  });

  it('mark only sensible things as walkable', () => {
    // Somewhere a person could plausibly stand or sit — a bed, not a bookshelf.
    const standable = new Set([
      'bed',
      'carpet',
      'chair',
      'sofa',
      'bench',
      'gardenchair',
      'bathtub',
      'car',
      'oilstain',
      'mat',
      'pallet',
      'steppingstone',
      'sandbox',
      'pond',
    ]);
    for (const theme of THEMES) {
      for (const object of theme.objects) {
        expect(standable.has(object.key), `${theme.key}/${object.key} walkable=${object.walkable}`).toBe(
          object.walkable,
        );
      }
    }
  });
});

describe('floor plans', () => {
  const plans = Array.from({ length: 40 }, (_, index) => {
    const size = 6 + (index % 5);
    return {
      size,
      rooms: generateRooms(
        new Rng(`layout-${index}`),
        size,
        roomCountFor(size),
        THEMES[index % 3]!.rooms.map((room) => room.key),
      ),
    };
  });

  it('produce connected rooms', () => {
    for (const { size, rooms } of plans) {
      for (const room of rooms) {
        expect(isConnected(new Set(room.cells), size), `room ${room.nameKey}`).toBe(true);
      }
    }
  });

  it('give every cell exactly one room', () => {
    for (const { size, rooms } of plans) {
      const owner = new Map<number, number>();
      for (const room of rooms) {
        for (const cell of room.cells) {
          expect(owner.has(cell), `cell ${cell} claimed twice`).toBe(false);
          owner.set(cell, room.id);
        }
      }
      expect(owner.size).toBe(size * size);
    }
  });

  it('report bounds that really enclose the cells', () => {
    for (const { size, rooms } of plans) {
      for (const room of rooms) {
        for (const cell of room.cells) {
          const row = Math.floor(cell / size);
          const column = cell % size;
          expect(row).toBeGreaterThanOrEqual(room.bounds.minRow);
          expect(row).toBeLessThanOrEqual(room.bounds.maxRow);
          expect(column).toBeGreaterThanOrEqual(room.bounds.minColumn);
          expect(column).toBeLessThanOrEqual(room.bounds.maxColumn);
        }
      }
    }
  });

  it('mostly produce shapes that are not plain rectangles', () => {
    // Buildings have corridors and alcoves; a grid of boxes would look like a
    // spreadsheet. This is about character, so it is a majority, not a rule.
    let irregular = 0;
    let total = 0;
    for (const { rooms } of plans) {
      for (const room of rooms) {
        total++;
        const boxArea =
          (room.bounds.maxRow - room.bounds.minRow + 1) * (room.bounds.maxColumn - room.bounds.minColumn + 1);
        if (room.cells.length !== boxArea) irregular++;
      }
    }
    expect(irregular / total).toBeGreaterThan(0.3);
  });

  it('give every room a distinct name', () => {
    for (const { rooms } of plans) {
      expect(new Set(rooms.map((room) => room.nameKey)).size).toBe(rooms.length);
    }
  });

  it('refuse to build more rooms than the theme can name', () => {
    expect(() => generateRooms(new Rng('short'), 10, 7, ['only', 'three', 'names'])).toThrow(/room names/);
  });
});

describe('matching', () => {
  it('finds a placement when the grid allows one', () => {
    const blocked = new Uint8Array(36);
    expect(findPerfectMatching(null, 6, blocked)).not.toBeNull();
  });

  it('reports impossibility when a row is fully blocked', () => {
    const blocked = new Uint8Array(36);
    for (let column = 0; column < 6; column++) blocked[column] = 1;
    expect(findPerfectMatching(null, 6, blocked)).toBeNull();
  });
});

describe('generated puzzles', () => {
  it('pass their own verification across every tier', () => {
    for (const { seed, difficulty } of seedsAcrossTiers(1)) {
      const { core } = generatePuzzle(seed);
      const report = verifyPuzzle(core);
      expect(report.problems, `${seed} (${difficulty})`).toEqual([]);
      expect(report.ok).toBe(true);
    }
  });

  /**
   * "Next to a chair" while sitting on one is true by the rules — the touch
   * set includes the subject's own square — but it reads as a denial of the
   * plainer truth. The clue pool no longer offers it.
   *
   * The second half of this test matters as much as the first: a rule that
   * quietly removed the whole clue type would also pass the first half.
   */
  it('never say "next to" about what the subject stands on', () => {
    const offenders: string[] = [];
    let adjacentClues = 0;

    for (const { seed } of seedsAcrossTiers(2)) {
      const { core } = generatePuzzle(seed);
      for (const { ownerId, clue } of core.clues) {
        if (ownerId === null || clue.type !== 'ADJACENT_OBJECT') continue;
        adjacentClues++;
        const cell = core.solution[ownerId]!;
        const standsOn = core.objects.some(
          (object) => object.key === clue.objectKey && object.cells.includes(cell),
        );
        if (standsOn) offenders.push(`${seed}: ${core.suspects[ownerId]!.name} on ${clue.objectKey}`);
      }
    }

    expect(offenders).toEqual([]);
    expect(adjacentClues, 'the clue type must still be in use').toBeGreaterThan(0);
  });

  it('keep furniture inside its own room', () => {
    for (const seed of smallSeeds(4)) {
      const { core } = generatePuzzle(seed);
      const index = buildSceneIndex(toScene(core));
      for (const object of core.objects) {
        for (const cell of object.cells) {
          expect(index.roomOfCell[cell], `${object.key} spills out of its room`).toBe(object.roomId);
        }
      }
    }
  });

  it('never put a person on something they could not stand on', () => {
    for (const seed of smallSeeds(4, 17)) {
      const { core } = generatePuzzle(seed);
      const index = buildSceneIndex(toScene(core));
      for (const cell of core.solution) {
        expect(index.blocked[cell]).toBe(0);
        for (const object of index.objectsOfCell[cell] ?? []) {
          expect(object.walkable, `${object.key} is not something to stand on`).toBe(true);
        }
      }
    }
  });

  it('meet the thresholds of the tier they claim', () => {
    for (const { seed, difficulty, size } of seedsAcrossTiers(1, 99)) {
      const { core } = generatePuzzle(seed);
      const band = DIFFICULTY_BANDS[difficulty];
      expect(band.sizes).toContain(size);
      expect(core.difficultyProof.spread).toBeGreaterThanOrEqual(band.minSpread);
      expect(core.difficultyProof.indirect).toBeGreaterThanOrEqual(band.minIndirect);
    }
  });

  it('accept custom themes without touching the generator', () => {
    const rooms = ['loft', 'nook', 'landing', 'closet', 'eaves', 'stair', 'store'];
    const custom = [
      testTheme(
        'attic',
        rooms,
        THEMES[1]!.objects.map((object) => ({ ...object, rooms })),
      ),
    ];
    const { core } = generatePuzzle(makeSeed('attic', 6, 4711), { themes: custom });
    expect(core.themeKey).toBe('attic');
    expect(verifyPuzzle(core).ok).toBe(true);
  });

  it('refuse a seed from another generator version', () => {
    expect(() => generatePuzzle(makeSeed(THEME_KEYS[0]!, 6, 1, 1))).toThrow(GenerationError);
  });

  it('give up with a clear message rather than running forever', () => {
    expect(() => generatePuzzle(makeSeed('garage', 10, 5), { maxAttempts: 0 })).toThrow(
      /within the attempt budget/,
    );
  });

  /** The app picks the player's message by code, so every failure needs one. */
  it.each([
    ['invalidSeed', () => generatePuzzle('not-a-seed')],
    ['invalidSeed', () => generatePuzzle(makeSeed('garage', 6, 1).replace('garage', 'castle'))],
    ['outdatedSeed', () => generatePuzzle(makeSeed('garage', 6, 1, 1))],
    ['attemptsExhausted', () => generatePuzzle(makeSeed('garage', 6, 1), { maxAttempts: 0 })],
    [
      'invalidTheme',
      () =>
        generatePuzzle(makeSeed('broken', 6, 1), {
          themes: [testTheme('broken', ['a'], [{ ...THEMES[0]!.objects[0]!, rooms: ['nowhere'] }])],
        }),
    ],
  ])('report %s as a code', (code, run) => {
    try {
      run();
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(GenerationError);
      expect((error as GenerationError).code).toBe(code);
    }
  });
});
