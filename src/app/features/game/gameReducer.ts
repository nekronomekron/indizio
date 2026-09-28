import type { Cell, PuzzleCore } from '@engine';

export type Tool = 'place' | 'mark' | 'erase';

/**
 * The hint on screen, as structure. The sentence is built when drawing, so a
 * language switch shows it in the new language rather than the one it was
 * asked in. `cell: null` means every step is already on the board.
 */
export type ShownHint = { cell: Cell; suspectId: number; step: number; totalSteps: number } | { cell: null };

export interface GameState {
  /** Side of the grid — for row and column logic. */
  size: number;
  /** Cell per suspect, null when not placed. */
  placements: (Cell | null)[];
  /** Pencil notes: suspect ids per cell. */
  notes: Record<number, number[]>;
  /** Cells marked impossible. */
  marks: number[];
  selected: number | null;
  tool: Tool;
  hintsUsed: number;
  /** The last hint asked for, until the board changes. */
  hint: ShownHint | null;
  /** Result of the last check. */
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
  | { type: 'hint'; hint: ShownHint }
  | { type: 'check'; correct: boolean }
  | { type: 'tick'; ms: number }
  | { type: 'pause'; running: boolean };

export function initialGame(core: PuzzleCore): GameState {
  return {
    size: core.size,
    placements: core.suspects.map(() => null),
    notes: {},
    marks: [],
    // The victim gets placed too — it is a card like any other. Still,
    // someone else is preselected: the victim is last in the list, and a
    // selection at the bottom while the eye starts at the top looks like a
    // mistake.
    selected: (core.suspects.find((suspect) => !suspect.isVictim) ?? core.suspects[0])?.id ?? null,
    tool: 'place',
    hintsUsed: 0,
    hint: null,
    verdict: 'none',
    elapsedMs: 0,
    running: true,
  };
}

/** State that undo can restore. */
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

/** Remove everything from this cell: placement, notes, X. */
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
 * Place a person and carry out everything that follows (PLAN.md §8.3).
 *
 * Every row and every column holds exactly one person. Once someone is fixed,
 * the rest of their row and column is ruled out — the UI records that itself
 * rather than leaving it to the player as busywork:
 *
 *  - every other cell of the row and column gets an X,
 *  - their notes go, since nobody can stand there any more,
 *  - all notes of the placed person go, since they are fixed now,
 *  - another person standing in the same row or column is taken off —
 *    otherwise the board would break the basic rule.
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
    hint: null,
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
        hint: null,
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
        state: { ...state, hint: action.hint, hintsUsed: state.hintsUsed + 1 },
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

    // There used to be a 'restore' here. It went because the saved game is now
    // the session's initial state rather than handed in later — see
    // `openSession` in GameScreen.
    default:
      return session;
  }
}

export const allPlaced = (state: GameState): boolean => state.placements.every((c) => c !== null);
