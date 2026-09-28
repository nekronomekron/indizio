import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { columnOf, rowOf } from '@engine';
import type { Cell, PuzzleCore } from '@engine';
import { Sprite } from '../render/Sprite.js';
import { TiledObject } from '../render/TiledObject.js';
import { artUrl } from '../render/art.js';
import { DEFAULT_FLOOR, floorFlip, floorFor } from '../render/floors.js';
import type { GameState } from '../state/game.js';
import { moveCursor } from '../keys.js';
import { describeCell, estimateTipWidth, tipSpot } from '../inspect.js';
import { BoardLines, labelRun, wallInset } from './BoardLines.js';

/** Ruhe auf einem Feld, bis die Sprechblase kommt. */
const TIP_DELAY = 250;

/** Was die Blase gerade zeigt, und wer sie aufgerufen hat. */
type TipSource = 'mouse' | 'touch' | 'keys';
interface Tip { cell: Cell; source: TipSource }

export interface GridProps {
  core: PuzzleCore;
  state: GameState;
  cellPx: number;
  holdMs: number;
  /** Kurzes Ruetteln beim Platzieren - abschaltbar in den Einstellungen. */
  vibrate: boolean;
  roomLabels: Record<number, string>;
  /** Bloßer Name je Requisite, nach Objekt-Id — „Regal", nicht „an einem Regal". */
  objectLabels: Record<number, string>;
  /** Name je Verdächtigem, nach Id. */
  suspectNames: readonly string[];
  /** Namen beim Verweilen zeigen - abschaltbar in den Einstellungen. */
  names: boolean;
  /** Wort für ein gesperrtes Feld, in der Sprache der Oberfläche. */
  occupiedLabel: string;
  /** Raum-Id je Zelle. Räume sind beliebig geformt, deshalb zellweise. */
  roomOfCell: Int32Array;
  /** 1 = gesperrt, dort darf niemand stehen (PLAN.md 3.2 Regel 3). */
  blocked: Uint8Array;
  onPlace: (cell: Cell) => void;
  onTap: (cell: Cell) => void;
  onPaint: (cell: Cell) => void;
  onMark: (cell: Cell) => void;
  /** Notiz setzen oder entfernen - fuer die Tastatur, die kein Werkzeug kennt. */
  onNote: (cell: Cell) => void;
  /** Feld leeren. */
  onClear: (cell: Cell) => void;
  /** Eine Person weiter oder zurueck in der Liste. */
  onCycle: (delta: number) => void;
  /** Tastenbelegung als Text, fuer Vorleseprogramme. */
  keyboardLabel: string;
  /** Buchstabe je Verdaechtigem, nach Id abgelegt (siehe app/suspects.ts). */
  letters: readonly string[];
}

