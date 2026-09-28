import { columnOf, rowOf } from '@engine';
import type { Cell } from '@engine';

/**
 * Wohin der Tastaturrahmen von hier aus wandert.
 *
 * Steht als eigene Funktion da, weil das Anstoßen an den Rändern genau die
 * Stelle ist, an der ein Fehler um eins wohnt — und weil die Bedienung im Test
 * sonst gar nicht vorkäme: ein Tastendruck im Gitter lässt sich ohne DOM nicht
 * nachstellen, diese Rechnung schon.
 *
 * Gibt `null` zurück, wenn die Taste keine Bewegung ist. Am Rand bleibt der
 * Rahmen stehen, statt in die nächste Zeile zu springen: ein Gitter ist keine
 * Textzeile, und wer nach rechts hält, will nicht plötzlich eine Zeile tiefer
 * ganz links stehen.
 */
export function moveCursor(at: Cell, key: string, size: number): Cell | null {
  const row = rowOf(at, size);
  const column = columnOf(at, size);

  switch (key) {
    case 'ArrowLeft':
      return column > 0 ? at - 1 : at;
    case 'ArrowRight':
      return column < size - 1 ? at + 1 : at;
    case 'ArrowUp':
      return row > 0 ? at - size : at;
    case 'ArrowDown':
      return row < size - 1 ? at + size : at;
    case 'Home':
      return at - column;
    case 'End':
      return at - column + size - 1;
    default:
      return null;
  }
}
