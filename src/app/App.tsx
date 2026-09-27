import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Locale } from './types.js';
import { CatalogScreen } from './components/CatalogScreen.js';
import { Footer } from './components/Footer.js';
import { GameScreen } from './components/GameScreen.js';
import { t } from './i18n.js';
import { loadSettings, saveSettings } from './storage/store.js';
import { usePuzzle } from './usePuzzle.js';

function seedFromHash(): string | null {
  const match = /^#\/p\/([a-z0-9-]+)$/i.exec(window.location.hash);
  return match ? match[1]!.toLowerCase() : null;
}

export function App() {
  const [settings, setSettings] = useState(() => loadSettings());
  const [seed, setSeed] = useState<string | null>(() => seedFromHash());

  useEffect(() => {
    const onHash = () => setSeed(seedFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const open = (next: string) => { window.location.hash = '#/p/' + next; };
  const back = () => { window.location.hash = '#/'; };
  const setLocale = (locale: Locale) => {
    const next = { ...settings, locale };
    setSettings(next);
    saveSettings(next);
  };

  const status = usePuzzle(seed);

  let screen: ReactNode;

  if (!seed) {
    screen = <CatalogScreen locale={settings.locale} onOpen={open} onLocale={setLocale} />;
  } else if (status.state === 'loading') {
    screen = (
      <div className="loading">
        <div className="loading-inner">
          <div className="scanner" aria-hidden="true" />
          <p>{t(settings.locale, 'generating')}</p>
          <small>{t(settings.locale, 'generatingLong')}</small>
          <code>{seed}</code>
        </div>
      </div>
    );
  } else if (status.state === 'error') {
    const outdated = status.kind === 'outdatedSeed';
    screen = (
      <div className="loading">
        <div className="loading-inner">
          <p>{t(settings.locale, outdated ? 'outdatedSeed' : 'generateError')}</p>
          {outdated && <small>{t(settings.locale, 'outdatedSeedWhy')}</small>}
          <code>{status.message}</code>
          <button type="button" className="primary" onClick={back}>{t(settings.locale, 'back')}</button>
        </div>
      </div>
    );
  } else {
    screen = (
      <GameScreen
        core={status.core}
        locale={settings.locale}
        holdMs={settings.holdMs}
        onBack={back}
      />
    );
  }

  // Der Footer steht auf jedem Bildschirm. Deshalb wird erst der Bildschirm
  // bestimmt und danach einmal ausgegeben, statt ihn in jeden Zweig zu
  // kopieren — wo er beim nächsten Zweig zuverlässig fehlen würde.
  return (
    <>
      <div className="screen">{screen}</div>
      <Footer locale={settings.locale} />
    </>
  );
}
