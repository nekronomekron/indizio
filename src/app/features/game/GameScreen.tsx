import { useEffect, useMemo, useReducer, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { boardLayout, hintFor } from '@engine';
import type { Cell, PuzzleCore } from '@engine';
import { useClueTranslator } from '../../shared/i18n/useClueTranslator.js';
import { cardOrder, suspectLetters } from './suspects.js';
import { allPlaced, gameReducer, initialGame } from './gameReducer.js';
import type { GameSession } from './gameReducer.js';
import { markTutorialSeen, recordProgress, tutorialSeen } from '../../shared/storage/store.js';
import { loadSave, saveGame } from './gameStorage.js';
import { RulesDialog, Tutorial } from '../../shared/help/Help.js';
import { FOOTER_PX } from '../../shared/layout/Footer.js';
import { Grid } from './board/Grid.js';
import { SolvedDialog } from './SolvedDialog.js';
import { SuspectCard } from './SuspectCard.js';
import { Toolbar } from './Toolbar.js';
import { boardCellPx } from './board/tiles.js';
import { cx } from '../../shared/ui/cx.js';
import button from '../../shared/ui/button.module.css';
import text from '../../shared/ui/text.module.css';
import styles from './GameScreen.module.css';

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
}

export interface GameScreenProps {
  core: PuzzleCore;
  holdMs: number;
  vibrate: boolean;
  /** Show the names of a cell when resting on it — can be switched off in the settings. */
  names: boolean;
  onBack: () => void;
  onSettings: () => void;
}

/**
 * The saved game *is* the initial state — it is not handed in shortly after.
 *
 * Before, one effect loaded the save and a second wrote it back, separated by
 * an "already loaded" flag. That is a race: the writing effect sees the state
 * of the render that just finished, which on the first pass is still the empty
 * board. Measured in the browser, it overwrote the freshly loaded game before
 * it ever showed.
 *
 * As the initial state there is no race any more, and no flag either.
 */
function openSession(core: PuzzleCore): GameSession {
  const saved = loadSave(core);
  return {
    state: saved ? { ...saved, running: true, verdict: 'none' } : initialGame(core),
    history: [],
  };
}

