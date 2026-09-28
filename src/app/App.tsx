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

function seedFromHash(): string | null {
  const match = /^#\/p\/([a-z0-9-]+)$/i.exec(window.location.hash);
  return match ? match[1]!.toLowerCase() : null;
}

/**
 * Wie oft ein ausgelostes Rätsel neu gewürfelt wird, wenn die Erzeugung
 * fehlschlägt. Gemessen tritt das praktisch nicht auf — über 130 erzeugte Fälle
 * kein einziges Mal —, aber „praktisch nicht" ist kein Versprechen, und der
 * Spieler hat sich diesen Fall nicht ausgesucht.
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

  // Welcher Seed ausgelost war und wie oft schon nachgewürfelt wurde. Beides
  // liegt in Refs, weil es nur **innerhalb** der Rückmeldung des Workers gelesen
  // wird und nie beim Zeichnen. Ein selbst eingetippter Seed wird nie ersetzt:
  // wer einen bestimmten Fall aufruft, will genau den und keinen ähnlichen.
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
   * Läuft aus der Antwort des Workers heraus, nicht beim Zeichnen — deshalb
   * dürfen hier Refs gelesen und geschrieben werden.
   */
  const replaceOnFailure = (badSeed: string): string | null => {
    const next = redrawFor(badSeed, drawn.current, redraws.current, MAX_REDRAWS);
    if (next === null) return null;
    redraws.current += 1;
    drawn.current = next;
    setRedrew(true);
    // `replace` statt `hash =`: die fehlgeschlagenen Versuche sollen nicht als
    // Stationen im Verlauf liegen, durch die man sich zurückklicken kann.
    window.location.replace('#/p/' + next);
    return next;
  };

  const status = usePuzzle(seed, { replaceOnFailure });

  let screen: ReactNode;

  if (!seed) {
    screen = <Dashboard onOpen={open} onDraw={draw} onSettings={() => setShowSettings(true)} />;
  } else if (status.state === 'loading') {
    screen = (
      <div className="loading">
        <div className="loading-inner">
          <div className="scanner" aria-hidden="true" />
          <p>{t(redrew ? 'randomRetry' : 'generating')}</p>
          <small>{t('generatingLong')}</small>
          <code>{seed}</code>
        </div>
      </div>
    );
  } else if (status.state === 'error') {
    const outdated = status.kind === 'outdatedSeed';
    screen = (
      <div className="loading">
        <div className="loading-inner">
          <p>{t(outdated ? 'outdatedSeed' : 'generateError')}</p>
          {outdated && <small>{t('outdatedSeedWhy')}</small>}
          <code>{status.message}</code>
          <button type="button" className="primary" onClick={back}>
            {t('back')}
          </button>
        </div>
      </div>
    );
  } else {
    screen = (
      // Je Rätsel eine eigene Sitzung: sonst trägt ein neues Rätsel den
      // Spielstand des vorigen weiter, seit ein zwischengespeichertes Rätsel
      // ohne Ladebildschirm erscheint.
      <GameScreen
        key={status.core.seed}
        core={status.core}
        holdMs={settings.holdMs}
        vibrate={settings.vibrate}
        names={settings.names}
        onBack={back}
        onSettings={() => setShowSettings(true)}
      />
    );
  }

  // Der Footer steht auf jedem Bildschirm. Deshalb wird erst der Bildschirm
  // bestimmt und danach einmal ausgegeben, statt ihn in jeden Zweig zu
  // kopieren — wo er beim nächsten Zweig zuverlässig fehlen würde.
  return (
    <>
      <div className="screen">{screen}</div>
      <Footer />
      {/* Ein Dialog fuer beide Bildschirme: die Haltedauer stellt man dort ein,
          wo sie stoert - beim Spielen -, und nicht nur auf der Startseite. */}
      {showSettings && (
        <SettingsDialog settings={settings} onChange={applySettings} onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
