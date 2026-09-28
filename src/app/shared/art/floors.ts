import { FLOOR_MATERIALS, findTheme, type FloorMaterial } from '@engine';

/**
 * Which floor lies in which room — and how its tile is drawn.
 *
 * The floor itself belongs to the theme (`rooms: [{ key, floor }]`, PLAN.md
 * §14, U2): tiles in the bathroom, grass on the lawn. The drawings live in
 * `art/`; see art/README.md.
 */

export { FLOOR_MATERIALS, type FloorMaterial };

/** Floor for a room the app knows no theme for — a document from elsewhere. */
export const DEFAULT_FLOOR: FloorMaterial = 'concrete';

/** The floor of a room of a theme, or the default when either is unknown. */
export function floorFor(themeKey: string, roomKey: string): FloorMaterial {
  return findTheme(themeKey)?.rooms.find((room) => room.key === roomKey)?.floor ?? DEFAULT_FLOOR;
}

/**
 * Floors whose tile may be mirrored.
 *
 * One tile repeated over a whole grid shows as a pattern. Mirroring per cell
 * helps — but only where nothing runs over the tile's edge. Plank joints,
 * grout and waves have to meet at the border, and a mirrored neighbour would
 * cut them. Scatter like grass, gravel, sand and soil has no such edges.
 */
const SCATTERABLE = new Set<FloorMaterial>(['grass', 'soil', 'gravel', 'sand']);

/** Mirroring of one cell: same cell, same picture — always. */
export function floorFlip(material: FloorMaterial, cell: number): { x: number; y: number } {
  if (!SCATTERABLE.has(material)) return { x: 1, y: 1 };
  let h = Math.imul(cell + 0x9e37, 2654435761) >>> 0;
  h ^= h >>> 15;
  return { x: h & 1 ? -1 : 1, y: h & 2 ? -1 : 1 };
}
