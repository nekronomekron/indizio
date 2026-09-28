import { allCluesTrue } from '../clues/evaluate.js';
import { buildOccupancy } from '../clues/occupancy.js';
import { findClueRestrictionViolations } from '../clues/restrictions.js';
import { THEMES, findTheme, themeProblems, type Theme } from '../content/themes/index.js';
import { meetsBand } from '../core/difficulty.js';
import { buildSceneIndex } from '../core/grid.js';
import { Rng } from '../core/rng.js';
import { GENERATOR_VERSION, parseSeed } from '../core/seed.js';
import type { Cell, Puzzle, PuzzleCore, Room, RoomId, Scene } from '../core/types.js';
import { solve } from '../solving/solve.js';
import { buildProof, searchClues } from './clueSearch.js';
import { furnishScene, randomPermutationCells } from './furnish.js';
import { generateRooms, roomCountFor } from './layout.js';
import { assignRoles } from './roles.js';

/**
 * Turning a seed into a puzzle.
 *
 * Every attempt gets its own random stream, derived from the seed and the
 * attempt number. That is what makes retries free of consequence: the same
 * seed walks the same sequence of attempts and lands on the same puzzle, no
 * matter the machine or the day.
 */

export interface GenerateOptions {
  maxAttempts?: number;
  timeBudgetMs?: number;
  onAttempt?: (attempt: number) => void;
  /**
   * Custom themes. Without this the shipped ones are used — which is how the
   * library runs on somebody else's crime scenes without changes here.
   */
  themes?: readonly Theme[];
}

export class GenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationError';
  }
}

const DEFAULT_MAX_ATTEMPTS = 4000;
/** Object count relative to grid edge. Dense enough that clues stay sharp. */
const OBJECT_DENSITY = 3.0;
/** Reshuffles of the solution before giving up on a floor plan. */
const SOLUTION_ATTEMPTS = 80;

function roomLookup(rooms: readonly Room[], size: number): Int32Array {
  const lookup = new Int32Array(size * size).fill(-1);
  for (const room of rooms) {
    for (const cell of room.cells) lookup[cell] = room.id;
  }
  return lookup;
}

/**
 * A solution in which exactly one room holds two people — the victim and the
 * murderer. Depends only on where the cells fall, so it is settled here,
 * before anyone is named.
 */
function pickSolutionCells(rng: Rng, size: number, rooms: readonly Room[]): Cell[] | null {
  const roomOfCell = roomLookup(rooms, size);
  for (let attempt = 0; attempt < SOLUTION_ATTEMPTS; attempt++) {
    const cells = randomPermutationCells(rng, size);
    const occupants = new Map<RoomId, number>();
    for (const cell of cells) {
      const room = roomOfCell[cell] ?? -1;
      occupants.set(room, (occupants.get(room) ?? 0) + 1);
    }
    if ([...occupants.values()].includes(2)) return cells;
  }
  return null;
}

function resolveTheme(themeKey: string, themes: readonly Theme[]): Theme {
  const theme = findTheme(themeKey, themes);
  if (!theme) throw new GenerationError(`Unknown theme: ${themeKey}`);
  const problems = themeProblems(theme);
  if (problems.length > 0) throw new GenerationError(`Invalid theme ${themeKey}: ${problems.join('; ')}`);
  return theme;
}

/** One attempt. Returns null whenever a step cannot deliver, so the caller retries. */
function attemptGeneration(
  seed: string,
  attempt: number,
  theme: Theme,
  size: number,
  difficulty: PuzzleCore['difficulty'],
): PuzzleCore | null {
  const rng = new Rng(`${seed}#${attempt}`);
  const rooms = generateRooms(rng, size, roomCountFor(size), theme.roomKeys);

  const solutionCells = pickSolutionCells(rng, size, rooms);
  if (!solutionCells) return null;

  const { objects } = furnishScene(rng, size, rooms, theme, solutionCells, OBJECT_DENSITY);
  const scene: Scene = { size, themeKey: theme.key, rooms, objects };
  const index = buildSceneIndex(scene);

  const roles = assignRoles(rng, index, solutionCells);
  if (!roles) return null;

  const search = searchClues(rng, index, roles.suspects, roles.solution, difficulty);
  if (!search.ok) return null;

  // Belt and braces: the pool only holds true clues, but a puzzle that ships
  // one false clue would be unsolvable in a way no player could diagnose.
  const occupancy = buildOccupancy(index, roles.solution);
  if (!allCluesTrue(index, occupancy, search.clues)) return null;
  if (findClueRestrictionViolations(index, roles.suspects, roles.solution, search.clues).length > 0)
    return null;

  const verification = solve(index, roles.suspects, search.clues);
  if (verification.status !== 'solved') return null;

  const proof = buildProof(index, roles.suspects, search.clues, attempt);
  if (!meetsBand(difficulty, size, proof)) return null;

  return {
    seed,
    generatorVersion: GENERATOR_VERSION,
    size,
    difficulty,
    themeKey: theme.key,
    rooms,
    objects,
    suspects: roles.suspects,
    clues: search.clues,
    solution: roles.solution,
    murdererId: roles.murdererId,
    difficultyProof: proof,
  };
}

/** Generate a puzzle from a seed. The same seed always yields the same core. */
export function generatePuzzle(seed: string, options: GenerateOptions = {}): Puzzle {
  const startedAt = Date.now();
  const themes = options.themes ?? THEMES;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  const parts = parseSeed(seed, { themeKeys: themes.map((theme) => theme.key) });
  if (parts.version !== GENERATOR_VERSION) {
    throw new GenerationError(
      `Seed was made by generator version ${parts.version}, this is version ${GENERATOR_VERSION}`,
    );
  }
  const theme = resolveTheme(parts.themeKey, themes);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    options.onAttempt?.(attempt);
    if (options.timeBudgetMs !== undefined && Date.now() - startedAt > options.timeBudgetMs) break;

    const core = attemptGeneration(seed, attempt, theme, parts.size, parts.difficulty);
    if (core) {
      return { core, meta: { durationMs: Date.now() - startedAt, generatedAt: Date.now() } };
    }
  }

  throw new GenerationError(`No puzzle found for seed ${seed} within the attempt budget`);
}
