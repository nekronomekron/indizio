import { NAME_POOL, PORTRAIT_KEYS } from '../content/names.js';
import type { SceneIndex } from '../core/grid.js';
import type { Rng } from '../core/rng.js';
import type { Assignment, Cell, RoomId, Suspect, SuspectId } from '../core/types.js';

/**
 * Turning occupied cells into people, and picking who died.
 *
 * The murder rule — the victim was alone in a room with the murderer — is a
 * property of *where the cells are*, not of who stands on them. So the layout
 * is checked for a room holding exactly two people before anyone is named;
 * naming first and hoping would waste the expensive work.
 */

export interface Roles {
  suspects: Suspect[];
  solution: Assignment;
  victimId: SuspectId;
  murdererId: SuspectId;
}

function groupCellsByRoom(index: SceneIndex, cells: readonly Cell[]): Map<RoomId, Cell[]> {
  const byRoom = new Map<RoomId, Cell[]>();
  for (const cell of cells) {
    const room = index.roomOfCell[cell] ?? -1;
    const existing = byRoom.get(room);
    if (existing) existing.push(cell);
    else byRoom.set(room, [cell]);
  }
  return byRoom;
}

/**
 * Assign people to cells and pick victim and murderer.
 * Returns null when no room holds exactly two — the caller then reshuffles.
 */
export function assignRoles(rng: Rng, index: SceneIndex, cells: readonly Cell[]): Roles | null {
  const pairRooms = [...groupCellsByRoom(index, cells).values()].filter((group) => group.length === 2);
  if (pairRooms.length === 0) return null;

  const suspectCount = cells.length;
  if (NAME_POOL.length < suspectCount || PORTRAIT_KEYS.length < suspectCount) {
    throw new RangeError(`Name or portrait pool too small for ${suspectCount} suspects`);
  }

  const names = rng.shuffled(NAME_POOL).slice(0, suspectCount);
  const portraits = rng.shuffled(PORTRAIT_KEYS).slice(0, suspectCount);
  const solution: Assignment = rng.shuffled(cells);

  const suspects: Suspect[] = names.map((entry, id) => ({
    id,
    name: entry.name,
    gender: entry.gender,
    portraitKey: portraits[id]!,
    isVictim: false,
  }));

  const suspectAtCell = new Map<Cell, SuspectId>();
  solution.forEach((cell, suspect) => suspectAtCell.set(cell, suspect));

  const [firstCell, secondCell] = rng.shuffled(rng.pick(pairRooms)) as [Cell, Cell];
  const victimId = suspectAtCell.get(firstCell)!;
  const murdererId = suspectAtCell.get(secondCell)!;
  const victim = suspects[victimId];
  if (victim) victim.isVictim = true;

  return { suspects, solution, victimId, murdererId };
}
