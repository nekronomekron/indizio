import * as v from 'valibot';
import { PUZZLE_FORMAT, SCHEMA_VERSION, parsePuzzle, type PuzzleCore } from '@engine';

/**
 * Everything the game keeps in `localStorage`.
 *
 * Storage is data from outside (PLAN.md §14, U7): another tab, an older build
 * or a curious player may have written anything there. Every read therefore
 * goes through a schema; what does not match is dropped — and deleted, so it
 * does not fail again on every start — and the caller falls back to its
 * default. Nothing is ever half-applied.
 *
 * Keys carry the generator version: the same seed means a different puzzle
 * under another generator, so saves, cached puzzles and progress from an older
 * version describe puzzles that no longer exist. {@link sweepOldStorage}
 * clears them. Version 4 (laid carpets, §13.6) deliberately starts afresh.
 */
const VERSION = 'v4';
const PREFIX = 'indizio:' + VERSION + ':';
const PUZZLE_PREFIX = PREFIX + 'puzzle:';
const PROGRESS_KEY = PREFIX + 'progress';
const TUTORIAL_KEY = PREFIX + 'tutorialSeen';

/** Key of the game in progress for a seed. The game feature owns what is stored there. */
export const saveKey = (seed: string): string => PREFIX + 'save:' + seed;
/** Key of the player's settings. The settings feature owns what is stored there. */
export const SETTINGS_KEY = PREFIX + 'settings';

/** `localStorage` may be missing or throw: private windows, blocked site data, tests. */
function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function removeStored(key: string): void {
  try {
    storage()?.removeItem(key);
  } catch {
    // Nothing to clean up where nothing can be stored.
  }
}

/** Raw JSON under a key, or `undefined` when there is none or it is not JSON. */
function readRaw(key: string): unknown {
  try {
    const raw = storage()?.getItem(key);
    return raw === null || raw === undefined ? undefined : (JSON.parse(raw) as unknown);
  } catch {
    removeStored(key);
    return undefined;
  }
}

/**
 * The value under a key if it matches the schema, otherwise `null` — and an
 * entry that does not match is deleted.
 */
export function readStored<TSchema extends v.GenericSchema>(
  key: string,
  schema: TSchema,
): v.InferOutput<TSchema> | null {
  const raw = readRaw(key);
  if (raw === undefined) return null;
  const result = v.safeParse(schema, raw);
  if (result.success) return result.output;
  console.warn(`Dropping invalid stored data under ${key}`, result.issues[0].message);
  removeStored(key);
  return null;
}

export function writeStored(key: string, value: unknown): void {
  try {
    storage()?.setItem(key, JSON.stringify(value));
  } catch {
    // Full or unavailable: the game still works, it just forgets.
  }
}

/**
 * Is there a game in progress for this puzzle?
 *
 * The calendar shows "started" with it. Only whether it exists, not what it
 * holds: a calendar cell should not read and parse a whole save to draw a dot.
 */
export function hasSave(seed: string): boolean {
  try {
    return storage()?.getItem(saveKey(seed)) != null;
  } catch {
    return false;
  }
}

/**
 * Removes entries of earlier versions — once, at start-up. Otherwise saves and
 * cached puzzles under an old prefix stay forever: never read again, but
 * taking space, easily hundreds of kilobytes for a few 10×10 puzzles.
 */
export function sweepOldStorage(): void {
  const store = storage();
  if (!store) return;
  try {
    const stale: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key?.startsWith('indizio:') && !key.startsWith(PREFIX)) stale.push(key);
    }
    // Collect first, then delete: removing shifts the indices.
    for (const key of stale) store.removeItem(key);
  } catch {
    // Nothing to sweep where nothing can be stored.
  }
}

/**
 * Cache of generated puzzles. The seed stays the source of truth — this is a
 * copy, so a 10×10 does not cost seconds again when resumed (PLAN.md §8.4).
 * The engine's own reader checks it completely.
 */
export function loadPuzzle(seed: string, generatorVersion: number): PuzzleCore | null {
  const key = PUZZLE_PREFIX + seed;
  const raw = readRaw(key);
  if (raw === undefined) return null;
  try {
    const core = parsePuzzle({ format: PUZZLE_FORMAT, schemaVersion: SCHEMA_VERSION, core: raw });
    if (core.seed === seed && core.generatorVersion === generatorVersion) return core;
  } catch (error) {
    console.warn(`Dropping invalid cached puzzle ${seed}`, error);
  }
  removeStored(key);
  return null;
}

export function cachePuzzle(core: PuzzleCore): void {
  writeStored(PUZZLE_PREFIX + core.seed, core);
}

const ProgressEntrySchema = v.object({
  solved: v.boolean(),
  bestMs: v.optional(v.pipe(v.number(), v.minValue(0))),
  hintsUsed: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  lastPlayed: v.number(),
});
const ProgressSchema = v.record(v.string(), ProgressEntrySchema);

export type ProgressEntry = v.InferOutput<typeof ProgressEntrySchema>;
export type Progress = v.InferOutput<typeof ProgressSchema>;

export function loadProgress(): Progress {
  return readStored(PROGRESS_KEY, ProgressSchema) ?? {};
}

export function recordProgress(seed: string, entry: Partial<ProgressEntry>): Progress {
  const progress = loadProgress();
  const previous = progress[seed];
  const bestMs = [previous?.bestMs, entry.bestMs].filter((ms) => ms !== undefined);
  const hintsUsed = entry.hintsUsed ?? previous?.hintsUsed;
  const next: ProgressEntry = {
    solved: entry.solved ?? previous?.solved ?? false,
    lastPlayed: Date.now(),
    ...(bestMs.length > 0 && { bestMs: Math.min(...bestMs) }),
    ...(hintsUsed !== undefined && { hintsUsed }),
  };
  const updated = { ...progress, [seed]: next };
  writeStored(PROGRESS_KEY, updated);
  return updated;
}

export function tutorialSeen(): boolean {
  // Without storage the tutorial would open on every visit; better never.
  return readStored(TUTORIAL_KEY, v.boolean()) ?? storage() === null;
}

export function markTutorialSeen(): void {
  writeStored(TUTORIAL_KEY, true);
}
