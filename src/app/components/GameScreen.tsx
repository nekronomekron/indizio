import { useEffect, useMemo, useReducer, useState } from 'react';
import { boardLayout, hintFor } from '@indizio/puzzle';
import type { Cell, PuzzleCore } from '@indizio/puzzle';
import { createClueTranslator, type Locale } from '@indizio/puzzle/i18n';
import { t } from '../i18n.js';
import { cardOrder, suspectLetters } from '../suspects.js';
import { allPlaced, gameReducer, initialGame } from '../state/game.js';
import { loadSave, markTutorialSeen, recordProgress, saveGame, tutorialSeen } from '../storage/store.js';
import { RulesDialog, Tutorial } from './Help.js';
import { FOOTER_PX } from './Footer.js';
import { Grid } from './Grid.js';
import { Solved } from './Solved.js';
import { SuspectCard } from './SuspectCard.js';
import { Toolbar } from './Toolbar.js';


function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
}

export interface GameScreenProps {
  core: PuzzleCore;
  locale: Locale;
  holdMs: number;
  onBack: () => void;
}

export function GameScreen({ core, locale, holdMs, onBack }: GameScreenProps) {
  const translator = useMemo(() => createClueTranslator({ locale }), [locale]);
  const layout = useMemo(() => boardLayout(core), [core]);
  const [session, dispatch] = useReducer(gameReducer, { state: initialGame(core), history: [] });
  const { state } = session;
  const [restored, setRestored] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => !tutorialSeen());
  const [showRules, setShowRules] = useState(false);
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    // Auf Mobilgeraeten aendert sich die sichtbare Flaeche auch ohne resize,
    // etwa wenn die Adressleiste ein- oder ausfaehrt.
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    const saved = loadSave(core.seed);
    if (saved && saved.placements.length === core.suspects.length) {
      dispatch({ type: 'restore', state: { ...saved, running: true, verdict: 'none' } });
    }
    setRestored(true);
  }, [core.seed, core.suspects.length]);

  useEffect(() => {
    if (restored) saveGame(core.seed, state);
  }, [core.seed, state, restored]);

  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: 'tick', ms: 1000 }), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Gitter auf den verfuegbaren Platz rechnen, in Achterschritten fuer scharfe
  // Pixel. Direkt aus dem Viewport statt ueber eine Messung - vorhersagbar und
  // ohne Abhaengigkeit vom Renderzeitpunkt. Was unter dem Brett Platz belegt,
  // muss deshalb hier abgezogen werden: die Fusszeile weiss selbst, wie hoch
  // sie ist.
  const wide = viewport.w >= 900;
  const availableW = wide ? viewport.w - 300 - 72 : viewport.w - 28;
  const availableH = viewport.h - (wide ? 210 : 340) - FOOTER_PX;
  const cellPx = Math.min(72, Math.max(24, Math.floor(Math.min(availableW, availableH) / core.size / 8) * 8));

  // Darstellung der Verdaechtigen: Buchstabe aus dem Namen, Opfer zuletzt.
  // Beides haengt nur an den Personen, nicht am Spielstand.
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
      const full = translator.roomName(room.nameKey);
      // Artikel weglassen: "die Werkstatt" -> "Werkstatt", "the workshop" -> "workshop".
      const parts = full.split(' ');
      labels[room.id] = parts.length > 1 ? parts.slice(1).join(' ') : full;
    }
    return labels;
  }, [core.rooms, translator]);

  const onTap = (cell: Cell) => {
    if (state.tool === 'mark') dispatch({ type: 'mark', cell });
    else if (state.tool === 'erase') dispatch({ type: 'clearCell', cell });
    else dispatch({ type: 'note', cell });
  };

  const onCheck = () => {
    const correct = core.solution.every((cell, id) => state.placements[id] === cell);
    dispatch({ type: 'check', correct });
    if (correct) recordProgress(core.seed, { solved: true, bestMs: state.elapsedMs, hintsUsed: state.hintsUsed });
  };

  const onHint = () => {
    const hint = hintFor(core, state.placements);
    if (!hint) { dispatch({ type: 'hint', cell: -1, text: t(locale, 'noHintLeft') }); return; }
    const name = core.suspects[hint.suspectId]!.name;
    const clue = clues.byOwner[hint.suspectId] ?? '';
    dispatch({
      type: 'hint',
      cell: hint.cell,
      text: name + ' — ' + clue + '  (' + hint.step + '/' + hint.totalSteps + ')',
    });
  };

  const labels = {
    mark: t(locale, 'mark'), erase: t(locale, 'erase'), undo: t(locale, 'undo'),
    hint: t(locale, 'hint'), confirm: t(locale, 'confirm'), confirmHint: t(locale, 'confirmHint'),
  };

  return (
    <div className="game">
      <header className="game-head">
        <button type="button" className="ghost" onClick={onBack}>&larr; {t(locale, 'back')}</button>
        <h1>{t(locale, core.themeKey)} <span className="dim">{core.size}&times;{core.size}</span></h1>
        <div className="head-actions">
          <button type="button" className="ghost" onClick={() => setShowRules(true)}>{t(locale, 'rules')}</button>
          <span className="timer">{formatTime(state.elapsedMs)}</span>
        </div>
      </header>

      <div className="game-body">
        <section className="suspects">
          <h2>{t(locale, 'suspects')}</h2>
          <p className="hint-line">{t(locale, 'suspectsHelp')}</p>
          <div className="card-list">
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
            <div className="globals">
              {clues.globals.map((text) => <p key={text}>{text}</p>)}
            </div>
          )}
        </section>

        <section className="board-area">
          <Grid
            core={core}
            state={state}
            cellPx={cellPx}
            holdMs={holdMs}
            roomLabels={roomLabels}
            roomOfCell={layout.roomOfCell}
            blocked={layout.blocked}
            letters={letters}
            onPlace={(cell) => dispatch({ type: 'place', cell })}
            onTap={onTap}
            onPaint={(cell) => dispatch({ type: state.tool === 'mark' ? 'mark' : 'note', cell })}
            onMark={(cell) => dispatch({ type: 'mark', cell })}
          />
          {state.hintText && <p className="hint-box">{state.hintText}</p>}
          {state.verdict === 'wrong' && (
            <p className="verdict wrong"><strong>{t(locale, 'wrongTitle')}.</strong> {t(locale, 'wrong')}</p>
          )}
          <Toolbar
            tool={state.tool}
            canUndo={session.history.length > 0}
            canCheck={allPlaced(state)}
            onTool={(tool) => dispatch({ type: 'tool', tool })}
            onUndo={() => dispatch({ type: 'undo' })}
            onClearAll={() => dispatch({ type: 'clearAll' })}
            onHint={onHint}
            onCheck={onCheck}
            labels={labels}
          />
        </section>
      </div>

      {showTutorial && (
        <Tutorial locale={locale} onDone={() => { markTutorialSeen(); setShowTutorial(false); }} />
      )}
      {showRules && <RulesDialog locale={locale} onClose={() => setShowRules(false)} />}

      {state.verdict === 'solved' && (
        <Solved core={core} locale={locale} elapsedMs={state.elapsedMs} hintsUsed={state.hintsUsed} onBack={onBack} />
      )}
    </div>
  );
}
