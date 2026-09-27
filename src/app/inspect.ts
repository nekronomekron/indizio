import { columnOf, rowOf } from '@engine';
import type { Cell } from '@engine';

/**
 * Was auf einem Feld zu sehen ist, als Text — und wo die Sprechblase dazu hängt.
 *
 * Beides steht hier und nicht im Gitter, weil beides ohne DOM prüfbar ist: die
 * Textform hat eine Reihenfolge und Lücken, die Blase hat Ränder. Am Rand wohnt
 * der Fehler um eins, und die Reihenfolge merkt man erst, wenn sie falsch ist.
 */

/** Mittelpunkt statt Komma: die Teile sind gleichrangig, keine Aufzählung. */
const SEPARATOR = ' · ';

export interface CellFacts {
  /** Raumname ohne Artikel, wie die Beschriftung auf dem Brett. */
  room: string;
  /** Requisite auf diesem Feld, falls eine darauf steht. */
  object: string | null;
  /** Person, die der Spieler hier platziert hat. */
  person: string | null;
  /** Gesperrt: hier kann niemand stehen (PLAN.md 3.2 Regel 3). */
  blocked: boolean;
  /** Wort für „gesperrt", aus der Sprache der Oberfläche. */
  occupied: string;
}

/**
 * Eine Zeile: Raum, dann Gegenstand, dann Person.
 *
 * Vom Groben zum Feinen, damit der Blick nicht springt, und fehlende Teile
 * fallen einfach weg — ein leeres Feld nennt nur seinen Raum. Gesperrte Felder
 * enden auf das Wort für „gesperrt": genau dort erklärt der Name des
 * Gegenstands, warum das Brett die Person abweist. Person und Sperre schließen
 * sich aus, auf einem gesperrten Feld steht nie jemand.
 */
export function describeCell(facts: CellFacts): string {
  const last = facts.person ?? (facts.blocked ? facts.occupied : null);
  return [facts.room, facts.object, last]
    .filter((part): part is string => part !== null && part.length > 0)
    .join(SEPARATOR);
}

/** Höhe einer einzeiligen Blase samt Innenabstand, und ihr Abstand zum Feld. */
const TIP_HEIGHT = 22;
const TIP_GAP = 4;
/** Breite je Zeichen und Innenabstand, für die Schätzung unten. */
const TIP_CHAR = 7;
const TIP_PAD = 14;

/**
 * Breite der Blase, geschätzt aus der Zeichenzahl.
 *
 * Geschätzt und nicht gemessen: eine Messung nach dem Rendern macht die
 * Platzierung vom Renderzeitpunkt abhängig, und das Brett rechnet auch seine
 * Zellgröße vorher aus statt sie hinterher abzulesen. Für einen Tooltip reicht
 * es, dass er nicht aus dem Brett fällt; ein paar Pixel Versatz zur Mitte
 * bemerkt niemand.
 */
export function estimateTipWidth(text: string): number {
  return text.length * TIP_CHAR + TIP_PAD;
}

export interface TipSpot {
  left: number;
  top: number;
  /** Blase hängt unter dem Feld statt darüber. */
  below: boolean;
}

/**
 * Ort der Blase im Brett, in Bildpunkten vom linken oberen Brettrand.
 *
 * Über dem Feld und mittig, denn der Zeiger oder der Finger liegt auf dem Feld
 * selbst. In der obersten Reihe kippt sie darunter, und an den Seiten schiebt
 * sie sich nach innen — das Brett schneidet ab (`overflow: hidden`), eine Blase
 * am Rand wäre sonst halb weg. Breiter als das Brett kann sie nicht werden;
 * dann steht sie eben links an.
 */
export function tipSpot(cell: Cell, size: number, cellPx: number, width: number): TipSpot {
  const boardPx = size * cellPx;
  const row = rowOf(cell, size);
  const column = columnOf(cell, size);

  const centre = column * cellPx + cellPx / 2;
  const left = Math.max(0, Math.min(centre - width / 2, boardPx - width));

  const above = row * cellPx - TIP_HEIGHT - TIP_GAP;
  const below = above < 0;
  const top = below ? row * cellPx + cellPx + TIP_GAP : above;

  return { left: Math.round(left), top: Math.round(top), below };
}
