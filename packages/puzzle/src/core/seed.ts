import { difficultyOfSize } from './difficulty.js';
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
 * Example: `v2-garage-6-vl-k3f9tq`
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
 * The daily puzzle: date as the random word, so everyone playing on the same
 * day gets the same case without any server involved.
 */
export function dailySeed(date: Date, themeKeys: readonly string[], size: number): string {
  if (themeKeys.length === 0) throw new SeedError('dailySeed needs at least one theme');
  const stamp = date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
  const themeKey = themeKeys[stamp % themeKeys.length]!;
  return makeSeed(themeKey, size, scramble(stamp));
}
