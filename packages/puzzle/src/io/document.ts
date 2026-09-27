import { isConnected } from '../core/grid.js';
import { CLUE_TYPES } from '../core/types.js';
import type {
  ClueEntry, DifficultyKey, PuzzleCore, Room, SceneObject, Suspect,
} from '../core/types.js';

/**
 * The interchange format.
 *
 * A puzzle is plain structure — no classes, no functions, no runtime
 * references — so it can be stored, sent across a network and read back
 * somewhere else intact. Reading validates thoroughly, because data crossing
 * this boundary has not been produced by code we control.
 */

export const PUZZLE_FORMAT = 'indizio-puzzle';

/** Format version, independent of the generator version. */
export const SCHEMA_VERSION = 2;

export interface PuzzleDocument {
  format: typeof PUZZLE_FORMAT;
  schemaVersion: number;
  core: PuzzleCore;
}

export class PuzzleFormatError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(`Invalid puzzle document: ${problems.join('; ')}`);
    this.name = 'PuzzleFormatError';
    this.problems = problems;
  }
}

const DIFFICULTIES: readonly DifficultyKey[] = ['veryEasy', 'easy', 'medium', 'hard', 'expert'];
const KNOWN_CLUE_TYPES = new Set<string>(CLUE_TYPES);
const MIN_SIZE = 2;
const MAX_SIZE = 32;

export function toDocument(core: PuzzleCore): PuzzleDocument {
  return { format: PUZZLE_FORMAT, schemaVersion: SCHEMA_VERSION, core };
}

/** Object with its keys in sorted order, so output does not depend on construction order. */
function withSortedKeys(value: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) sorted[key] = value[key];
  return sorted;
}

/**
 * Field-stable output: the same puzzle always produces the same characters,
 * whatever order the properties happen to sit in memory. That is what makes
 * "same seed, same bytes" a testable claim rather than a hope.
 */
