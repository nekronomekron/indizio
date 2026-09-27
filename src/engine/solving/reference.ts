import { evaluateClue, isUnaryClue, unaryHolds } from '../clues/evaluate.js';
import { buildOccupancy } from '../clues/occupancy.js';
import type { SceneIndex } from '../core/grid.js';
import type { Assignment, Cell, Clue, ClueEntry, RoomId, Suspect, SuspectId } from '../core/types.js';

/**
 * An independent reference solver: exhaustive search with pruning.
 *
 * It uses only what clues *mean*, never the deductive rules. That
 * independence is the whole point — it can confirm the deductive solver's
 * answers without sharing its assumptions, so a bug in one cannot hide a bug
 * in the other. Too slow for gameplay, exactly right for verification.
 */

export interface ReferenceResult {
  /** Solutions found, capped at `solutionLimit`. */
  count: number;
  first: Assignment | null;
  /** Search nodes visited. */
  nodes: number;
  /** False when the node budget ran out before the search finished. */
  exhaustive: boolean;
}

export interface ReferenceOptions {
  /** Stop once this many solutions are found. Defaults to 2 — enough to answer "unique?". */
  solutionLimit?: number;
  maxNodes?: number;
  /** Force a suspect onto one cell. Used to prove a solver removal was necessary. */
  pin?: { suspectId: SuspectId; cell: Cell };
  /** Forbid one cell for a suspect. */
  forbid?: { suspectId: SuspectId; cell: Cell };
}

const DEFAULT_SOLUTION_LIMIT = 2;
const DEFAULT_MAX_NODES = 20_000_000;

interface Search {
  index: SceneIndex;
  clues: readonly ClueEntry[];
  cluesByOwner: Clue[][];
  sceneClues: Clue[];
  candidates: Cell[][];
  /** Suspect order, fewest candidates first — the cheapest branches first. */
  order: SuspectId[];
  placedAt: Int32Array;
  usedRows: Uint8Array;
  usedColumns: Uint8Array;
  occupantsPerRoom: Map<RoomId, number>;
  size: number;
  suspectCount: number;
  /** Cleared when the node budget runs out, including deep in the recursion. */
  withinBudget: boolean;
}

function splitByOwner(clues: readonly ClueEntry[], suspectCount: number): {
  cluesByOwner: Clue[][];
  sceneClues: Clue[];
} {
  const cluesByOwner: Clue[][] = Array.from({ length: suspectCount }, () => []);
  const sceneClues: Clue[] = [];
  for (const entry of clues) {
    if (entry.ownerId === null) sceneClues.push(entry.clue);
    else cluesByOwner[entry.ownerId]?.push(entry.clue);
  }
  return { cluesByOwner, sceneClues };
}

/**
 * Cells a suspect could occupy considering only walkability and unary clues.
 * Purely definitional — no inference, so the oracle stays independent.
 */
function candidateCells(
  index: SceneIndex,
  cluesByOwner: readonly Clue[][],
  suspect: SuspectId,
  options: ReferenceOptions,
): Cell[] {
  const cells: Cell[] = [];
  for (const cell of index.walkableCells) {
    if (options.pin?.suspectId === suspect && options.pin.cell !== cell) continue;
    if (options.forbid?.suspectId === suspect && options.forbid.cell === cell) continue;
    const satisfiesUnary = (cluesByOwner[suspect] ?? [])
      .every((clue) => !isUnaryClue(clue) || unaryHolds(index, clue, cell));
    if (satisfiesUnary) cells.push(cell);
  }
  return cells;
}

/**
 * Can the partial placement still be completed?
 *
 * Only checks what is already decidable — a clue about an unplaced person is
 * left alone. Cheap enough to run at every node, strong enough to keep the
 * search from exploring hopeless branches.
 */
