/**
 * `@engine` — the generator and solver for deduction puzzles.
 *
 * On an N×N grid exactly one person stands in every row and every column, and
 * every card carries exactly one true clue. Every generated puzzle has exactly
 * one solution and is solvable by deduction alone — no guessing, ever.
 *
 * **This file is the door.** Whatever it does not export is the engine's own
 * business, and reaching past it is an error rather than a shortcut: a lint rule
 * and `tests/boundary.test.ts` both say so. This used to be a separate package,
 * where the package manifest did that job; the two guards replace it. Needing
 * something from inside means exporting it here, on purpose, under a name chosen
 * for a reader who does not know the internals.
 *
 * The only other door is `@engine/i18n`, which turns clues into sentences. It is
 * separate because i18next lives behind it while nothing else in here depends on
 * anything at all: no DOM, no framework, no Node built-in, so this code runs
 * unchanged in a browser, a web worker and a test.
 *
 * ```ts
 * import { generatePuzzle, makeSeed, stringifyPuzzle, verifyPuzzle } from '@engine';
 *
 * const { core } = generatePuzzle(makeSeed('garage', 6, 12345));
 * console.log(verifyPuzzle(core).ok);   // true
 * const json = stringifyPuzzle(core);   // readable back anywhere
 * ```
 *
 * `src/engine/README.md` states what the engine promises about itself.
 */

// --- Data model -----------------------------------------------------------
export type {
  Assignment,
  Axis,
  Bounds,
  Cell,
  Clue,
  ClueEntry,
  ClueType,
  DifficultyKey,
  DifficultyProof,
  Direction,
  Gender,
  PlacementKind,
  Puzzle,
  PuzzleCore,
  PuzzleMeta,
  Room,
  RoomId,
  RuleLevel,
  Scene,
  SceneObject,
  Suspect,
  SuspectId,
} from './core/types.js';
export { CLUE_TYPES } from './core/types.js';

// --- Generating -----------------------------------------------------------
export {
  GenerationError,
  generatePuzzle,
  type GenerateOptions,
  type GenerationErrorCode,
} from './generation/generate.js';

// --- Seeds ----------------------------------------------------------------
export {
  DAILY_START,
  GENERATOR_VERSION,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  SeedError,
  dailyDifficulty,
  dailySeed,
  daysInMonth,
  formatSeed,
  isValidSeed,
  makeSeed,
  parseSeed,
  weekdayOf,
  type CalendarDate,
  type ParseSeedOptions,
  type SeedParts,
} from './core/seed.js';

// --- Working with a puzzle ------------------------------------------------
export {
  boardLayout,
  checkSolution,
  hintFor,
  solvePuzzle,
  toScene,
  verifyPuzzle,
  type BoardLayout,
  type SolveOutcome,
  type VerificationReport,
  type VerifyOptions,
} from './api.js';
export type { Hint } from './solving/hint.js';
export type { Reason } from './solving/candidates.js';

// --- Interchange format ---------------------------------------------------
export {
  PUZZLE_FORMAT,
  PuzzleFormatError,
  SCHEMA_VERSION,
  parsePuzzle,
  stringifyPuzzle,
  toDocument,
  type PuzzleDocument,
} from './io/document.js';

// --- Difficulty -----------------------------------------------------------
export {
  DIFFICULTY_BANDS,
  DIFFICULTY_ORDER,
  INDIRECT_CLUE_TYPES,
  SIZES_BY_DIFFICULTY,
  difficultyOfSize,
  meetsBand,
  vocabularyFor,
  type DifficultyBand,
} from './core/difficulty.js';

// --- Verification tooling -------------------------------------------------
export { solveByReference, type ReferenceOptions, type ReferenceResult } from './solving/reference.js';
export { findClueRestrictionViolations, type ClueRestrictionViolation } from './clues/restrictions.js';

// --- Content: replaceable, not baked in -----------------------------------
export {
  FLOOR_MATERIALS,
  THEMES,
  THEME_KEYS,
  findTheme,
  themeProblems,
  type FixedPlacement,
  type FloorMaterial,
  type ObjectWords,
  type Placement,
  type RoomWords,
  type Theme,
  type ThemeObject,
  type ThemeRoom,
  type ThemeTexts,
  type TiledPlacement,
} from './content/themes/index.js';
export { LOCALES, type Locale } from './core/locale.js';
export { NAME_POOL, PORTRAIT_KEYS, type NameEntry } from './content/names.js';

// --- Grid arithmetic ------------------------------------------------------
// Anyone drawing a puzzle needs to turn a flat cell index into a position.
export { cellAt, columnOf, rowOf } from './core/grid.js';

// --- Randomness -----------------------------------------------------------
export { Rng } from './core/rng.js';