export function GameScreen({
  core,
  holdMs,
  vibrate,
  names,
  onBack,
  onSettings,
}: GameScreenProps): ReactElement {
  const { t } = useTranslation();
  const translator = useClueTranslator();
  const layout = useMemo(() => boardLayout(core), [core]);
  const [session, dispatch] = useReducer(gameReducer, core, openSession);
  const { state } = session;
  const [showTutorial, setShowTutorial] = useState(() => !tutorialSeen());
  const [showRules, setShowRules] = useState(false);
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    // On mobile the visible area also changes without a resize, e.g. when the
    // address bar slides in or out.
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, []);

  // Saving is unconditional: the first write stores exactly what
  // `openSession` just read.
  useEffect(() => {
    saveGame(core.seed, state);
  }, [core.seed, state]);

  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: 'tick', ms: 1000 }), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Fit the grid into the available space, in steps of eight for sharp
  // pixels. Straight from the viewport rather than a measurement — predictable
  // and independent of when rendering happens. Whatever takes space below the
  // board has to be subtracted here: the footer knows its own height.
  const wide = viewport.w >= 900;
  const availableW = wide ? viewport.w - 300 - 72 : viewport.w - 28;
  const availableH = viewport.h - (wide ? 210 : 340) - FOOTER_PX;
  const cellPx = boardCellPx(availableW, availableH, core.size);

  // How suspects are shown: letter from the name, victim last. Both depend on
  // the people only, not on the game state.
  const letters = useMemo(() => suspectLetters(core.suspects), [core.suspects]);
  const cards = useMemo(() => cardOrder(core.suspects), [core.suspects]);

  const clues = useMemo(() => {
    const byOwner: Record<number, string> = {};
    const globals: string[] = [];
    for (const entry of core.clues) {
      const text = translator.render(core, entry);
      if (entry.ownerId === null) globals.push(text);
      else byOwner[entry.ownerId] = text;
    }
    return { byOwner, globals };
  }, [core, translator]);

  const roomLabels = useMemo(() => {
    const labels: Record<number, string> = {};
    for (const room of core.rooms) {
      const full = translator.roomName(core.themeKey, room.nameKey);
      // Drop the article, in either language: "the workshop" -> "workshop".
      const parts = full.split(' ');
      labels[room.id] = parts.length > 1 ? parts.slice(1).join(' ') : full;
    }
    return labels;
  }, [core.rooms, core.themeKey, translator]);

  /**
   * Bare name per prop — "shelf", not "next to a shelf".
   *
   * Clues name the props; the board used to show only a picture. Whoever could
   * not read the drawing could not check the clue — that was guessing pictures,
   * not deduction.
   */
  const objectLabels = useMemo(() => {
    const labels: Record<number, string> = {};
    for (const object of core.objects) labels[object.id] = translator.objectName(core.themeKey, object.key);
    return labels;
  }, [core.objects, core.themeKey, translator]);

  /** One person on or back — in the order of the card list. */
  const cycleSuspect = (delta: number) => {
    const index = cards.findIndex((suspect) => suspect.id === state.selected);
    const next = cards[(index + delta + cards.length) % cards.length];
    if (next) dispatch({ type: 'select', suspectId: next.id });
  };

  const onTap = (cell: Cell) => {
    if (state.tool === 'mark') dispatch({ type: 'mark', cell });
    else if (state.tool === 'erase') dispatch({ type: 'clearCell', cell });
    else dispatch({ type: 'note', cell });
  };

  const onCheck = () => {
    const correct = core.solution.every((cell, id) => state.placements[id] === cell);
    dispatch({ type: 'check', correct });
    if (correct)
      recordProgress(core.seed, { solved: true, bestMs: state.elapsedMs, hintsUsed: state.hintsUsed });
  };

  const onHint = () => {
    const hint = hintFor(core, state.placements);
    dispatch({
      type: 'hint',
      hint: hint
        ? { cell: hint.cell, suspectId: hint.suspectId, step: hint.step, totalSteps: hint.totalSteps }
        : { cell: null },
    });
  };

  const hintText = ((): string | null => {
    const hint = state.hint;
    if (!hint) return null;
    if (hint.cell === null) return t('noHintLeft');
    const name = core.suspects[hint.suspectId]?.name ?? '';
    return `${name} — ${clues.byOwner[hint.suspectId] ?? ''}  (${String(hint.step)}/${String(hint.totalSteps)})`;
  })();

  return (
    <div className={styles.game}>
      <header className={styles.head}>
        {/* On narrow devices only the arrow remains: with three labelled
            buttons the header wrapped and pushed the board out of view. */}
        <button
          type="button"
          className={cx(button.ghost, styles.headButton)}
          onClick={onBack}
          aria-label={t('back')}
        >
          &larr; <span className={styles.backLabel}>{t('back')}</span>
        </button>
        <h1>
          {translator.themeName(core.themeKey)}{' '}
          <span className={text.dim}>
            {core.size}&times;{core.size}
          </span>
        </h1>
        <div className={styles.headActions}>
          <button
            type="button"
            className={cx(button.ghost, styles.headButton)}
            onClick={() => setShowRules(true)}
          >
            {t('rules')}
          </button>
          <button type="button" className={cx(button.ghost, styles.headButton)} onClick={onSettings}>
            {t('settings')}
          </button>
          <span className={styles.timer}>{formatTime(state.elapsedMs)}</span>
        </div>
      </header>

      <div className={styles.body}>
        <section className={styles.suspects}>
          <h2>{t('suspects')}</h2>
          <p className={text.hintLine}>{t('suspectsHelp')}</p>
          <div className={styles.cardList}>
            {cards.map((suspect) => (
              <SuspectCard
                key={suspect.id}
                suspect={suspect}
                letter={letters[suspect.id] ?? '?'}
                clue={clues.byOwner[suspect.id] ?? ''}
                selected={state.selected === suspect.id}
                placed={state.placements[suspect.id] !== null}
                onSelect={() => dispatch({ type: 'select', suspectId: suspect.id })}
              />
            ))}
          </div>
          {clues.globals.length > 0 && (
            <div className={styles.globals}>
              {clues.globals.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
          )}
        </section>

        <section className={styles.boardArea}>
          <Grid
            core={core}
            state={state}
            cellPx={cellPx}
            holdMs={holdMs}
            vibrate={vibrate}
            roomLabels={roomLabels}
            objectLabels={objectLabels}
            suspectNames={core.suspects.map((suspect) => suspect.name)}
            names={names}
            occupiedLabel={t('occupied')}
            roomOfCell={layout.roomOfCell}
            blocked={layout.blocked}
            letters={letters}
            onPlace={(cell) => dispatch({ type: 'place', cell })}
            onTap={onTap}
            onPaint={(cell) => dispatch({ type: state.tool === 'mark' ? 'mark' : 'note', cell })}
            onMark={(cell) => dispatch({ type: 'mark', cell })}
            onNote={(cell) => dispatch({ type: 'note', cell })}
            onClear={(cell) => dispatch({ type: 'clearCell', cell })}
            onCycle={cycleSuspect}
            keyboardLabel={t('keyboardHelp')}
          />
          {/* Announced, not only shown: verdict and hint are the two places
              where the game answers. */}
          <div role="status" aria-live="polite">
            {hintText !== null && <p className={styles.hintBox}>{hintText}</p>}
            {state.verdict === 'wrong' && (
              <p className={styles.verdict}>
                <strong>{t('wrongTitle')}.</strong> {t('wrong')}
              </p>
            )}
          </div>
          <Toolbar
            tool={state.tool}
            canUndo={session.history.length > 0}
            canCheck={allPlaced(state)}
            onTool={(tool) => dispatch({ type: 'tool', tool })}
            onUndo={() => dispatch({ type: 'undo' })}
            onClearAll={() => dispatch({ type: 'clearAll' })}
            onHint={onHint}
            onCheck={onCheck}
          />
        </section>
      </div>

      {showTutorial && (
        <Tutorial
          onDone={() => {
            markTutorialSeen();
            setShowTutorial(false);
          }}
        />
      )}
      {showRules && <RulesDialog onClose={() => setShowRules(false)} />}

      {state.verdict === 'solved' && (
        <SolvedDialog core={core} elapsedMs={state.elapsedMs} hintsUsed={state.hintsUsed} onBack={onBack} />
      )}
    </div>
  );
}
