/**
 * Welcher Boden in welchem Raum liegt.
 *
 * Das ist Spiellogik, keine Zeichnung: Der Belag folgt dem **Raumnamen** und
 * nicht der Raum-Id — im Bad Fliesen, auf dem Rasen Gras, in der Werkstatt
 * Estrich. Fast jeder Hinweis nimmt auf Räume Bezug, und ein wiedererkennbarer
 * Boden macht die Raumgrenzen ohne Nachlesen klar.
 *
 * Gezeichnet werden die Kacheln nicht hier, sondern in `art/`. Wie sie dort
 * hinkommen, steht in [art/README.md](../../../art/README.md).
 */

export type FloorMaterial =
  | 'wood' | 'tile' | 'stone' | 'concrete' | 'carpet'
  | 'grass' | 'soil' | 'gravel' | 'sand' | 'water';

/** Alle Belaege, fuer Uebersichten, Tests und den Erzeuger der Grafiken. */
export const FLOOR_MATERIALS: readonly FloorMaterial[] = [
  'wood', 'tile', 'stone', 'concrete', 'carpet',
  'grass', 'soil', 'gravel', 'sand', 'water',
];

/** Belag, auf den ein fremdes Theme zurueckfaellt. */
export const DEFAULT_FLOOR: FloorMaterial = 'concrete';

/** Raumname -> Belag. */
export const FLOOR_BY_ROOM: Record<string, FloorMaterial> = {
  // Werkstatt
  workshop: 'concrete',
  storage: 'concrete',
  washbay: 'tile',
  waiting: 'tile',
  reception: 'stone',
  office: 'carpet',
  yard: 'gravel',
  // Wohnung
  livingroom: 'wood',
  kitchen: 'tile',
  bedroom: 'carpet',
  hallway: 'wood',
  bathroom: 'tile',
  study: 'wood',
  balcony: 'stone',
  // Garten
  lawn: 'grass',
  patio: 'stone',
  vegetablepatch: 'soil',
  shedarea: 'gravel',
  pondside: 'water',
  greenhouse: 'soil',
  playarea: 'sand',
};

export function floorFor(roomNameKey: string): FloorMaterial {
  return FLOOR_BY_ROOM[roomNameKey] ?? DEFAULT_FLOOR;
}

/**
 * Belaege, deren Kachel gespiegelt werden darf.
 *
 * Eine einzelne Kachel, ueber ein ganzes Gitter wiederholt, faellt als Muster
 * auf. Dagegen hilft Spiegeln je Zelle — aber nur dort, wo nichts ueber die
 * Kachelkante laeuft. Dielenstoesse, Fugen und Wellen muessen sich am Rand
 * treffen; ein gespiegelter Nachbar wuerde sie zerschneiden. Streugut wie Gras,
 * Kies, Sand und Erde hat diese Kanten nicht und darf sich drehen.
 */
const SCATTERABLE = new Set<FloorMaterial>(['grass', 'soil', 'gravel', 'sand']);

/** Spiegelung einer Zelle: gleiche Zelle, gleiches Bild — immer. */
export function floorFlip(material: FloorMaterial, cell: number): { x: number; y: number } {
  if (!SCATTERABLE.has(material)) return { x: 1, y: 1 };
  let h = Math.imul(cell + 0x9e37, 2654435761) >>> 0;
  h ^= h >>> 15;
  return { x: h & 1 ? -1 : 1, y: h & 2 ? -1 : 1 };
}