function stillPossible(search: Search): boolean {
  const { index, placedAt, occupantsPerRoom, size, suspectCount } = search;

  for (const clue of search.sceneClues) {
    if (clue.type === 'EMPTY_ROOM' && (occupantsPerRoom.get(clue.roomId) ?? 0) > 0) return false;
    if (clue.type === 'ROOM_COUNT' && (occupantsPerRoom.get(clue.roomId) ?? 0) > clue.count) return false;
  }

  for (let suspect = 0; suspect < suspectCount; suspect++) {
    const ownCell = placedAt[suspect] ?? -1;
    if (ownCell < 0) continue;
    const room = index.roomOfCell[ownCell] ?? -1;
    const occupants = occupantsPerRoom.get(room) ?? 0;

    for (const clue of search.cluesByOwner[suspect] ?? []) {
      switch (clue.type) {
        case 'ALONE':
          if (clue.roomId !== undefined && room !== clue.roomId) return false;
          if (occupants > 1) return false;
          break;

        case 'VICTIM':
          if (occupants > 2) return false;
          break;

        case 'ALONE_WITH': {
          const allowed = new Set<SuspectId>([suspect, ...clue.otherIds]);
          for (let other = 0; other < suspectCount; other++) {
            const otherCell = placedAt[other] ?? -1;
            if (other === suspect || otherCell < 0) continue;
            if (index.roomOfCell[otherCell] === room && !allowed.has(other)) return false;
          }
          break;
        }

        case 'SAME_ROOM_AS': {
          const otherCell = placedAt[clue.otherId] ?? -1;
          if (otherCell >= 0 && index.roomOfCell[otherCell] !== room) return false;
          break;
        }

        case 'DIRECTION_OF_SUSPECT': {
          const otherCell = placedAt[clue.otherId] ?? -1;
          if (otherCell < 0) break;
          const holds =
            clue.direction === 'west' ? ownCell % size < otherCell % size
            : clue.direction === 'east' ? ownCell % size > otherCell % size
            : clue.direction === 'north' ? Math.floor(ownCell / size) < Math.floor(otherCell / size)
            : Math.floor(ownCell / size) > Math.floor(otherCell / size);
          if (!holds) return false;
          break;
        }

        case 'DIAGONAL_OF': {
          const otherCell = placedAt[clue.otherId] ?? -1;
          if (otherCell < 0) break;
          const rowDistance = Math.abs(Math.floor(ownCell / size) - Math.floor(otherCell / size));
          const columnDistance = Math.abs((ownCell % size) - (otherCell % size));
          if (rowDistance === 0 || rowDistance !== columnDistance) return false;
          break;
        }

        default:
          break;
      }
    }
  }
  return true;
}

export function solveByReference(
  index: SceneIndex,
  suspects: readonly Suspect[],
  clues: readonly ClueEntry[],
  options: ReferenceOptions = {},
): ReferenceResult {
  const solutionLimit = options.solutionLimit ?? DEFAULT_SOLUTION_LIMIT;
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  const suspectCount = suspects.length;
  const { size } = index;

  const { cluesByOwner, sceneClues } = splitByOwner(clues, suspectCount);
  const candidates = Array.from({ length: suspectCount }, (_, suspect) =>
    candidateCells(index, cluesByOwner, suspect, options));

  const search: Search = {
    index,
    clues,
    cluesByOwner,
    sceneClues,
    candidates,
    order: Array.from({ length: suspectCount }, (_, i) => i)
      .sort((a, b) => (candidates[a]?.length ?? 0) - (candidates[b]?.length ?? 0)),
    placedAt: new Int32Array(suspectCount).fill(-1),
    usedRows: new Uint8Array(size),
    usedColumns: new Uint8Array(size),
    occupantsPerRoom: new Map(index.scene.rooms.map((room) => [room.id, 0])),
    size,
    suspectCount,
    withinBudget: true,
  };

  let count = 0;
  let nodes = 0;
  let first: Assignment | null = null;

  /**
   * Read through a function so the check survives type narrowing: the flag is
   * cleared deep inside the recursion, which flow analysis cannot see.
   */
  const outOfBudget = (): boolean => !search.withinBudget;

  const explore = (depth: number): void => {
    if (count >= solutionLimit || outOfBudget()) return;
    if (++nodes > maxNodes) {
      search.withinBudget = false;
      return;
    }

    if (depth === suspectCount) {
      const assignment = Array.from(search.placedAt);
      const occupancy = buildOccupancy(index, assignment);
      const allTrue = clues.every((entry) => evaluateClue(index, occupancy, entry.ownerId, entry.clue));
      if (!allTrue) return;
      count++;
      first ??= assignment;
      return;
    }

    const suspect = search.order[depth]!;
    for (const cell of search.candidates[suspect] ?? []) {
      const row = Math.floor(cell / size);
      const column = cell % size;
      if (search.usedRows[row] === 1 || search.usedColumns[column] === 1) continue;

      const room = index.roomOfCell[cell] ?? -1;
      search.placedAt[suspect] = cell;
      search.usedRows[row] = 1;
      search.usedColumns[column] = 1;
      search.occupantsPerRoom.set(room, (search.occupantsPerRoom.get(room) ?? 0) + 1);

      if (stillPossible(search)) explore(depth + 1);

      search.occupantsPerRoom.set(room, (search.occupantsPerRoom.get(room) ?? 1) - 1);
      search.usedRows[row] = 0;
      search.usedColumns[column] = 0;
      search.placedAt[suspect] = -1;

      if (count >= solutionLimit || outOfBudget()) return;
    }
  };

  explore(0);
  return { count, first, nodes, exhaustive: search.withinBudget };
}
