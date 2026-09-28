import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { columnOf, rowOf } from '@engine';
import type { Cell, PuzzleCore } from '@engine';
import { Sprite } from '../../../shared/art/Sprite.js';
import { TiledObject } from './TiledObject.js';
import { artUrl } from '../../../shared/art/art.js';
import { DEFAULT_FLOOR, floorFlip, floorFor } from '../../../shared/art/floors.js';
import type { GameState } from '../gameReducer.js';
import { moveCursor } from './keyboard.js';
import { describeCell, estimateTipWidth, tipSpot } from './cellInfo.js';
import { BoardLines, labelRun, wallInset } from './BoardLines.js';
import { cx } from '../../../shared/ui/cx.js';
import text from '../../../shared/ui/text.module.css';
import styles from './board.module.css';

/** How long the pointer rests on a cell before the tip appears. */
const TIP_DELAY = 250;

/** What the tip shows, and who asked for it. */
type TipSource = 'mouse' | 'touch' | 'keys';
interface Tip {
  cell: Cell;
  source: TipSource;
}

export interface GridProps {
  core: PuzzleCore;
  state: GameState;
  cellPx: number;
  holdMs: number;
  /** A short buzz when placing — can be switched off in the settings. */
  vibrate: boolean;
  roomLabels: Record<number, string>;
  /** Bare name per prop, by object id — "shelf", not "next to a shelf". */
  objectLabels: Record<number, string>;
  /** Name per suspect, by id. */
  suspectNames: readonly string[];
  /** Show names when resting on a cell — can be switched off in the settings. */
  names: boolean;
  /** Word for a blocked cell, in the language of the UI. */
  occupiedLabel: string;
  /** Room id per cell. Rooms may be any shape, hence per cell. */
  roomOfCell: Int32Array;
  /** 1 = blocked, nobody may stand there (PLAN.md §3.2, rule 3). */
  blocked: Uint8Array;
  onPlace: (cell: Cell) => void;
  onTap: (cell: Cell) => void;
  onPaint: (cell: Cell) => void;
  onMark: (cell: Cell) => void;
  /** Add or remove a note — for the keyboard, which knows no tools. */
  onNote: (cell: Cell) => void;
  /** Clear a cell. */
  onClear: (cell: Cell) => void;
  /** One person on or back in the list. */
  onCycle: (delta: number) => void;
  /** The key bindings as text, for screen readers. */
  keyboardLabel: string;
  /** Letter per suspect, by id (see ../suspects.ts). */
  letters: readonly string[];
}