export function stringifyPuzzle(core: PuzzleCore, options: { pretty?: boolean } = {}): string {
  const document = {
    format: PUZZLE_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    core: {
      seed: core.seed,
      generatorVersion: core.generatorVersion,
      size: core.size,
      difficulty: core.difficulty,
      themeKey: core.themeKey,
      rooms: core.rooms.map((room) => ({
        id: room.id,
        nameKey: room.nameKey,
        cells: room.cells,
        bounds: {
          minRow: room.bounds.minRow,
          minColumn: room.bounds.minColumn,
          maxRow: room.bounds.maxRow,
          maxColumn: room.bounds.maxColumn,
        },
      })),
      objects: core.objects.map((object) => ({
        id: object.id,
        key: object.key,
        walkable: object.walkable,
        roomId: object.roomId,
        cells: object.cells,
      })),
      suspects: core.suspects.map((suspect) => ({
        id: suspect.id,
        name: suspect.name,
        gender: suspect.gender,
        portraitKey: suspect.portraitKey,
        isVictim: suspect.isVictim,
      })),
      clues: core.clues.map((entry) => ({
        ownerId: entry.ownerId,
        clue: withSortedKeys(entry.clue as unknown as Record<string, unknown>),
      })),
      solution: core.solution,
      murdererId: core.murdererId,
      difficultyProof: {
        spread: core.difficultyProof.spread,
        indirect: core.difficultyProof.indirect,
        attempts: core.difficultyProof.attempts,
      },
    },
  };
  return JSON.stringify(document, null, options.pretty === true ? 2 : undefined);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isIntegerArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((entry) => Number.isInteger(entry));

/**
 * Read a document and check it completely.
 *
 * Collects every problem rather than throwing on the first — when reading
 * somebody else's data, a full list is far more useful than the first thing
 * that happened to be wrong.
 */
export function parsePuzzle(input: unknown): PuzzleCore {
  let value: unknown = input;
  if (typeof input === 'string') {
    try {
      value = JSON.parse(input);
    } catch (error) {
      throw new PuzzleFormatError([`not valid JSON: ${(error as Error).message}`]);
    }
  }

  if (!isRecord(value)) throw new PuzzleFormatError(['document is not an object']);

  const envelope: string[] = [];
  if (value['format'] !== PUZZLE_FORMAT) envelope.push(`format must be "${PUZZLE_FORMAT}"`);
  const schemaVersion = value['schemaVersion'];
  if (typeof schemaVersion !== 'number') envelope.push('schemaVersion is missing');
  else if (schemaVersion > SCHEMA_VERSION) {
    envelope.push(`schemaVersion ${schemaVersion} is newer than supported (${SCHEMA_VERSION})`);
  }
  if (!isRecord(value['core'])) envelope.push('core is missing');
  if (envelope.length > 0) throw new PuzzleFormatError(envelope);

  const core = value['core'] as Record<string, unknown>;
  const problems = validateCore(core);
  if (problems.length > 0) throw new PuzzleFormatError(problems);
  return core as unknown as PuzzleCore;
}

function validateRooms(core: Record<string, unknown>, size: number, problems: string[]): Int32Array {
  const cellCount = size * size;
  const roomOfCell = new Int32Array(cellCount).fill(-1);
  const rooms = core['rooms'];

  if (!Array.isArray(rooms) || rooms.length === 0) {
    problems.push('rooms is missing or empty');
    return roomOfCell;
  }

  for (const entry of rooms as Room[]) {
    if (!isRecord(entry)) {
      problems.push('a room is not an object');
      continue;
    }
    if (!Number.isInteger(entry.id)) problems.push('a room has no id');
    if (typeof entry.nameKey !== 'string') problems.push(`room ${entry.id} has no nameKey`);
    if (!isIntegerArray(entry.cells) || entry.cells.length === 0) {
      problems.push(`room ${entry.id} has no cells`);
      continue;
    }
    for (const cell of entry.cells) {
      if (cell < 0 || cell >= cellCount) {
        problems.push(`room ${entry.id}: cell ${cell} is outside the grid`);
        continue;
      }
      if (roomOfCell[cell] !== -1) problems.push(`cell ${cell} belongs to more than one room`);
      roomOfCell[cell] = entry.id;
    }
    // Rooms may be any shape, but a room in two pieces is not a room.
    if (!isConnected(new Set(entry.cells), size)) {
      problems.push(`room ${entry.id} is split into disconnected parts`);
    }
  }

  for (let cell = 0; cell < cellCount; cell++) {
    if (roomOfCell[cell] === -1) {
      problems.push(`cell ${cell} belongs to no room`);
      break;
    }
  }
  return roomOfCell;
}

function validateObjects(
  core: Record<string, unknown>,
  size: number,
  roomIds: ReadonlySet<number>,
  problems: string[],
): Uint8Array {
  const cellCount = size * size;
  const blocked = new Uint8Array(cellCount);
  const objects = core['objects'];

  if (!Array.isArray(objects)) {
    problems.push('objects is missing');
    return blocked;
  }

  for (const entry of objects as SceneObject[]) {
    if (!isRecord(entry)) {
      problems.push('an object is not an object');
      continue;
    }
    if (typeof entry.key !== 'string') problems.push('an object has no key');
    if (typeof entry.walkable !== 'boolean') problems.push(`object ${entry.key} has no walkable flag`);
    if (!roomIds.has(entry.roomId)) problems.push(`object ${entry.key} names an unknown room`);
    if (!isIntegerArray(entry.cells) || entry.cells.length === 0) {
      problems.push(`object ${entry.key} has no cells`);
      continue;
    }
    for (const cell of entry.cells) {
      if (cell < 0 || cell >= cellCount) problems.push(`object ${entry.key}: cell ${cell} is outside the grid`);
      else if (!entry.walkable) blocked[cell] = 1;
    }
  }
  return blocked;
}

function validateSuspects(core: Record<string, unknown>, size: number, problems: string[]): void {
  const suspects = core['suspects'];
  if (!Array.isArray(suspects) || suspects.length !== size) {
    problems.push(`suspects must have ${size} entries`);
    return;
  }

  let victims = 0;
  (suspects as Suspect[]).forEach((suspect, position) => {
    if (suspect.id !== position) problems.push(`suspect at position ${position} has id ${suspect.id}`);
    if (typeof suspect.name !== 'string' || suspect.name.length === 0) {
      problems.push(`suspect ${position} has no name`);
    }
    if (!['male', 'female'].includes(suspect.gender)) {
      problems.push(`suspect ${position} has no valid gender`);
    }
    if (typeof suspect.portraitKey !== 'string') problems.push(`suspect ${position} has no portraitKey`);
    if (suspect.isVictim) victims++;
  });
  if (victims !== 1) problems.push(`there must be exactly one victim, found ${victims}`);
}

function validateSolution(
  core: Record<string, unknown>,
  size: number,
  blocked: Uint8Array,
  problems: string[],
): void {
  const solution = core['solution'];
  if (!isIntegerArray(solution) || solution.length !== size) {
    problems.push(`solution must contain ${size} cells`);
    return;
  }

  const rows = new Set<number>();
  const columns = new Set<number>();
  for (const cell of solution) {
    if (cell < 0 || cell >= size * size) {
      problems.push(`solution cell ${cell} is outside the grid`);
      continue;
    }
    rows.add(Math.floor(cell / size));
    columns.add(cell % size);
    if (blocked[cell] === 1) problems.push(`solution cell ${cell} sits on a blocked square`);
  }
  if (rows.size !== size) problems.push('not every row is occupied exactly once');
  if (columns.size !== size) problems.push('not every column is occupied exactly once');
}

function validateClues(core: Record<string, unknown>, size: number, problems: string[]): void {
  const clues = core['clues'];
  if (!Array.isArray(clues)) {
    problems.push('clues is missing');
    return;
  }

  const cluesPerOwner = new Map<number, number>();
  for (const entry of clues as ClueEntry[]) {
    if (!isRecord(entry) || !isRecord(entry.clue)) {
      problems.push('a clue entry is malformed');
      continue;
    }
    const clue = entry.clue;
    if (!KNOWN_CLUE_TYPES.has(clue.type)) problems.push(`unknown clue type: ${clue.type}`);
    if (entry.ownerId === null) continue;
    if (!Number.isInteger(entry.ownerId) || entry.ownerId < 0 || entry.ownerId >= size) {
      problems.push(`clue with invalid ownerId ${String(entry.ownerId)}`);
      continue;
    }
    cluesPerOwner.set(entry.ownerId, (cluesPerOwner.get(entry.ownerId) ?? 0) + 1);
  }

  for (let suspect = 0; suspect < size; suspect++) {
    const count = cluesPerOwner.get(suspect) ?? 0;
    if (count !== 1) problems.push(`suspect ${suspect} has ${count} clues, expected exactly one`);
  }
}

function validateCore(core: Record<string, unknown>): string[] {
  const problems: string[] = [];

  if (typeof core['seed'] !== 'string' || core['seed'].length === 0) problems.push('seed is missing');
  if (!Number.isInteger(core['generatorVersion'])) problems.push('generatorVersion is missing');

  const size = core['size'];
  if (!Number.isInteger(size) || (size as number) < MIN_SIZE || (size as number) > MAX_SIZE) {
    problems.push(`size must be an integer between ${MIN_SIZE} and ${MAX_SIZE}`);
    return problems;
  }
  const gridSize = size as number;

  const difficulty = core['difficulty'];
  if (typeof difficulty !== 'string' || !DIFFICULTIES.includes(difficulty as DifficultyKey)) {
    problems.push(`difficulty must be one of ${DIFFICULTIES.join(', ')}`);
  }
  if (typeof core['themeKey'] !== 'string') problems.push('themeKey is missing');

  const roomOfCell = validateRooms(core, gridSize, problems);
  const roomIds = new Set<number>();
  for (const room of roomOfCell) if (room >= 0) roomIds.add(room);

  const blocked = validateObjects(core, gridSize, roomIds, problems);
  validateSuspects(core, gridSize, problems);
  validateSolution(core, gridSize, blocked, problems);
  validateClues(core, gridSize, problems);

  const murdererId = core['murdererId'];
  if (!Number.isInteger(murdererId) || (murdererId as number) < 0 || (murdererId as number) >= gridSize) {
    problems.push('murdererId is out of range');
  }
  if (!isRecord(core['difficultyProof'])) problems.push('difficultyProof is missing');

  return problems;
}
