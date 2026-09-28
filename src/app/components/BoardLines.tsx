import { useMemo } from 'react';
import { columnOf, rowOf } from '@engine';

export interface BoardLinesProps {
  size: number;
  cellPx: number;
  /** Raum-Id je Zelle. Räume sind beliebig geformt, deshalb zellweise. */
  roomOfCell: Int32Array;
  /** Raum unter der Maus, oder `null`. Auf Touch-Geräten immer `null`. */
  hoverRoom: number | null;
}

/**
 * Dicke der Linien, gemessen am Feld statt fest in Pixeln.
 *
 * Eine feste Stärke wäre auf dem Handy zu zart und auf dem Schreibtisch zu
 * grob. Die Untergrenzen sorgen dafür, dass beide Linien auch auf dem kleinsten
 * Gitter (10×10 auf 360 px, Feld ≈ 32 px) noch als zwei verschiedene Stärken
 * lesbar sind — genau darauf kommt es an: die Raumgrenze muss sich vom
 * Feldraster **unterscheiden**, nicht nur vorhanden sein.
 */
export function wallWidth(cellPx: number): number {
  return Math.max(4, Math.round(cellPx * 0.1));
}

export function gridWidth(cellPx: number): number {
  return Math.max(1, Math.round(cellPx * 0.035));
}

/**
 * Abstand von der Zellkante, den Beschriftungen halten: Raumname, Buchstabe,
 * Notizen.
 *
 * Die Wand liegt mittig auf der Zellkante und ragt damit um ihre halbe Dicke
 * in die Zelle. Alles, was näher an der Kante sitzt, schneidet sie an. Der
 * Abstand gilt immer, nicht nur an Kanten mit Wand — sonst sprängen die
 * Buchstaben je nach Lage verschieden weit ein.
 */
export function wallInset(cellPx: number): number {
  return wallWidth(cellPx) / 2 + 2;
}

/**
 * Wie viele Zellen desselben Raumes ab `cell` nach rechts in dieser Zeile
 * liegen, `cell` eingeschlossen. So breit darf der Raumname werden, ohne über
 * eine Wand in den Nachbarraum zu laufen.
 */
export function labelRun(cell: number, roomOfCell: Int32Array, size: number): number {
  const room = roomOfCell[cell];
  let run = 1;
  // Spalte 0 heißt: die nächste Zelle liegt schon in der nächsten Zeile.
  while (cell + run < size * size && columnOf(cell + run, size) !== 0 && roomOfCell[cell + run] === room) run++;
  return run;
}

/**
 * Die Linien des Brettes: dünn zwischen Feldern, **dick um jeden Raum**.
 *
 * Raumgrenzen sind Spielinformation, keine Verzierung — fast jeder Hinweis
 * nimmt auf Räume Bezug („allein im Raum", „im selben Raum wie"). Wer die
 * Grenze nicht sieht, kann den Hinweis nicht anwenden.
 *
 * Deshalb sind die Grenzen **immer** sichtbar und nicht erst beim Darüberfahren:
 * auf dem Handy gibt es kein Schweben, und eine Information, die nur der Maus
 * zugänglich ist, fehlt der Hälfte der Spieler. Die farbige Hervorhebung beim
 * Schweben kommt am Schreibtisch obendrauf, sie ersetzt nichts.
 *
 * Alles in **einem** SVG statt als Schatten je Zelle: eine geteilte Kante wird
 * damit einmal gezeichnet und nicht zweimal halb, und die Strichstärke ist
 * genau die angegebene — bei Kachelschatten wäre sie an Raumgrenzen doppelt so
 * dick wie am Brettrand.
 */
export function BoardLines({ size, cellPx, roomOfCell, hoverRoom }: BoardLinesProps) {
  const boardPx = size * cellPx;
  const thick = wallWidth(cellPx);
  const thin = gridWidth(cellPx);

  const paths = useMemo(() => {
    const walls: string[] = [];
    const grid: string[] = [];

    // Je Zelle nur die obere und die linke Kante: so wird jede innere Kante
    // genau einmal gezeichnet. Der Brettrand ist unten ein eigenes Rechteck.
    for (let cell = 0; cell < size * size; cell++) {
      const room = roomOfCell[cell];
      const r = rowOf(cell, size);
      const c = columnOf(cell, size);
      const x = c * cellPx;
      const y = r * cellPx;

      if (r > 0) {
        const line = 'M' + String(x) + ' ' + String(y) + 'h' + String(cellPx);
        (roomOfCell[cell - size] === room ? grid : walls).push(line);
      }
      if (c > 0) {
        const line = 'M' + String(x) + ' ' + String(y) + 'v' + String(cellPx);
        (roomOfCell[cell - 1] === room ? grid : walls).push(line);
      }
    }

    return { walls: walls.join(''), grid: grid.join('') };
  }, [roomOfCell, size, cellPx]);

  /**
   * Grenze des Raumes unter der Maus, als eigener Zug über der schwarzen Linie.
   *
   * Am Brettrand um die halbe Strichstärke nach innen versetzt, genau wie der
   * schwarze Rand darunter — mittig auf der Kante läge die äußere Hälfte
   * außerhalb des Brettes und würde abgeschnitten.
   */
  const hovered = useMemo(() => {
    if (hoverRoom === null) return '';
    const half = thick / 2;
    const segments: string[] = [];
    for (let cell = 0; cell < size * size; cell++) {
      if (roomOfCell[cell] !== hoverRoom) continue;
      const r = rowOf(cell, size);
      const c = columnOf(cell, size);
      const x = c * cellPx;
      const y = r * cellPx;
      const top = r === 0 ? half : y;
      const bottom = r === size - 1 ? boardPx - half : y + cellPx;
      const left = c === 0 ? half : x;
      const right = c === size - 1 ? boardPx - half : x + cellPx;
      if (r === 0 || roomOfCell[cell - size] !== hoverRoom) segments.push('M' + String(x) + ' ' + String(top) + 'h' + String(cellPx));
      if (r === size - 1 || roomOfCell[cell + size] !== hoverRoom) segments.push('M' + String(x) + ' ' + String(bottom) + 'h' + String(cellPx));
      if (c === 0 || roomOfCell[cell - 1] !== hoverRoom) segments.push('M' + String(left) + ' ' + String(y) + 'v' + String(cellPx));
      if (c === size - 1 || roomOfCell[cell + 1] !== hoverRoom) segments.push('M' + String(right) + ' ' + String(y) + 'v' + String(cellPx));
    }
    return segments.join('');
  }, [hoverRoom, roomOfCell, size, cellPx, thick, boardPx]);

  return (
    <svg
      className="board-lines"
      width={boardPx}
      height={boardPx}
      viewBox={'0 0 ' + String(boardPx) + ' ' + String(boardPx)}
      aria-hidden="true"
      focusable="false"
    >
      <path className="line-grid" d={paths.grid} strokeWidth={thin} shapeRendering="crispEdges" />
      <path className="line-wall" d={paths.walls} strokeWidth={thick} />
      {/* Der Brettrand liegt halb innen, sonst schneidet ihn die Kante ab. */}
      <rect
        className="line-wall"
        x={thick / 2}
        y={thick / 2}
        width={boardPx - thick}
        height={boardPx - thick}
        strokeWidth={thick}
      />
      {hovered !== '' && <path className="line-hover" d={hovered} strokeWidth={thick} />}
    </svg>
  );
}