export function Grid(props: GridProps): ReactElement {
  const {
    core,
    state,
    cellPx,
    holdMs,
    vibrate,
    roomLabels,
    objectLabels,
    suspectNames,
    names,
    occupiedLabel,
    roomOfCell,
    blocked,
    letters,
    onPlace,
    onTap,
    onPaint,
    onMark,
    onNote,
    onClear,
    onCycle,
    keyboardLabel,
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
  /**
   * The cell under the keyboard frame, and whether the board has focus.
   *
   * Two states, not one: the position *survives* losing focus. Whoever moves
   * to the toolbar and comes back finds the frame where they left it. When it
   * was reset, a flicker of focus was enough to send it back to the corner.
   */
  const [cursor, setCursor] = useState<Cell | null>(null);
  const [focused, setFocused] = useState(false);

  /**
   * The cell whose names are shown.
   *
   * Three ways in, one state: the mouse rests, the finger presses, the
   * keyboard moves. `source` comes along because the display depends on it —
   * a tip at the cell for mouse and keyboard, a bar along the board's edge
   * for the finger, which covers its own cell.
   */
  const [tip, setTip] = useState<Tip | null>(null);
  const tipTimer = useRef<number | null>(null);
  /** The cell a tip is coming for or already shown for — so it does not keep restarting. */
  const pendingTip = useRef<Cell | null>(null);

  const isBlocked = (cell: Cell): boolean => blocked[cell] === 1;

  const hideTip = useCallback(() => {
    if (tipTimer.current !== null) {
      window.clearTimeout(tipTimer.current);
      tipTimer.current = null;
    }
    pendingTip.current = null;
    setTip(null);
  }, []);

  /** Show at once: finger and keyboard do not wait. */
  const showTip = (cell: Cell, source: TipSource) => {
    if (!names) return;
    if (tipTimer.current !== null) {
      window.clearTimeout(tipTimer.current);
      tipTimer.current = null;
    }
    pendingTip.current = cell;
    setTip({ cell, source });
  };

  /**
   * Show after a pause, for the mouse.
   *
   * Without the pause a tip flashed up on every cell the pointer crossed; what
   * is meant is the cell it stops on. Staying on the same cell keeps the clock
   * running instead of restarting it — otherwise a trembling hand would keep
   * the tip from ever appearing.
   */
  const showTipSoon = (cell: Cell | null) => {
    if (!names) return;
    if (cell === null) {
      hideTip();
      return;
    }
    if (pendingTip.current === cell) return;
    hideTip();
    pendingTip.current = cell;
    tipTimer.current = window.setTimeout(() => {
      tipTimer.current = null;
      setTip({ cell, source: 'mouse' });
    }, TIP_DELAY);
  };

  /** Brief feedback that nobody can stand on this cell. */
  const refuse = useCallback((cell: Cell) => {
    setDenied(cell);
    if (deniedTimer.current !== null) window.clearTimeout(deniedTimer.current);
    deniedTimer.current = window.setTimeout(() => setDenied(null), 450);
  }, []);

  /**
   * The cell under the pointer, found from screen coordinates.
   *
   * Deliberately not event.target: once the pointer is captured
   * (setPointerCapture), every following event targets the container, not the
   * cell beneath.
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

  useEffect(
    () => () => {
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
      if (deniedTimer.current !== null) window.clearTimeout(deniedTimer.current);
      if (tipTimer.current !== null) window.clearTimeout(tipTimer.current);
    },
    [],
  );

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

    // Before bailing out for blocked cells: that is exactly where the prop's
    // name explains why the board refuses the person. The finger gets the bar
    // at once; the mouse drops the tip while its button is down.
    if (event.pointerType !== 'mouse') showTip(cell, 'touch');
    else if (!isBlocked(cell)) hideTip();

    if (isBlocked(cell)) {
      refuse(cell);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerDown.current = true;
    held.current = false;
    dragStarted.current = false;
    downCell.current = cell;
    painting.current = new Set([cell]);
    cancelHold();
    holdTimer.current = window.setTimeout(() => {
      held.current = true;
      holdTimer.current = null;
      // Safari has no vibrate(), whatever the DOM types claim.
      if (vibrate && 'vibrate' in navigator) navigator.vibrate(12);
      onPlace(cell);
    }, holdMs);
  };

  const handleMove = (event: React.PointerEvent) => {
    const cell = cellFromPoint(event.clientX, event.clientY);

    // The room highlight follows the mouse, button pressed or not.
    if (event.pointerType === 'mouse') {
      setHoverRoom(cell === null ? null : roomOfCell[cell]!);
      if (pointerDown.current) hideTip();
      else showTipSoon(cell);
    } else if (pointerDown.current && cell !== null) {
      // While dragging, you read along which room the stroke crosses.
      showTip(cell, 'touch');
    }

    if (!pointerDown.current) return;
    if (cell === null || painting.current.has(cell)) return;

    cancelHold();
    if (!dragStarted.current) {
      dragStarted.current = true;
      const start = downCell.current;
      // The starting cell belongs to the stroke.
      if (start !== null && !held.current && !isBlocked(start)) onPaint(start);
    }
    painting.current.add(cell);
    if (!held.current && !isBlocked(cell)) onPaint(cell);
  };

  const handleUp = (event: React.PointerEvent) => {
    if (!pointerDown.current) {
      resetPointer();
      return;
    }
    const cell = cellFromPoint(event.clientX, event.clientY) ?? downCell.current;
    const wasHeld = held.current;
    const dragged = dragStarted.current;
    cancelHold();
    if (!wasHeld && !dragged && cell !== null && !isBlocked(cell)) onTap(cell);
    resetPointer();

    // After release the tip may come back; for a finger the bar stays anyway,
    // so you can read what the finger was covering.
    if (event.pointerType === 'mouse') {
      pendingTip.current = null;
      showTipSoon(cell);
    }
  };

  /**
   * Playing by keyboard.
   *
   * Placing used to need a pointer: hold, double-click or right-click. Whoever
   * cannot use a mouse could not play at all — not with difficulty, not at all.
   *
   * The frame moves with the arrow keys, and every key does *one* thing: no
   * tool to switch and keep in mind. The board is a single tab stop; tabbing
   * through a hundred cells on a 10×10 would be worse than no keyboard at all.
   */
  const firstFreeCell = (): Cell => {
    const own = state.selected === null ? null : (state.placements[state.selected] ?? null);
    if (own !== null) return own;
    for (let cell = 0; cell < size * size; cell++) if (!isBlocked(cell)) return cell;
    return 0;
  };

  const handleKey = (event: React.KeyboardEvent) => {
    const at = cursor ?? firstFreeCell();

    // Movement first: only `moveCursor` knows where the edges are.
    const moved = moveCursor(at, event.key, size);
    let handled = moved !== null;

    switch (event.key) {
      case 'Enter':
      case ' ':
        if (isBlocked(at)) refuse(at);
        else onPlace(at);
        handled = true;
        break;
      case 'n':
      case 'N':
        if (!isBlocked(at)) onNote(at);
        handled = true;
        break;
      case 'x':
      case 'X':
        if (!isBlocked(at)) onMark(at);
        handled = true;
        break;
      case 'Delete':
      case 'Backspace':
        onClear(at);
        handled = true;
        break;
      case ',':
        onCycle(-1);
        handled = true;
        break;
      case '.':
        onCycle(1);
        handled = true;
        break;

      default:
        break;
    }

    // Only for keys we know: otherwise the board would swallow Tab, F5 and
    // everything else that belongs to the browser. An action moves the frame
    // too: whoever acts on a cell blindly should see afterwards which one.
    if (handled) {
      event.preventDefault();
      setCursor(moved ?? at);
      // No pause: a key press is intent, there is no accidental crossing. For
      // whoever cannot use a mouse, this is the only way to the names.
      showTip(moved ?? at, 'keys');
      // Not only on the focus event: the frame belongs to whoever presses
      // keys. Clicking the board with a mouse needs none — and in some
      // environments the focus event never arrives.
      setFocused(true);
    }
  };

  /**
   * Floor per room, from the theme, with its picture from the theme's
   * drawings. A tiny brightness step per room keeps two neighbouring rooms
   * with the same floor apart.
   */
  const floors = useMemo(() => {
    const material = new Map<number, ReturnType<typeof floorFor>>();
    const image = new Map<number, string | undefined>();
    const shade = new Map<number, number>();
    core.rooms.forEach((room, i) => {
      const kind = floorFor(core.themeKey, room.nameKey);
      material.set(room.id, kind);
      image.set(
        room.id,
        artUrl('floors', kind, core.themeKey) ?? artUrl('floors', DEFAULT_FLOOR, core.themeKey),
      );
      shade.set(room.id, 1 + ((i % 3) - 1) * 0.06);
    });
    return { material, image, shade };
  }, [core.rooms, core.themeKey]);

  /**
   * The label sits on the room's top-left cell and may only be as wide as
   * the room reaches in that row.
   */
  const labelSpots = useMemo(
    () =>
      core.rooms.map((room) => {
        const cell = Math.min(...room.cells);
        return { room, cell, run: labelRun(cell, roomOfCell, size) };
      }),
    [core.rooms, roomOfCell, size],
  );
  const labelCells = useMemo(() => new Set(labelSpots.map((spot) => spot.cell)), [labelSpots]);
  const inset = wallInset(cellPx);

  /**
   * Prop per cell, as a map cell → object id.
   *
   * Props span several cells (a table over three), but names are looked up
   * per cell. Inverting once is cheaper than searching every object for every
   * cell.
   */
  const objectOfCell = useMemo(() => {
    const map = new Map<number, number>();
    for (const object of core.objects) for (const cell of object.cells) map.set(cell, object.id);
    return map;
  }, [core.objects]);

  const noteSize = Math.max(8, Math.round(cellPx * 0.24));

  // Names of the cell under pointer, finger or frame. No hook: a string and
  // a position, both too cheap to be worth caching.
  const tipCell = names ? (tip?.cell ?? null) : null;
  const tipObject = tipCell === null ? undefined : objectOfCell.get(tipCell);
  const tipPerson = tipCell === null ? -1 : state.placements.findIndex((c) => c === tipCell);
  const tipText =
    tipCell === null
      ? ''
      : describeCell({
          room: roomLabels[roomOfCell[tipCell]!] ?? '',
          object: tipObject === undefined ? null : (objectLabels[tipObject] ?? null),
          person: tipPerson < 0 ? null : (suspectNames[tipPerson] ?? null),
          blocked: isBlocked(tipCell),
          occupied: occupiedLabel,
        });
  const tipAt =
    tipCell === null || tipText.length === 0
      ? null
      : tipSpot(tipCell, size, cellPx, Math.min(boardPx, estimateTipWidth(tipText)));

  return (
    <div
      className={styles.board}
      style={{ width: boardPx, height: boardPx, ['--wall-inset' as string]: String(inset) + 'px' }}
    >
      {/* Floor: one tile per cell, so any room shape works. */}
      <div className={styles.floor} style={{ gridTemplateColumns: 'repeat(' + size + ', ' + cellPx + 'px)' }}>
        {Array.from({ length: size * size }, (_, cell) => {
          const room = roomOfCell[cell]!;
          const material = floors.material.get(room) ?? DEFAULT_FLOOR;
          const image = floors.image.get(room);
          // Mirrored where the tile allows it: a single file repeated over a
          // whole grid looks like wallpaper.
          const flip = floorFlip(material, cell);
          return (
            <div
              key={cell}
              className={cx(styles.floorTile, room === hoverRoom && styles.inHovered)}
              style={{
                width: cellPx,
                height: cellPx,
                backgroundImage: image === undefined ? undefined : 'url("' + image + '")',
                transform:
                  flip.x === 1 && flip.y === 1
                    ? undefined
                    : 'scale(' + String(flip.x) + ', ' + String(flip.y) + ')',
                ['--room-shade' as string]: floors.shade.get(room) ?? 1,
              }}
            />
          );
        })}
      </div>

      {/* Cell grid and room borders, above the floor and below the people. */}
      <BoardLines size={size} cellPx={cellPx} roomOfCell={roomOfCell} hoverRoom={hoverRoom} />

      {labelSpots.map(({ room, cell, run }) => (
        <span
          key={room.id}
          className={cx(styles.roomLabel, room.id === hoverRoom && styles.hovered)}
          style={{
            left: columnOf(cell, size) * cellPx + inset,
            top: rowOf(cell, size) * cellPx + inset,
            maxWidth: run * cellPx - 2 * inset,
          }}
        >
          {roomLabels[room.id]}
        </span>
      ))}

      {core.objects.map((obj) => {
        if (obj.placement === 'tiled') {
          return <TiledObject key={obj.id} object={obj} size={size} cellPx={cellPx} theme={core.themeKey} />;
        }
        const rows = obj.cells.map((c) => rowOf(c, size));
        const cols = obj.cells.map((c) => columnOf(c, size));
        const r0 = Math.min(...rows);
        const c0 = Math.min(...cols);
        const w = Math.max(...cols) - c0 + 1;
        const h = Math.max(...rows) - r0 + 1;
        return (
          <div
            key={obj.id}
            className={cx(styles.object, obj.walkable ? styles.walkable : styles.blocking)}
            style={{ left: c0 * cellPx, top: r0 * cellPx, width: w * cellPx, height: h * cellPx }}
          >
            {/* The drawing fills its footprint: a table over three cells is
                three times as wide as high, not a square in the middle. Its
                file is `table_3x1`. */}
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

      {/* The board is one composite widget with its own keyboard model (PLAN.md
          §8.3): role="application" is the honest description, which the a11y
          plugin does not count as interactive. */}
      {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div
        className={styles.cells}
        style={{ gridTemplateColumns: 'repeat(' + size + ', ' + cellPx + 'px)' }}
        tabIndex={0}
        role="application"
        aria-label={keyboardLabel}
        onKeyDown={handleKey}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (tip?.source === 'keys') hideTip();
        }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onPointerLeave={(event) => {
          setHoverRoom(null);
          // Only a mouse really leaves the board. For a finger the browser
          // reports the same event on lifting it — then the bar should stay,
          // so you can read what it was covering.
          if (event.pointerType === 'mouse') hideTip();
        }}
        onDoubleClick={(event) => {
          // Desktop shortcut: double-click places without holding.
          const cell = cellFromPoint(event.clientX, event.clientY);
          if (cell === null) return;
          if (isBlocked(cell)) {
            refuse(cell);
            return;
          }
          onPlace(cell);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          const cell = cellFromPoint(event.clientX, event.clientY);
          if (cell === null) return;
          if (isBlocked(cell)) {
            refuse(cell);
            return;
          }
          onMark(cell);
        }}
      >
        {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
        {Array.from({ length: size * size }, (_, cell) => {
          const placedId = state.placements.findIndex((c) => c === cell);
          const notes = state.notes[cell] ?? [];
          const marked = state.marks.includes(cell);
          const className = cx(
            styles.cell,
            state.hint?.cell === cell && styles.hint,
            focused && cursor === cell && styles.cursor,
            isBlocked(cell) && styles.blocked,
            denied === cell && styles.denied,
          );

          return (
            <div key={cell} data-cell={cell} className={className} style={{ width: cellPx, height: cellPx }}>
              {placedId >= 0 && (
                <span className={styles.placed}>
                  <Sprite
                    kind="characters"
                    name={core.suspects[placedId]!.portraitKey}
                    size={Math.round(cellPx * 0.86)}
                  />
                  {/* The selected person's letter lights up — so you find
                      them on the board without searching. */}
                  <span className={cx(styles.placedLetter, placedId === state.selected && styles.chosen)}>
                    {letters[placedId] ?? '?'}
                  </span>
                </span>
              )}
              {placedId < 0 && marked && (
                <Sprite kind="icons" name="ui-x" size={Math.round(cellPx * 0.5)} className={styles.mark} />
              )}
              {/* Pencil notes sit top left, next to an X too. Where the room
                  name is, they start below its sign. */}
              {placedId < 0 && notes.length > 0 && (
                <span
                  className={cx(styles.notes, labelCells.has(cell) && styles.belowLabel)}
                  style={{ fontSize: noteSize }}
                >
                  {notes.map((id) => (
                    <span key={id} className={cx(styles.note, id === state.selected && styles.chosen)}>
                      {letters[id] ?? '?'}
                    </span>
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* The cell's names. Both live *inside* the board: its clipping keeps
          floor and borders in shape, and a bar below the board would have cost
          height the board itself needs. */}
      {tipAt !== null && tip !== null && tip.source === 'touch' && (
        // At the top edge when the finger is in the bottom row: on a 10×10 a
        // cell is under 34 pixels high, and the bar would cover exactly the
        // cell it talks about.
        <div className={cx(styles.bar, rowOf(tip.cell, size) === size - 1 && styles.top)}>{tipText}</div>
      )}
      {tipAt !== null && tip !== null && tip.source !== 'touch' && (
        <div
          className={cx(styles.tip, tipAt.below && styles.below)}
          style={{ left: tipAt.left, top: tipAt.top, maxWidth: boardPx }}
        >
          {tipText}
        </div>
      )}

      {/* Only keyboard use is read aloud. With a mouse a screen reader would
          talk constantly while the eye is already elsewhere. The region is
          always there, so it is ready when the first text arrives. */}
      <span className={text.srOnly} role="status">
        {tip?.source === 'keys' ? tipText : ''}
      </span>
    </div>
  );
}
