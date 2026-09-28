import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { DifficultyKey } from '@engine';
import { Dashboard } from './features/calendar/Dashboard.js';
import { SettingsDialog } from './features/settings/SettingsDialog.js';
import { Footer } from './shared/layout/Footer.js';
import { GameScreen } from './features/game/GameScreen.js';
import { randomSeed, redrawFor } from './features/calendar/randomSeed.js';
import { loadSettings, saveSettings, type Settings } from './features/settings/settings.js';
import { usePuzzle } from './shared/puzzle/usePuzzle.js';
import { ErrorBoundary } from './shared/errors/ErrorBoundary.js';
import { ErrorPanel } from './shared/errors/ErrorPanel.js';
import button from './shared/ui/button.module.css';
import statusScreen from './shared/layout/StatusScreen.module.css';
import styles from './App.module.css';

function seedFromHash(): string | null {
  const match = /^#\/p\/([a-z0-9-]+)$/i.exec(window.location.hash);
  return match ? match[1]!.toLowerCase() : null;
}

/**
 * How often a drawn puzzle is redrawn when generation fails. Measured, it
 * practically never happens — not once in over 130 generated cases — but
 * "practically never" is no promise, and the player did not choose this case.
 */
const MAX_REDRAWS = 3;

export function App(): ReactElement {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState(() => loadSettings());
  const [seed, setSeed] = useState<string | null>(() => seedFromHash());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const onHash = () => setSeed(seedFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const open = (next: string) => {
    window.location.hash = '#/p/' + next;
  };
  const back = () => {
    window.location.hash = '#/';
  };
  const applySettings = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
    if (next.locale !== i18n.language) void i18n.changeLanguage(next.locale);
  };

  // Which seed was drawn and how often it has been redrawn. Both live in refs
  // because they are read only *inside* the worker's answer, never while
  // rendering. A typed-in seed is never replaced: whoever opens a particular
  // case wants exactly that one, not a similar one.
  const drawn = useRef<string | null>(null);
  const redraws = useRef(0);
  const [redrew, setRedrew] = useState(false);

  const draw = (difficulty: DifficultyKey) => {
    const next = randomSeed(difficulty);
    drawn.current = next;
    redraws.current = 0;
    setRedrew(false);
    open(next);
  };

  /**
   * Runs from the worker's answer, not while rendering — which is why it may
   * read and write refs.
   */
  const replaceOnFailure = (badSeed: string): string | null => {
    const next = redrawFor(badSeed, drawn.current, redraws.current, MAX_REDRAWS);
    if (next === null) return null;
    redraws.current += 1;
    drawn.current = next;
    setRedrew(true);
    // `replace` rather than `hash =`: failed attempts should not sit in the
    // history as stations to click back through.
    window.location.replace('#/p/' + next);
    return next;
  };

  const status = usePuzzle(seed, { replaceOnFailure });

  const backButton = (
    <button type="button" className={button.primary} onClick={back}>
      {t('back')}
    </button>
  );

  let screen: ReactNode;

  if (!seed) {
    screen = <Dashboard onOpen={open} onDraw={draw} onSettings={() => setShowSettings(true)} />;
  } else if (status.state === 'loading') {
    screen = (
      <div className={statusScreen.status}>
        <div className={statusScreen.inner}>
          <div className={statusScreen.scanner} aria-hidden="true" />
          <p>{t(redrew ? 'randomRetry' : 'generating')}</p>
          <small>{t('generatingLong')}</small>
          <code>{seed}</code>
        </div>
      </div>
    );
  } else if (status.state === 'error') {
    screen = <ErrorPanel kind={status.code} detail={status.detail} action={backButton} />;
  } else {
    screen = (
      // A crash inside the board costs this case, not the app: the player
      // gets back to the list, and the save is still there.
      <ErrorBoundary
        key={status.core.seed}
        fallback={(error) => <ErrorPanel kind="screen" detail={error.message} action={backButton} />}
      >
        {/* One session per puzzle, keyed by seed: otherwise a new puzzle
            would carry the previous one's board. */}
        <GameScreen
          core={status.core}
          holdMs={settings.holdMs}
          vibrate={settings.vibrate}
          names={settings.names}
          onBack={back}
          onSettings={() => setShowSettings(true)}
        />
      </ErrorBoundary>
    );
  }

  // The footer is on every screen. So the screen is decided first and output
  // once, rather than copying the footer into every branch — where the next
  // branch would reliably forget it.
  return (
    <>
      <div className={styles.screen}>{screen}</div>
      <Footer />
      {/* One dialog for both screens: the hold time gets adjusted where it
          bothers you — while playing — not only on the start page. */}
      {showSettings && (
        <SettingsDialog settings={settings} onChange={applySettings} onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
