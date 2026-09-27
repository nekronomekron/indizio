import type { PuzzleCore } from '@indizio/puzzle';
import type { GameState } from '../state/game.js';

/**
 * Bumped alongside the generator version: a saved game refers to a seed, and
 * with generator 2 those seeds produce different puzzles. Leaving the old
 * entries would fill storage with saves that fit no puzzle.
 */
const VERSION = 'v2';
const SAVE_PREFIX = 'indizio:' + VERSION + ':save:';
const PUZZLE_PREFIX = 'indizio:' + VERSION + ':puzzle:';
const PROGRESS_KEY = 'indizio:' + VERSION + ':progress';
const SETTINGS_KEY = 'indizio:' + VERSION + ':settings';

/** localStorage kann fehlen oder werfen (privates Fenster, blockierte Daten). */
function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

function writeJson(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Speicher nicht verfuegbar */ }
}

export function loadSave(seed: string): GameState | null {
  return readJson<GameState>(SAVE_PREFIX + seed);
}

export function saveGame(seed: string, state: GameState): void {
  writeJson(SAVE_PREFIX + seed, state);
}

export function dropSave(seed: string): void {
  try { localStorage.removeItem(SAVE_PREFIX + seed); } catch { /* egal */ }
}

/**
 * Zwischenspeicher fuer erzeugte Raetsel. Der Seed bleibt die Quelle der
 * Wahrheit - hier liegt nur eine Kopie, damit ein 10x10 beim Wiederaufnehmen
 * nicht erneut Sekunden kostet (PLAN.md 8.4).
 */
export function loadPuzzle(seed: string, generatorVersion: number): PuzzleCore | null {
  const cached = readJson<PuzzleCore>(PUZZLE_PREFIX + seed);
  if (!cached || cached.generatorVersion !== generatorVersion) return null;
  return cached;
}

export function cachePuzzle(core: PuzzleCore): void {
  writeJson(PUZZLE_PREFIX + core.seed, core);
}

export interface ProgressEntry {
  solved: boolean;
  bestMs?: number;
  hintsUsed?: number;
  lastPlayed: number;
}

export type Progress = Record<string, ProgressEntry>;

export function loadProgress(): Progress {
  return readJson<Progress>(PROGRESS_KEY) ?? {};
}

export function recordProgress(seed: string, entry: Partial<ProgressEntry>): Progress {
  const progress = loadProgress();
  const previous = progress[seed];
  const next: ProgressEntry = {
    solved: entry.solved ?? previous?.solved ?? false,
    lastPlayed: Date.now(),
    ...(previous?.bestMs !== undefined ? { bestMs: previous.bestMs } : {}),
    ...(previous?.hintsUsed !== undefined ? { hintsUsed: previous.hintsUsed } : {}),
  };
  if (entry.bestMs !== undefined && (next.bestMs === undefined || entry.bestMs < next.bestMs)) {
    next.bestMs = entry.bestMs;
  }
  if (entry.hintsUsed !== undefined) next.hintsUsed = entry.hintsUsed;
  progress[seed] = next;
  writeJson(PROGRESS_KEY, progress);
  return progress;
}

export interface Settings {
  locale: 'de' | 'en';
  holdMs: number;
  vibrate: boolean;
}

export const DEFAULT_SETTINGS: Settings = { locale: 'de', holdMs: 350, vibrate: true };

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...(readJson<Partial<Settings>>(SETTINGS_KEY) ?? {}) };
}

export function saveSettings(settings: Settings): void {
  writeJson(SETTINGS_KEY, settings);
}

const TUTORIAL_KEY = 'indizio:' + VERSION + ':tutorialSeen';

export function tutorialSeen(): boolean {
  try { return localStorage.getItem(TUTORIAL_KEY) === '1'; } catch { return true; }
}

export function markTutorialSeen(): void {
  try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch { /* egal */ }
}
