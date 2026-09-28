import type { Cell, PuzzleCore } from '@engine';

export type Tool = 'place' | 'mark' | 'erase';

export interface GameState {
  /** Kantenlaenge des Gitters - fuer Zeilen- und Spaltenlogik. */
  size: number;
  /** Zelle je Verdaechtigem, null wenn nicht platziert. */
  placements: (Cell | null)[];
  /** Bleistiftnotizen: Verdaechtigen-Ids je Zelle. */
  notes: Record<number, number[]>;
  /** Als unmoeglich markierte Zellen. */
  marks: number[];
  selected: number | null;
  tool: Tool;
  hintsUsed: number;
  /** Hervorgehobene Zelle des letzten Tipps. */
  hintCell: Cell | null;
  hintText: string | null;
  /** Ergebnis der letzten Pruefung. */
  verdict: 'none' | 'wrong' | 'solved';
  elapsedMs: number;
  running: boolean;
}

export type GameAction =
  | { type: 'select'; suspectId: number | null }
  | { type: 'tool'; tool: Tool }
  | { type: 'place'; cell: Cell }
  | { type: 'note'; cell: Cell }
  | { type: 'mark'; cell: Cell }
  | { type: 'clearCell'; cell: Cell }
  | { type: 'clearAll' }
  | { type: 'undo' }
  | { type: 'hint'; cell: Cell; text: string }
  | { type: 'check'; correct: boolean }
  | { type: 'tick'; ms: number }
  | { type: 'pause'; running: boolean };

export function initialGame(core: PuzzleCore): GameState {
  return {
    size: core.size,
    placements: core.suspects.map(() => null),
    notes: {},
    marks: [],
    // Auch das Opfer wird platziert - es ist eine Karte wie jede andere.
    // Vorausgewaehlt ist trotzdem jemand anderes: das Opfer steht in der
    // Liste zuletzt, und eine Auswahl am unteren Ende, waehrend der Blick
    // oben anfaengt, sieht nach Versehen aus.
    selected: (core.suspects.find((suspect) => !suspect.isVictim) ?? core.suspects[0])?.id ?? null,
    tool: 'place',
    hintsUsed: 0,
    hintCell: null,
    hintText: null,
    verdict: 'none',
    elapsedMs: 0,
    running: true,
  };
}

/** Zustaende, die per Rueckgaengig wiederherstellbar sind. */
type Snapshot = Pick<GameState, 'placements' | 'notes' | 'marks'>;

export interface GameSession {
  state: GameState;
  history: Snapshot[];
}

const snapshot = (state: GameState): Snapshot => ({
  placements: state.placements.slice(),
  notes: Object.fromEntries(Object.entries(state.notes).map(([k, v]) => [k, v.slice()])),
  marks: state.marks.slice(),
});

const MAX_HISTORY = 200;

function without<T>(list: readonly T[], value: T): T[] {
  return list.filter((x) => x !== value);
}

/** A copy of the record without one key. */
function omitKey<V>(record: Readonly<Record<number, V>>, key: number): Record<number, V> {
  return Object.fromEntries(Object.entries(record).filter(([entry]) => Number(entry) !== key));
}

/** Alles von dieser Zelle entfernen: Platzierung, Notizen, X. */
function clearCell(state: GameState, cell: Cell): GameState {
  const notes = omitKey(state.notes, cell);
  return {
    ...state,
    placements: state.placements.map((c) => (c === cell ? null : c)),
    notes,
    marks: without(state.marks, cell),
    verdict: 'none',
  };
}

/**
 * Eine Person setzen und alles nachziehen, was daraus folgt (PLAN.md 8.3).
 *
 * In jeder Zeile und jeder Spalte steht genau eine Person. Sobald jemand
 * feststeht, ist damit der Rest seiner Zeile und Spalte ausgeschlossen - das
 * traegt die Oberflaeche selbst nach, statt es dem Spieler als Fleissarbeit zu
 * ueberlassen:
 *
 *  - alle uebrigen Felder der Zeile und Spalte bekommen ein X,
 *  - deren Notizen fallen weg, denn dort kann niemand mehr stehen,
 *  - saemtliche Notizen der gesetzten Person verschwinden, sie ist ja fix,
 *  - eine andere Person, die in derselben Zeile oder Spalte stand, wird
 *    heruntergenommen - sonst entstuende ein Brett, das die Grundregel bricht.
 */
