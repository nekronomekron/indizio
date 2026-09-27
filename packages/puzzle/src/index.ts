/**
 * `@indizio/puzzle` — a generator and solver for deduction puzzles.
 *
 * On an N×N grid exactly one person stands in every row and every column, and
 * every card carries exactly one true clue. Every generated puzzle has exactly
 * one solution and is solvable by deduction alone — no guessing, ever.
 *
 * The core has no runtime dependencies and knows nothing of the DOM or of any
 * UI framework, so it runs unchanged in a browser, a web worker and Node.
 * Sentence rendering lives behind the `@indizio/puzzle/i18n` subpath, which is
 * the only part that needs i18next.
 *
 * ```ts
 * import { generatePuzzle, makeSeed, stringifyPuzzle, verifyPuzzle } from '@indizio/puzzle';
 *
 * const { core } = generatePuzzle(makeSeed('garage', 6, 12345));
 * console.log(verifyPuzzle(core).ok);   // true
 * const json = stringifyPuzzle(core);   // readable back anywhere
 * ```
 */

// --- Data model -----------------------------------------------------------
export type {
  Assignment, Axis, Bounds, Cell, Clue, ClueEntry, ClueType, DifficultyKey,
  DifficultyProof, Direction, Gender, Puzzle, PuzzleCore, PuzzleMeta, Room,
  RoomId, RuleLevel, Scene, SceneObject, Suspect, SuspectId,
} from './core/types.js';
export { CLUE_TYPES } from './core/types.js';

// --- Generating -----------------------------------------------------------
export { GenerationError, generatePuzzle, type GenerateOptions } from './generation/generate.js';

// --- Seeds ----------------------------------------------------------------
export {
  GENERATOR_VERSION, MAX_GRID_SIZE, MIN_GRID_SIZE, SeedError,
  dailySeed, formatSeed, isValidSeed, makeSeed, parseSeed,
  type ParseSeedOptions, type SeedParts,
} from './core/seed.js';

// --- Working with a puzzle ------------------------------------------------
export {
  boardLayout, checkSolution, hintFor, solvePuzzle, toScene, verifyPuzzle,
  type BoardLayout, type SolveOutcome, type VerificationReport, type VerifyOptions,
} from './api.js';
export type { Hint } from './solving/hint.js';
export type { Reason } from './solving/candidates.js';

// --- Interchange format ---------------------------------------------------
export {
  PUZZLE_FORMAT, PuzzleFormatError, SCHEMA_VERSION,
  parsePuzzle, stringifyPuzzle, toDocument, type PuzzleDocument,
} from './io/document.js';

// --- Difficulty -----------------------------------------------------------
export {
  DIFFICULTY_BANDS, DIFFICULTY_ORDER, INDIRECT_CLUE_TYPES, SIZES_BY_DIFFICULTY,
  difficultyOfSize, meetsBand, vocabularyFor, type DifficultyBand,
} from './core/difficulty.js';

// --- Verification tooling -------------------------------------------------
export {
  solveByReference, type ReferenceOptions, type ReferenceResult,
} from './solving/reference.js';
export {
  findClueRestrictionViolations, type ClueRestrictionViolation,
} from './clues/restrictions.js';

// --- Content: replaceable, not baked in -----------------------------------
export { THEMES, THEME_KEYS, findTheme, type Theme, type ThemeObject } from './content/themes/index.js';
export { NAME_POOL, PORTRAIT_KEYS, type NameEntry } from './content/names.js';

// --- Grid arithmetic ------------------------------------------------------
// Anyone drawing a puzzle needs to turn a flat cell index into a position.
export { cellAt, columnOf, rowOf } from './core/grid.js';

// --- Randomness -----------------------------------------------------------
export { Rng } from './core/rng.js';
