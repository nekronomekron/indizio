import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { columnOf, rowOf } from '@indizio/puzzle';
import type { Cell, PuzzleCore } from '@indizio/puzzle';
import { Sprite } from '../render/Sprite.js';
import { artUrl } from '../render/art.js';
import { DEFAULT_FLOOR, floorFlip, floorFor } from '../render/floors.js';
import type { GameState } from '../state/game.js';
import { BoardLines } from './BoardLines.js';

export interface GridProps {
  core: PuzzleCore;
  state: GameState;
  cellPx: number;
  holdMs: number;
  roomLabels: Record<number, string>;
  /** Raum-Id je Zelle. Räume sind beliebig geformt, deshalb zellweise. */
  roomOfCell: Int32Array;
  /** 1 = gesperrt, dort darf niemand stehen (PLAN.md 3.2 Regel 3). */
  blocked: Uint8Array;
  onPlace: (cell: Cell) => void;
  onTap: (cell: Cell) => void;
  onPaint: (cell: Cell) => void;
  onMark: (cell: Cell) => void;
  /** Buchstabe je Verdaechtigem, nach Id abgelegt (siehe app/suspects.ts). */
  letters: readonly string[];
}

export function Grid(props: GridProps) {
  const {
    core, state, cellPx, holdMs, roomLabels, roomOfCell, blocked, letters,
    onPlace, onTap, onPaint, onMark,
  } = props;
  const size = core.size;
  const boardPx = size * cellPx;

  const holdTimer = useRef<number | null>(null);
  const held = useRef(false);
  const painting = useRef<Set<number>>(new Set());
  const pointerDown = useRef(false);
  const downCell = useRef<Cell | null>(null);
  const dragStarted = useRef(false);
  const deniedTimer = useRef<number | null>(null);
  const [denied, setDenied] = useState<Cell | null>(null);
  const [hoverRoom, setHoverRoom] = useState<number | null>(null);

  const isBlocked = (cell: Cell): boolean => blocked[cell] === 1;

  /** Kurze Rückmeldung, dass auf diesem Feld niemand stehen kann. */
  const refuse = useCallback((cell: Cell) => {
    setDenied(cell);
    if (deniedTimer.current !== null) window.clearTimeout(deniedTimer.current);
    deniedTimer.current = window.setTimeout(() => setDenied(null), 450);
  }, []);

  /**
   * Zelle unter dem Zeiger, über die Bildschirmkoordinaten bestimmt.
   *
   * Bewusst nicht über event.target: sobald der Zeiger eingefangen ist
   * (setPointerCapture), liefern alle Folgeereignisse den Container als Ziel,
   * nicht die Zelle darunter.
   */
  const cellFromPoint = (x: number, y: number): Cell | null => {
    const element = document.elementFromPoint(x, y)?.closest('[data-cell]');
    const raw = element?.getAttribute('data-cell');
    return raw === null || raw === undefined ? null : Number(raw);
  };

  const cancelHold = useCallback(() => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  useEffect(() => () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    if (deniedTimer.current !== null) window.clearTimeout(deniedTimer.current);
  }, []);

  const resetPointer = () => {
    pointerDown.current = false;
    held.current = false;
    dragStarted.current = false;
    downCell.current = null;
    painting.current = new Set();
  };

  const handleDown = (event: React.PointerEvent) => {
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (cell === null) return;
    if (isBlocked(cell)) { refuse(cell); return; }
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointerDown.current = true;
    held.current = false;
    dragStarted.current = false;
    downCell.current = cell;
    painting.current = new Set([cell]);
    cancelHold();
    holdTimer.current = window.setTimeout(() => {
      held.current = true;
      holdTimer.current = null;
      if (navigator.vibrate) navigator.vibrate(12);
      onPlace(cell);
    }, holdMs);
  };

  const handleMove = (event: React.PointerEvent) => {
    const cell = cellFromPoint(event.clientX, event.clientY);

    // Raumhervorhebung folgt der Maus, auch ohne gedrückte Taste.
    if (event.pointerType === 'mouse') {
      setHoverRoom(cell === null ? null : roomOfCell[cell]!);
    }

    if (!pointerDown.current) return;
    if (cell === null || painting.current.has(cell)) return;

    cancelHold();
    if (!dragStarted.current) {
      dragStarted.current = true;
      const start = downCell.current;
      // Das Startfeld gehört zum Strich dazu.
      if (start !== null && !held.current && !isBlocked(start)) onPaint(start);
    }
    painting.current.add(cell);
    if (!held.current && !isBlocked(cell)) onPaint(cell);
  };

  const handleUp = (event: React.PointerEvent) => {
    if (!pointerDown.current) { resetPointer(); return; }
    const cell = cellFromPoint(event.clientX, event.clientY) ?? downCell.current;
    const wasHeld = held.current;
    const dragged = dragStarted.current;
    cancelHold();
    if (!wasHeld && !dragged && cell !== null && !isBlocked(cell)) onTap(cell);
    resetPointer();
  };

  /**
   * Belag je Raum, aus dem Raumnamen abgeleitet, dazu die Bilddatei aus dem
   * Grafikset des Themes. Eine winzige Helligkeitsstufe je Raum haelt zwei
   * benachbarte Raeume mit demselben Belag auseinander.
   */
  const floors = useMemo(() => {
    const material = new Map<number, ReturnType<typeof floorFor>>();
    const image = new Map<number, string | undefined>();
    const shade = new Map<number, number>();
    core.rooms.forEach((room, i) => {
      const kind = floorFor(room.nameKey);
      material.set(room.id, kind);
      image.set(room.id, artUrl('floors', kind, core.themeKey) ?? artUrl('floors', DEFAULT_FLOOR, core.themeKey));
      shade.set(room.id, 1 + ((i % 3) - 1) * 0.06);
    });
    return { material, image, shade };
  }, [core.rooms, core.themeKey]);

  /** Beschriftung sitzt auf der obersten, linkesten Zelle des Raumes. */
  const labelSpots = useMemo(
    () => core.rooms.map((room) => ({ room, cell: Math.min(...room.cells) })),
    [core.rooms],
  );

  const noteSize = Math.max(8, Math.round(cellPx * 0.24));

  return (
    <div className="board" style={{ width: boardPx, height: boardPx }}>
      {/* Boden: eine Kachel je Zelle, damit jede Raumform trägt. */}
      <div className="floor" style={{ gridTemplateColumns: 'repeat(' + size + ', ' + cellPx + 'px)' }}>
        {Array.from({ length: size * size }, (_, cell) => {
          const room = roomOfCell[cell]!;
          const material = floors.material.get(room) ?? DEFAULT_FLOOR;
          const image = floors.image.get(room);
          // Gespiegelt, wo es die Kachel verträgt: eine einzige Datei sieht
          // sonst über ein ganzes Gitter hinweg nach Tapete aus.
          const flip = floorFlip(material, cell);
          return (
            <div
              key={cell}
              className={'tile' + (room === hoverRoom ? ' in-hovered' : '')}
              style={{
                width: cellPx,
                height: cellPx,
                backgroundImage: image === undefined ? undefined : 'url("' + image + '")',
                transform: flip.x === 1 && flip.y === 1 ? undefined : 'scale(' + String(flip.x) + ', ' + String(flip.y) + ')',
                ['--room-shade' as string]: floors.shade.get(room) ?? 1,
              }}
            />
          );
        })}
      </div>

      {/* Feldraster und Raumgrenzen, über dem Boden und unter den Figuren. */}
      <BoardLines size={size} cellPx={cellPx} roomOfCell={roomOfCell} hoverRoom={hoverRoom} />

      {labelSpots.map(({ room, cell }) => (
        <span
          key={room.id}
          className={'room-label' + (room.id === hoverRoom ? ' hovered' : '')}
          style={{ left: columnOf(cell, size) * cellPx + 4, top: rowOf(cell, size) * cellPx + 2 }}
        >
          {roomLabels[room.id]}
        </span>
      ))}

      {core.objects.map((obj) => {
        const rows = obj.cells.map((c) => rowOf(c, size));
        const cols = obj.cells.map((c) => columnOf(c, size));
        const r0 = Math.min(...rows);
        const c0 = Math.min(...cols);
        const w = Math.max(...cols) - c0 + 1;
        const h = Math.max(...rows) - r0 + 1;
        return (
          <div
            key={obj.id}
            className={'object' + (obj.walkable ? ' walkable' : ' blocking')}
            style={{ left: c0 * cellPx, top: r0 * cellPx, width: w * cellPx, height: h * cellPx }}
          >
            {/* Die Grafik fuellt ihre Grundflaeche: ein Tisch ueber drei
                Felder ist dreimal so breit wie hoch, nicht ein Quadrat in
                der Mitte. Die Datei dazu heisst `table_3x1`. */}
            <Sprite
              name={obj.key}
              theme={core.themeKey}
              footprint={[w, h]}
              width={w * cellPx}
              height={h * cellPx}
            />
          </div>
        );
      })}

      <div
        className="cells"
        style={{ gridTemplateColumns: 'repeat(' + size + ', ' + cellPx + 'px)' }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onPointerLeave={() => setHoverRoom(null)}
        onDoubleClick={(event) => {
          // Desktop-Kurzweg: Doppelklick platziert, ohne halten zu müssen.
          const cell = cellFromPoint(event.clientX, event.clientY);
          if (cell === null) return;
          if (isBlocked(cell)) { refuse(cell); return; }
          onPlace(cell);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          const cell = cellFromPoint(event.clientX, event.clientY);
          if (cell === null) return;
          if (isBlocked(cell)) { refuse(cell); return; }
          onMark(cell);
        }}
      >
        {Array.from({ length: size * size }, (_, cell) => {
          const placedId = state.placements.findIndex((c) => c === cell);
          const notes = state.notes[cell] ?? [];
          const marked = state.marks.includes(cell);
          const classes = ['cell'];
          if (state.hintCell === cell) classes.push('hint');
          if (isBlocked(cell)) classes.push('blocked');
          if (denied === cell) classes.push('denied');

          return (
            <div
              key={cell}
              data-cell={cell}
              className={classes.join(' ')}
              style={{ width: cellPx, height: cellPx }}
            >
              {placedId >= 0 && (
                <span className="placed">
                  <Sprite kind="characters" name={core.suspects[placedId]!.portraitKey} size={Math.round(cellPx * 0.86)} />
                  {/* Der Buchstabe der gewaehlten Person leuchtet auf - so
                      findet man sie auf dem Brett, ohne zu suchen. */}
                  <span className={'placed-letter' + (placedId === state.selected ? ' chosen' : '')}>
                    {letters[placedId] ?? '?'}
                  </span>
                </span>
              )}
              {placedId < 0 && marked && <Sprite kind="icons" name="ui-x" size={Math.round(cellPx * 0.5)} className="mark" />}
              {/* Bleistiftnotizen sitzen links oben und stehen auch neben einem X. */}
              {placedId < 0 && notes.length > 0 && (
                <span className="notes" style={{ fontSize: noteSize }}>
                  {notes.map((id) => (
                    <span key={id} className={'note' + (id === state.selected ? ' chosen' : '')}>
                      {letters[id] ?? '?'}
                    </span>
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
