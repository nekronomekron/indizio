import type { PuzzleCore } from '@engine';

/**
 * Zieht mit der Generatorversion mit: ein Spielstand zeigt auf einen Seed, und
 * derselbe Seed ergibt unter einem anderen Generator ein anderes Rätsel. Alte
 * Einträge liegen zu lassen hieße, den Speicher mit Ständen zu füllen, die zu
 * keinem Rätsel mehr passen.
 *
 * Beim Schritt auf Generator 3 ist genau das unterblieben — die Schlüssel
 * standen weiter unter `v2` und versprachen damit eine Version, die nicht
 * stimmte. Nachgeholt, und {@link sweepOldStorage} räumt die alten weg.
 *
 * Generator 4 (verlegte Teppiche und Matten, PLAN.md §13) zieht genauso mit:
 * Fortschritt, Kalender, Spielstände und Einstellungen beginnen neu. Eine
 * Übernahme des Fortschritts war erwogen und ist bewusst verworfen (§13.6).
 */
const VERSION = 'v4';
const PREFIX = 'indizio:' + VERSION + ':';
/** Key of the game in progress for a seed. The game feature owns what is stored there. */
export const saveKey = (seed: string): string => PREFIX + 'save:' + seed;
const PUZZLE_PREFIX = PREFIX + 'puzzle:';
const PROGRESS_KEY = PREFIX + 'progress';
/** Key of the player's settings. The settings feature owns what is stored there. */
export const SETTINGS_KEY = PREFIX + 'settings';

/** localStorage kann fehlen oder werfen (privates Fenster, blockierte Daten). */
export function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Speicher nicht verfuegbar */
  }
}

/**
 * Liegt zu diesem Rätsel ein angefangener Stand?
 *
 * Der Kalender zeigt damit „angefangen" statt „unberührt". Bewusst nur die
 * Existenz und nicht der Inhalt: eine Zelle im Kalender soll nicht den ganzen
 * Spielstand einlesen und wieder wegwerfen, nur um einen Punkt zu zeichnen.
 */
export function hasSave(seed: string): boolean {
  try {
    return localStorage.getItem(saveKey(seed)) !== null;
  } catch {
    return false;
  }
}

/**
 * Räumt die Einträge früherer Fassungen weg — einmal beim Start.
 *
 * Ohne das bleiben Spielstände, zwischengespeicherte Rätsel und Einstellungen
 * unter `indizio:v2:` für immer im Browser liegen: nie wieder gelesen, aber
 * Platz belegend, und bei einem 10×10 sind das schnell einige hundert Kilobyte.
 */
export function sweepOldStorage(): void {
  try {
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null && key.startsWith('indizio:') && !key.startsWith(PREFIX)) stale.push(key);
    }
    // Erst sammeln, dann löschen: das Entfernen verschiebt die Indizes.
    for (const key of stale) localStorage.removeItem(key);
  } catch {
    /* Speicher nicht verfuegbar */
  }
}

/**
 * Zwischenspeicher fuer erzeugte Raetsel. Der Seed bleibt die Quelle der
 * Wahrheit - hier liegt nur eine Kopie, damit ein 10x10 beim Wiederaufnehmen
 * nicht erneut Sekunden kostet (PLAN.md 8.4).
 */
export function loadPuzzle(seed: string, generatorVersion: number): PuzzleCore | null {
  const cached = readJson(PUZZLE_PREFIX + seed) as PuzzleCore | null;
  if (cached?.generatorVersion !== generatorVersion) return null;
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
  return (readJson(PROGRESS_KEY) as Progress | null) ?? {};
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

const TUTORIAL_KEY = 'indizio:' + VERSION + ':tutorialSeen';

export function tutorialSeen(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === '1';
  } catch {
    return true;
  }
}

export function markTutorialSeen(): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, '1');
  } catch {
    /* egal */
  }
}
