import type { Cell } from '@engine';

/**
 * Verlegte Requisiten zeichnen (PLAN.md §13.4).
 *
 * Ein Teppich, der um die Ecke laeuft, ist kein Rechteck und damit auch kein
 * einzelnes Bild. Jede Zelle setzt sich aus **vier Vierteln** zusammen, und
 * jedes Viertel kommt aus einem festen Blatt von 48 × 72 (2 × 3 Felder):
 *
 * ```
 * [ Einzelfeld ][ Innenecken ]   y  0–24
 * [ 2×2-Block: Aussenecken,  ]   y 24–72
 * [ Kanten und Fuellung      ]
 * ```
 *
 * Welches Viertel eine Zelle bekommt, haengt nur an den zwei Nachbarn, an die
 * dieses Viertel grenzt, und an der Diagonalen dazwischen. Ein Viertel kommt
 * immer aus derselben Lage im Blatt, in der es auf dem Brett sitzt — nichts
 * wird gedreht, Licht und Perspektive der Zeichnung bleiben stimmig.
 *
 * Reine Rechnung ohne DOM, damit sie sich vollstaendig pruefen laesst.
 */

/** Blattgroesse in Einheiten der Zeichenflaeche. */
export const SHEET_WIDTH = 48;
export const SHEET_HEIGHT = 72;
/** Kantenlaenge eines Feldes im Blatt; ein Viertel ist halb so gross. */
export const SHEET_UNIT = 24;

export type Corner = 'nw' | 'ne' | 'sw' | 'se';

/**
 * Was an einem Viertel anliegt.
 *
 * - `outer`: weder der senkrechte noch der waagerechte Nachbar gehoert dazu
 * - `horizontal`: nur der waagerechte, das Viertel ist Teil einer waagerechten Kante
 * - `vertical`: nur der senkrechte, Teil einer senkrechten Kante
 * - `inner`: beide, aber nicht die Diagonale — eine Innenecke
 * - `fill`: alle drei
 */
export type QuarterCase = 'outer' | 'horizontal' | 'vertical' | 'inner' | 'fill';

export interface Quarter {
  corner: Corner;
  case: QuarterCase;
  /** Linke obere Ecke der Quelle im Blatt, in Einheiten der Zeichenflaeche. */
  x: number;
  y: number;
}

/** Aussenkanten einer Zelle: dort endet die Form, dort gehoert ein Rand hin. */
export interface OpenEdges {
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
}

export interface TileCell {
  cell: Cell;
  row: number;
  column: number;
  quarters: Quarter[];
  edges: OpenEdges;
}

/**
 * Quelle je Lage und Fall. Die Nordwest-Zeile steht so auch in PLAN.md §13.4;
 * die anderen folgen daraus, dass ein Ost-Viertel aus der rechten und ein
 * Sued-Viertel aus der unteren Haelfte seines Feldes kommt.
 */
const SOURCE: Record<Corner, Record<QuarterCase, readonly [number, number]>> = {
  nw: { outer: [0, 24], horizontal: [24, 24], vertical: [0, 48], fill: [24, 48], inner: [24, 0] },
  ne: { outer: [36, 24], horizontal: [12, 24], vertical: [36, 48], fill: [12, 48], inner: [36, 0] },
  sw: { outer: [0, 60], horizontal: [24, 60], vertical: [0, 36], fill: [24, 36], inner: [24, 12] },
  se: { outer: [36, 60], horizontal: [12, 60], vertical: [36, 36], fill: [12, 36], inner: [36, 12] },
};

/** Welche Nachbarn ein Viertel beruehren: senkrecht, waagerecht, diagonal, als Zeilen- und Spaltenschritt. */
const REACH: Record<Corner, { vertical: number; horizontal: number }> = {
  nw: { vertical: -1, horizontal: -1 },
  ne: { vertical: -1, horizontal: 1 },
  sw: { vertical: 1, horizontal: -1 },
  se: { vertical: 1, horizontal: 1 },
};

const CORNERS: readonly Corner[] = ['nw', 'ne', 'sw', 'se'];

export function quarterCase(vertical: boolean, horizontal: boolean, diagonal: boolean): QuarterCase {
  if (!vertical && !horizontal) return 'outer';
  if (!vertical) return 'horizontal';
  if (!horizontal) return 'vertical';
  return diagonal ? 'fill' : 'inner';
}

/** Viertel und Aussenkanten fuer jede Zelle einer Form. */
export function quarterTiles(cells: readonly Cell[], size: number): TileCell[] {
  const inShape = new Set(cells);
  const has = (row: number, column: number): boolean =>
    row >= 0 && row < size && column >= 0 && column < size && inShape.has(row * size + column);

  return cells.map((cell) => {
    const row = Math.floor(cell / size);
    const column = cell % size;
    const quarters = CORNERS.map((corner): Quarter => {
      const { vertical, horizontal } = REACH[corner];
      const kind = quarterCase(
        has(row + vertical, column),
        has(row, column + horizontal),
        has(row + vertical, column + horizontal),
      );
      const [x, y] = SOURCE[corner][kind];
      return { corner, case: kind, x, y };
    });
    return {
      cell,
      row,
      column,
      quarters,
      edges: {
        north: !has(row - 1, column),
        east: !has(row, column + 1),
        south: !has(row + 1, column),
        west: !has(row, column - 1),
      },
    };
  });
}

/**
 * Kantenlaenge einer Zelle in Pixeln fuer den verfuegbaren Platz.
 *
 * In Achterschritten: das haelt Linien scharf und macht ein Viertel (die
 * Haelfte) ganzzahlig. Ein halbes Pixel dort liesse zwischen den Vierteln
 * einer verlegten Form eine Naht durchscheinen.
 */
export function boardCellPx(availableW: number, availableH: number, size: number): number {
  return Math.min(72, Math.max(24, Math.floor(Math.min(availableW, availableH) / size / 8) * 8));
}
