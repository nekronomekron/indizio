import type { SceneIndex } from '../core/grid.js';
import type { Assignment, Axis, Cell, Clue, RoomId, SuspectId } from '../core/types.js';

/**
 * Where a deduction came from. Carried along so a hint can explain itself
 * instead of just pointing at a cell.
 */
export type Reason =
  | { kind: 'clue'; ownerId: SuspectId | null; clue: Clue }
  | { kind: 'blocked' }
  | { kind: 'placedElsewhere'; suspectId: SuspectId }
  | { kind: 'onlyCellInLine'; axis: Axis; line: number }
  | { kind: 'onlyLineForSuspect'; axis: Axis; line: number; suspectId: SuspectId };

/**
 * Candidate sets: `candidates[suspect * cellCount + cell] === 1` means the
 * suspect could still be there.
 *
 * The solver only ever removes candidates it can prove impossible — that
 * soundness is what lets a completed run double as a uniqueness proof.
 */
export class CandidateState {
  readonly suspectCount: number;
  readonly cellCount: number;
  readonly size: number;
  readonly candidates: Uint8Array;

  /** Candidate count per suspect, maintained rather than recounted. */
  private readonly remaining: Int32Array;

  /**
   * Bumped on every actual change.
   *
   * Derived views cache against this instead of being invalidated by hand at
   * every call site — a forgotten invalidation would be a silent wrong answer,
   * and there is no way to forget a counter.
   */
  private changeCount = 0;

  /** Cause of the most recent removal per suspect, for hint explanations. */
  readonly lastReason: (Reason | null)[];

  constructor(suspectCount: number, size: number) {
    this.suspectCount = suspectCount;
    this.size = size;
    this.cellCount = size * size;
    this.candidates = new Uint8Array(suspectCount * this.cellCount).fill(1);
    this.remaining = new Int32Array(suspectCount).fill(this.cellCount);
    this.lastReason = Array.from({ length: suspectCount }, () => null);
  }

  get revision(): number {
    return this.changeCount;
  }

  clone(): CandidateState {
    const copy = new CandidateState(this.suspectCount, this.size);
    copy.candidates.set(this.candidates);
    copy.remaining.set(this.remaining);
    copy.changeCount = this.changeCount;
    for (let suspect = 0; suspect < this.suspectCount; suspect++) {
      copy.lastReason[suspect] = this.lastReason[suspect] ?? null;
    }
    return copy;
  }

  canBeAt(suspect: SuspectId, cell: Cell): boolean {
    return this.candidates[suspect * this.cellCount + cell] === 1;
  }

  /** Returns true only if something was actually removed. */
  remove(suspect: SuspectId, cell: Cell, reason: Reason): boolean {
    const offset = suspect * this.cellCount + cell;
    if (this.candidates[offset] === 0) return false;
    this.candidates[offset] = 0;
    this.remaining[suspect] = (this.remaining[suspect] ?? 0) - 1;
    this.lastReason[suspect] = reason;
    this.changeCount++;
    return true;
  }

  /** Restrict a suspect to the cells the predicate accepts. */
  keepOnly(suspect: SuspectId, keep: (cell: Cell) => boolean, reason: Reason): boolean {
    let changed = false;
    const base = suspect * this.cellCount;
    for (let cell = 0; cell < this.cellCount; cell++) {
      if (this.candidates[base + cell] === 1 && !keep(cell)) {
        this.candidates[base + cell] = 0;
        this.remaining[suspect] = (this.remaining[suspect] ?? 0) - 1;
        this.lastReason[suspect] = reason;
        changed = true;
      }
    }
    if (changed) this.changeCount++;
    return changed;
  }

  cellsFor(suspect: SuspectId): Cell[] {
    const cells: Cell[] = [];
    const base = suspect * this.cellCount;
    for (let cell = 0; cell < this.cellCount; cell++) {
      if (this.candidates[base + cell] === 1) cells.push(cell);
    }
    return cells;
  }

  countFor(suspect: SuspectId): number {
    return this.remaining[suspect] ?? 0;
  }

  /** The only possible cell, or -1 if the suspect is not yet pinned down. */
  onlyCellFor(suspect: SuspectId): Cell {
    if (this.remaining[suspect] !== 1) return -1;
    const base = suspect * this.cellCount;
    for (let cell = 0; cell < this.cellCount; cell++) {
      if (this.candidates[base + cell] === 1) return cell;
    }
    return -1;
  }