export function placeSuspect(state: GameState, suspectId: number, cell: Cell): GameState {
  const size = state.size;
  const row = Math.floor(cell / size);
  const col = cell % size;
  const aufLinie = (c: Cell): boolean => Math.floor(c / size) === row || c % size === col;

  const placements = state.placements.map((vorhanden, id) => {
    if (id === suspectId) return cell;
    if (vorhanden === null) return null;
    return aufLinie(vorhanden) ? null : vorhanden;
  });

  const notes: Record<number, number[]> = {};
  for (const [key, ids] of Object.entries(state.notes)) {
    const c = Number(key);
    if (aufLinie(c)) continue;
    const rest = ids.filter((id) => id !== suspectId);
    if (rest.length > 0) notes[c] = rest;
  }

  const marks = new Set(state.marks.filter((c) => c !== cell));
  for (let c = 0; c < size * size; c++) {
    if (c === cell || !aufLinie(c)) continue;
    marks.add(c);
  }

  return {
    ...state,
    placements,
    notes,
    marks: [...marks].sort((a, b) => a - b),
    verdict: 'none',
    hintCell: null,
    hintText: null,
  };
}

export function gameReducer(session: GameSession, action: GameAction): GameSession {
  const { state } = session;
  const push = (next: GameState): GameSession => ({
    state: next,
    history: [...session.history, snapshot(state)].slice(-MAX_HISTORY),
  });

  switch (action.type) {
    case 'select':
      return { ...session, state: { ...state, selected: action.suspectId, tool: 'place' } };

    case 'tool':
      return { ...session, state: { ...state, tool: action.tool } };

    case 'place': {
      if (state.selected === null) return session;
      return push(placeSuspect(state, state.selected, action.cell));
    }

    case 'note': {
      if (state.selected === null) return session;
      const current = state.notes[action.cell] ?? [];
      const next = current.includes(state.selected)
        ? without(current, state.selected)
        : [...current, state.selected].sort((a, b) => a - b);
      const notes =
        next.length === 0 ? omitKey(state.notes, action.cell) : { ...state.notes, [action.cell]: next };
      return push({ ...state, notes, verdict: 'none' });
    }

    case 'mark': {
      const marks = state.marks.includes(action.cell)
        ? without(state.marks, action.cell)
        : [...state.marks, action.cell];
      return push({ ...state, marks, verdict: 'none' });
    }

    case 'clearCell':
      return push(clearCell(state, action.cell));

    case 'clearAll':
      return push({
        ...state,
        placements: state.placements.map(() => null),
        notes: {},
        marks: [],
        verdict: 'none',
        hintCell: null,
        hintText: null,
      });

    case 'undo': {
      const previous = session.history[session.history.length - 1];
      if (!previous) return session;
      return {
        state: { ...state, ...previous, verdict: 'none' },
        history: session.history.slice(0, -1),
      };
    }

    case 'hint':
      return {
        ...session,
        state: { ...state, hintCell: action.cell, hintText: action.text, hintsUsed: state.hintsUsed + 1 },
      };

    case 'check':
      return {
        ...session,
        state: {
          ...state,
          verdict: action.correct ? 'solved' : 'wrong',
          running: action.correct ? false : state.running,
        },
      };

    case 'tick':
      return state.running && state.verdict !== 'solved'
        ? { ...session, state: { ...state, elapsedMs: state.elapsedMs + action.ms } }
        : session;

    case 'pause':
      return { ...session, state: { ...state, running: action.running } };

    // Ein 'restore' gab es hier einmal. Es ist weggefallen, weil der
    // gespeicherte Stand jetzt der Anfangszustand der Sitzung ist und nicht
    // nachträglich hineingereicht wird — siehe `openSession` in GameScreen.
    default:
      return session;
  }
}

export const allPlaced = (state: GameState): boolean => state.placements.every((c) => c !== null);