export function Grid(props: GridProps) {
  const {
    core, state, cellPx, holdMs, vibrate, roomLabels, objectLabels, suspectNames, names,
    occupiedLabel, roomOfCell, blocked, letters,
    onPlace, onTap, onPaint, onMark, onNote, onClear, onCycle, keyboardLabel,
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
   * Feld unter dem Tastaturrahmen, und ob das Brett gerade den Fokus hat.
   *
   * Zwei Zustaende und nicht einer: die Position **ueberlebt** den Fokusverlust.
   * Wer zur Werkzeugleiste wechselt und zurueckkommt, findet den Rahmen dort,
   * wo er ihn gelassen hat. Beim Verwerfen genuegte ein Flackern des Fokus, und
   * er stand wieder in der Ecke.
   */
  const [cursor, setCursor] = useState<Cell | null>(null);
  const [focused, setFocused] = useState(false);

  /**
   * Feld, dessen Namen gerade zu lesen sind.
   *
   * Drei Zugänge, ein Zustand: die Maus verweilt, der Finger drückt, die
   * Tastatur wandert. `source` steht dabei, weil die Darstellung davon abhängt
   * — Blase am Feld für Maus und Tastatur, Leiste am Brettrand für den Finger,
   * der sein eigenes Feld verdeckt.
   */
  const [tip, setTip] = useState<Tip | null>(null);
  const tipTimer = useRef<number | null>(null);
  /** Feld, für das eine Blase kommt oder schon steht - gegen dauerndes Neustarten. */
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

  /** Sofort zeigen: Finger und Tastatur warten nicht. */
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
   * Verzögert zeigen, für die Maus.
   *
   * Ohne Verzögerung blinkte beim Überfahren des Bretts auf jedem Feld eine
   * Blase auf; gemeint ist aber das Feld, auf dem der Zeiger stehen bleibt.
   * Bleibt er auf demselben Feld, läuft die Uhr weiter statt neu anzufangen —
   * sonst genügte ein Zittern der Hand, und die Blase käme nie.
   */
  const showTipSoon = (cell: Cell | null) => {
    if (!names) return;
    if (cell === null) { hideTip(); return; }
    if (pendingTip.current === cell) return;
    hideTip();
    pendingTip.current = cell;
    tipTimer.current = window.setTimeout(() => {
      tipTimer.current = null;
      setTip({ cell, source: 'mouse' });
    }, TIP_DELAY);
  };

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
    if (tipTimer.current !== null) window.clearTimeout(tipTimer.current);
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

    // Vor dem Ausstieg für gesperrte Felder: genau dort erklärt der Name des
    // Gegenstands, warum das Brett die Person abweist. Der Finger bekommt die
    // Leiste sofort, die Maus lässt die Blase los, solange sie gedrückt ist.
    if (event.pointerType !== 'mouse') showTip(cell, 'touch');
    else if (!isBlocked(cell)) hideTip();

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
      if (vibrate && navigator.vibrate) navigator.vibrate(12);
      onPlace(cell);
    }, holdMs);
  };

  const handleMove = (event: React.PointerEvent) => {
    const cell = cellFromPoint(event.clientX, event.clientY);

    // Raumhervorhebung folgt der Maus, auch ohne gedrückte Taste.
    if (event.pointerType === 'mouse') {
      setHoverRoom(cell === null ? null : roomOfCell[cell]!);
      if (pointerDown.current) hideTip(); else showTipSoon(cell);
    } else if (pointerDown.current && cell !== null) {
      // Beim Ziehen liest man mit, über welchen Raum der Strich läuft.
      showTip(cell, 'touch');
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

    // Nach dem Loslassen darf die Blase zurückkommen; beim Finger bleibt die
    // Leiste ohnehin stehen, damit man lesen kann, was der Finger verdeckte.
    if (event.pointerType === 'mouse') {
      pendingTip.current = null;
      showTipSoon(cell);
    }
  };

  /**
   * Bedienung mit der Tastatur.
   *
   * Platzieren ging bisher nur mit einem Zeiger: halten, doppelklicken oder
   * rechtsklicken. Wer keine Maus benutzen kann, konnte das Spiel damit nicht
   * spielen — nicht schwer, sondern gar nicht.
   *
   * Der Rahmen wandert mit den Pfeiltasten, und jede Taste tut **eine** Sache:
   * kein Werkzeug, das man umschalten und im Kopf behalten muss. Das Brett ist
   * ein einziger Tabstopp; hundert Felder einzeln anzuspringen wäre auf einem
   * 10×10 schlimmer als gar keine Tastaturbedienung.
   */
  const firstFreeCell = (): Cell => {
    const own = state.selected === null ? null : state.placements[state.selected] ?? null;
    if (own !== null) return own;
    for (let cell = 0; cell < size * size; cell++) if (!isBlocked(cell)) return cell;
    return 0;
  };

  const handleKey = (event: React.KeyboardEvent) => {
    const at = cursor ?? firstFreeCell();

    // Bewegung zuerst: `moveCursor` weiss als Einziges, wo die Raender sind.
    const moved = moveCursor(at, event.key, size);
    let handled = moved !== null;

    switch (event.key) {
      case 'Enter':
      case ' ':
        if (isBlocked(at)) refuse(at); else onPlace(at);
        handled = true;
        break;
      case 'n': case 'N': if (!isBlocked(at)) onNote(at); handled = true; break;
      case 'x': case 'X': if (!isBlocked(at)) onMark(at); handled = true; break;
      case 'Delete': case 'Backspace': onClear(at); handled = true; break;
      case ',': onCycle(-1); handled = true; break;
      case '.': onCycle(1); handled = true; break;

      default: break;
    }

    // Nur fuer erkannte Tasten: sonst schluckte das Brett Tab, F5 und alles
    // andere, was dem Browser gehoert. Auch eine Handlung setzt den Rahmen:
    // wer blind auf einem Feld etwas tut, soll danach sehen, auf welchem.
    if (handled) {
      event.preventDefault();
      setCursor(moved ?? at);
      // Ohne Verzögerung: ein Tastendruck ist eine Absicht, da gibt es kein
      // versehentliches Überfahren. Für wen die Maus nicht in Frage kommt, ist
      // das der einzige Weg zu den Namen.
      showTip(moved ?? at, 'keys');
      // Nicht erst beim Fokusereignis: der Rahmen gehoert dem, der Tasten
      // drueckt. Wer mit der Maus aufs Brett klickt, braucht ihn nicht - und
      // in manchen Umgebungen kommt das Fokusereignis ueberhaupt nicht an.
      setFocused(true);
    }
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

  /**
   * Beschriftung sitzt auf der obersten, linkesten Zelle des Raumes und darf
   * nur so breit werden, wie der Raum in dieser Zeile reicht.
   */
  const labelSpots = useMemo(
    () => core.rooms.map((room) => {
      const cell = Math.min(...room.cells);
      return { room, cell, run: labelRun(cell, roomOfCell, size) };
    }),
    [core.rooms, roomOfCell, size],
  );
  const labelCells = useMemo(() => new Set(labelSpots.map((spot) => spot.cell)), [labelSpots]);
  const inset = wallInset(cellPx);

  /**
   * Requisite je Zelle, als Zuordnung Zelle → Objekt-Id.
   *
   * Requisiten liegen über mehrere Felder (ein Tisch über drei), die Namen
   * werden aber feldweise nachgesehen. Einmal umdrehen ist billiger, als für
   * jedes Feld alle Objekte durchzusehen.
   */
  const objectOfCell = useMemo(() => {
    const map = new Map<number, number>();
    for (const object of core.objects) for (const cell of object.cells) map.set(cell, object.id);
    return map;
  }, [core.objects]);

  const noteSize = Math.max(8, Math.round(cellPx * 0.24));

  // Namen des Feldes unter Zeiger, Finger oder Rahmen. Ohne Hook: eine
  // Zeichenkette und ein Ort, beides zu billig für einen Zwischenspeicher.
  const tipCell = names ? tip?.cell ?? null : null;
  const tipObject = tipCell === null ? undefined : objectOfCell.get(tipCell);
  const tipPerson = tipCell === null ? -1 : state.placements.findIndex((c) => c === tipCell);
  const tipText = tipCell === null ? '' : describeCell({
    room: roomLabels[roomOfCell[tipCell]!] ?? '',
    object: tipObject === undefined ? null : objectLabels[tipObject] ?? null,
    person: tipPerson < 0 ? null : suspectNames[tipPerson] ?? null,
    blocked: isBlocked(tipCell),
    occupied: occupiedLabel,
  });
  const tipAt = tipCell === null || tipText.length === 0
    ? null
    : tipSpot(tipCell, size, cellPx, Math.min(boardPx, estimateTipWidth(tipText)));

  return (
    <div className="board" style={{ width: boardPx, height: boardPx, ['--wall-inset' as string]: String(inset) + 'px' }}>
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

      {labelSpots.map(({ room, cell, run }) => (
        <span
          key={room.id}
          className={'room-label' + (room.id === hoverRoom ? ' hovered' : '')}
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
        tabIndex={0}
        role="application"
        aria-label={keyboardLabel}
        onKeyDown={handleKey}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); if (tip?.source === 'keys') hideTip(); }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onPointerLeave={(event) => {
          setHoverRoom(null);
          // Nur die Maus verlässt das Brett wirklich. Beim Finger meldet der
          // Browser dasselbe Ereignis, wenn er abgehoben wird - dann soll die
          // Leiste stehen bleiben, damit man lesen kann, was er verdeckte.
          if (event.pointerType === 'mouse') hideTip();
        }}
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
          if (focused && cursor === cell) classes.push('cursor');
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
              {/* Bleistiftnotizen sitzen links oben und stehen auch neben einem X.
                  Wo der Raumname steht, beginnen sie unter seinem Schild. */}
              {placedId < 0 && notes.length > 0 && (
                <span className={'notes' + (labelCells.has(cell) ? ' below-label' : '')} style={{ fontSize: noteSize }}>
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

      {/* Die Namen des Feldes. Beides liegt **im** Brett: sein Zuschnitt haelt
          Boden und Raumgrenzen in Form, und eine Leiste unter dem Brett haette
          Hoehe gekostet, die das Brett selbst braucht. */}
      {tipAt !== null && tip !== null && tip.source === 'touch' && (
        // Am oberen Rand, wenn der Finger in der untersten Reihe liegt: auf
        // einem 10x10 ist ein Feld keine 34 Bildpunkte hoch, die Leiste
        // verdeckte sonst genau das Feld, von dem sie erzaehlt.
        <div className={'cell-bar' + (rowOf(tip.cell, size) === size - 1 ? ' top' : '')}>{tipText}</div>
      )}
      {tipAt !== null && tip !== null && tip.source !== 'touch' && (
        <div
          className={'cell-tip' + (tipAt.below ? ' below' : '')}
          style={{ left: tipAt.left, top: tipAt.top, maxWidth: boardPx }}
        >
          {tipText}
        </div>
      )}

      {/* Vorgelesen wird nur die Tastaturbedienung. Bei der Maus redete ein
          Vorleseprogramm sonst durchgehend mit, waehrend der Blick schon
          woanders ist. Die Region steht immer da, damit sie bereit ist, wenn
          der erste Text kommt. */}
      <span className="sr-only" role="status">
        {tip?.source === 'keys' ? tipText : ''}
      </span>
    </div>
  );
}