  isAnyonePossibleAt(cell: Cell): boolean {
    for (let suspect = 0; suspect < this.suspectCount; suspect++) {
      if (this.canBeAt(suspect, cell)) return true;
    }
    return false;
  }

  /** Bit mask of the rows (or columns) a suspect could still occupy. */
  lineMask(suspect: SuspectId, axis: Axis): number {
    let mask = 0;
    const base = suspect * this.cellCount;
    for (let cell = 0; cell < this.cellCount; cell++) {
      if (this.candidates[base + cell] === 1) {
        mask |= 1 << (axis === 'row' ? Math.floor(cell / this.size) : cell % this.size);
      }
    }
    return mask;
  }

  hasSuspectWithNoCells(): boolean {
    for (let suspect = 0; suspect < this.suspectCount; suspect++) {
      if (this.remaining[suspect] === 0) return true;
    }
    return false;
  }

  /** The assignment, or null while anyone still has more than one candidate. */
  toAssignment(): Assignment | null {
    const assignment: Assignment = [];
    for (let suspect = 0; suspect < this.suspectCount; suspect++) {
      const cell = this.onlyCellFor(suspect);
      if (cell < 0) return null;
      assignment.push(cell);
    }
    return assignment;
  }
}

/** Starting point: every walkable cell is possible for everyone. */
export function createInitialState(index: SceneIndex, suspectCount: number): CandidateState {
  const state = new CandidateState(suspectCount, index.size);
  const blockedReason: Reason = { kind: 'blocked' };
  for (let suspect = 0; suspect < suspectCount; suspect++) {
    for (let cell = 0; cell < index.cellCount; cell++) {
      if (index.blocked[cell] === 1) state.remove(suspect, cell, blockedReason);
    }
  }
  return state;
}

/**
 * Which rooms each suspect could still be in.
 *
 * Room-occupancy clues ask this constantly, and recomputing it per clue was
 * the most expensive path in propagation. The view caches against the state's
 * revision, so it refreshes exactly when something changed and never because
 * someone remembered to say so.
 */
export class RoomView {
  private roomsPerSuspect: Set<RoomId>[] = [];
  private seenRevision = -1;

  constructor(private readonly index: SceneIndex, private readonly state: CandidateState) {}

  private refresh(): void {
    if (this.seenRevision === this.state.revision) return;
    const { suspectCount, cellCount } = this.state;
    this.roomsPerSuspect = Array.from({ length: suspectCount }, () => new Set<RoomId>());
    for (let suspect = 0; suspect < suspectCount; suspect++) {
      const base = suspect * cellCount;
      const rooms = this.roomsPerSuspect[suspect]!;
      for (let cell = 0; cell < cellCount; cell++) {
        if (this.state.candidates[base + cell] === 1) rooms.add(this.index.roomOfCell[cell] ?? -1);
      }
    }
    this.seenRevision = this.state.revision;
  }

  /** Suspects who must be in this room, having no candidate anywhere else. */
  forcedInto(roomId: RoomId): SuspectId[] {
    this.refresh();
    const forced: SuspectId[] = [];
    for (let suspect = 0; suspect < this.state.suspectCount; suspect++) {
      const rooms = this.roomsPerSuspect[suspect];
      if (rooms?.size === 1 && rooms.has(roomId)) forced.push(suspect);
    }
    return forced;
  }

  /** Suspects who could be in this room. */
  possibleIn(roomId: RoomId): SuspectId[] {
    this.refresh();
    const possible: SuspectId[] = [];
    for (let suspect = 0; suspect < this.state.suspectCount; suspect++) {
      if (this.roomsPerSuspect[suspect]?.has(roomId)) possible.push(suspect);
    }
    return possible;
  }

  /** The room a suspect is confined to, or -1 if more than one is possible. */
  confinedRoom(suspect: SuspectId): RoomId {
    this.refresh();
    const rooms = this.roomsPerSuspect[suspect];
    if (rooms?.size !== 1) return -1;
    return rooms.values().next().value!;
  }

  roomsFor(suspect: SuspectId): ReadonlySet<RoomId> {
    this.refresh();
    return this.roomsPerSuspect[suspect] ?? new Set<RoomId>();
  }
}
