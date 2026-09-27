import { SIZES_BY_DIFFICULTY, difficultyOfSize } from './difficulty.js';
import type { DifficultyKey } from './types.js';

/**
 * Seeds.
 *
 * A seed is the whole identity of a puzzle: generator version, theme, grid
 * size, difficulty and one random word, packed into a string short enough to
 * live in a URL. Nothing about a puzzle is stored anywhere — the seed *is* the
 * puzzle, and regenerating from it reproduces it exactly.
 *
 * Format: `v<version>-<theme>-<size>-<difficulty>-<random base36>`
 * Example: `v3-garage-6-vl-k3f9tq` — the leading number is GENERATOR_VERSION below.
 */

/**
 * Bumped whenever generation changes in a way that alters output. Old seeds
 * are then rejected with a clear message rather than silently producing a
 * different puzzle than the link promised.
 */
export const GENERATOR_VERSION = 3;

export const MIN_GRID_SIZE = 5;
export const MAX_GRID_SIZE = 10;

/** Short codes keep seeds compact; the type keeps call sites readable. */
const DIFFICULTY_CODES: Record<DifficultyKey, string> = {
  veryEasy: 'vl',
  easy: 'l',
  medium: 'm',
  hard: 's',
  expert: 'x',
};

const DIFFICULTY_BY_CODE: ReadonlyMap<string, DifficultyKey> = new Map(
  Object.entries(DIFFICULTY_CODES).map(([key, code]) => [code, key as DifficultyKey]),
);

export interface SeedParts {
  version: number;
  themeKey: string;
  size: number;
  difficulty: DifficultyKey;
  /** 32-bit random word, base36 encoded in the seed string. */
  random: number;
}

export interface ParseSeedOptions {
  /** Theme keys to accept. Omit to accept any syntactically valid key. */
  themeKeys?: readonly string[];
}

export class SeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeedError';
  }
}

export function formatSeed(parts: SeedParts): string {
  return [
    `v${parts.version}`,
    parts.themeKey,
    String(parts.size),
    DIFFICULTY_CODES[parts.difficulty],
    (parts.random >>> 0).toString(36),
  ].join('-');
}

export function parseSeed(seed: string, options: ParseSeedOptions = {}): SeedParts {
  const segments = seed.trim().toLowerCase().split('-');
  if (segments.length !== 5) throw new SeedError(`Malformed seed: ${seed}`);
  const [versionText, themeKey, sizeText, difficultyCode, randomText] = segments as [
    string, string, string, string, string,
  ];

  if (!/^v\d+$/.test(versionText)) throw new SeedError(`Malformed version in seed: ${seed}`);
  const version = Number(versionText.slice(1));

  if (!/^[a-z][a-z0-9]*$/.test(themeKey)) throw new SeedError(`Malformed theme key in seed: ${themeKey}`);
  if (options.themeKeys && !options.themeKeys.includes(themeKey)) {
    throw new SeedError(`Unknown theme in seed: ${themeKey}`);
  }

  const size = Number(sizeText);
  if (!Number.isInteger(size) || size < MIN_GRID_SIZE || size > MAX_GRID_SIZE) {
    throw new SeedError(`Grid size out of range in seed: ${sizeText}`);
  }

  const difficulty = DIFFICULTY_BY_CODE.get(difficultyCode);
  if (!difficulty) throw new SeedError(`Unknown difficulty in seed: ${difficultyCode}`);

  const random = Number.parseInt(randomText, 36);
  if (!Number.isFinite(random) || random < 0) throw new SeedError(`Malformed random word in seed: ${randomText}`);

  return { version, themeKey, size, difficulty, random: random >>> 0 };
}

export function isValidSeed(seed: string, options: ParseSeedOptions = {}): boolean {
  try {
    parseSeed(seed, options);
    return true;
  } catch {
    return false;
  }
}

/** Fold a 32-bit word so nearby inputs land far apart. */
function scramble(value: number): number {
  let hash = value >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b) >>> 0;
  return (hash ^ (hash >>> 16)) >>> 0;
}

/**
 * Build a seed for a given theme and size. The difficulty follows from the
 * size, so a caller cannot ask for a combination that does not exist.
 */
export function makeSeed(
  themeKey: string,
  size: number,
  random: number,
  version: number = GENERATOR_VERSION,
): string {
  return formatSeed({ version, themeKey, size, difficulty: difficultyOfSize(size), random: random >>> 0 });
}

/**
 * A calendar day, as three plain numbers.
 *
 * Deliberately not a `Date`. A `Date` carries a time zone, and which day it
 * names depends on where the reader stands — the very question this engine must
 * not have an opinion about. The app decides which day it means; this file only
 * turns that day into a puzzle.
 */
export interface CalendarDate {
  year: number;
  /** 1 = January. */
  month: number;
  /** 1 = the first of the month. */
  day: number;
}

/** The first day that carries a puzzle. Nothing exists before it. */
export const DAILY_START: CalendarDate = { year: 2026, month: 1, day: 1 };

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** How many days that month has, February included. */
export function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month - 1] ?? 0;
}

function assertDate(date: CalendarDate): void {
  const { year, month, day } = date;
  const valid = Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)
    && month >= 1 && month <= 12
    && day >= 1 && day <= daysInMonth(year, month);
  if (!valid) throw new SeedError(`Not a calendar date: ${year}-${month}-${day}`);
}

/**
 * Day of the week, 0 = Sunday, by Sakamoto's method.
 *
 * Arithmetic rather than `new Date(...).getDay()` on purpose: the engine reads
 * no clock and builds no date, which is what keeps it reproducible — and a test
 * enforces it. The table holds a month offset each; `year - 1` before March
 * shifts the leap day to the end of the year, where it does no harm.
 */
const SAKAMOTO = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4] as const;

export function weekdayOf(date: CalendarDate): number {
  assertDate(date);
  const year = date.month < 3 ? date.year - 1 : date.year;
  const shift = Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400);
  return (year + shift + (SAKAMOTO[date.month - 1] ?? 0) + date.day) % 7;
}

/**
 * Which tier a weekday carries, index 0 = Sunday.
 *
 * Five tiers over seven days does not divide, so the split is a choice rather
 * than a formula: short cases on working evenings, the long one on Sunday. Every
 * day of the week is a different puzzle anyway — this only decides how much time
 * it asks for.
 */
const DAILY_RHYTHM: readonly DifficultyKey[] = [
  'expert',    // Sunday
  'veryEasy',  // Monday
  'easy',
  'easy',
  'medium',
  'medium',
  'hard',      // Saturday
];

/** What a given day asks of the player. */
export function dailyDifficulty(date: CalendarDate): DifficultyKey {
  return DAILY_RHYTHM[weekdayOf(date)] ?? 'veryEasy';
}

/**
 * The daily puzzle: the date is the random word, so everyone playing the same
 * day gets the same case without any server involved.
 *
 * The grid size follows from the day's tier, so a Sunday is a 10×10 and a Monday
 * is small. Both the theme and — where a tier allows two sizes — the size rotate
 * with the date, so a week is never the same case twice.
 */
export function dailySeed(date: CalendarDate, themeKeys: readonly string[]): string {
  if (themeKeys.length === 0) throw new SeedError('dailySeed needs at least one theme');
  const difficulty = dailyDifficulty(date);
  const stamp = date.year * 10000 + date.month * 100 + date.day;
  const sizes = SIZES_BY_DIFFICULTY[difficulty];
  const size = sizes[stamp % sizes.length] ?? sizes[0]!;
  const themeKey = themeKeys[stamp % themeKeys.length]!;
  return makeSeed(themeKey, size, scramble(stamp));
}
