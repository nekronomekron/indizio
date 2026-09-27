import { useMemo, useState } from 'react';
import { dailySeed, isValidSeed } from '@indizio/puzzle';
import { DIFFICULTY_ORDER } from '@indizio/puzzle';
import { THEME_KEYS } from '@indizio/puzzle';
import type { DifficultyKey, Locale } from '../types.js';
import { CATALOG, type CatalogEntry } from '../catalog.js';
import { t } from '../i18n.js';
import { Sprite } from '../render/Sprite.js';
import { loadProgress } from '../storage/store.js';
import { RulesDialog } from './Help.js';

// Requisiten heissen jetzt nach ihrer Grundflaeche. Hier stehen sie als
// Sinnbild des Themes, deshalb quadratische Fassungen.
const THEME_SPRITE: Record<string, string> = { garage: 'car_2x2', flat: 'bed_2x2', garden: 'tree_1x1' };

export function CatalogScreen({ locale, onOpen, onLocale }: {
  locale: Locale;
  onOpen: (seed: string) => void;
  onLocale: (locale: Locale) => void;
}) {
  const progress = useMemo(() => loadProgress(), []);
  const [seedInput, setSeedInput] = useState('');
  const [seedError, setSeedError] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const today = useMemo(() => dailySeed(new Date(), THEME_KEYS, 6), []);
  const solvedCount = Object.values(progress).filter((p) => p.solved).length;

  const byDifficulty = useMemo(() => {
    const groups: Record<string, CatalogEntry[]> = {};
    for (const entry of CATALOG) (groups[entry.difficulty] ??= []).push(entry);
    return groups;
  }, []);

  const openSeed = () => {
    const seed = seedInput.trim().toLowerCase();
    if (!isValidSeed(seed)) { setSeedError(true); return; }
    setSeedError(false);
    onOpen(seed);
  };

  return (
    <div className="catalog">
      <header className="catalog-head">
        <div>
          <h1>{t(locale, 'appTitle')}</h1>
          <p className="tagline">{t(locale, 'tagline')}</p>
        </div>
        <div className="head-actions">
          <button type="button" className="ghost" onClick={() => setShowRules(true)}>{t(locale, 'rules')}</button>
          <span className="counter">{solvedCount} {t(locale, 'solvedLabel')}</span>
          <select value={locale} onChange={(e) => onLocale(e.target.value as Locale)} aria-label="Sprache">
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>

      <p className="catalog-intro">{t(locale, 'catalogIntro')}</p>

      <section className="daily">
        <button type="button" className="daily-card" onClick={() => onOpen(today)}>
          <Sprite kind="icons" name="ui-timer" size={28} />
          <span>
            <strong>{t(locale, 'daily')}</strong>
            <small>{today}</small>
          </span>
        </button>
        <div className="seed-entry">
          <label htmlFor="seed">{t(locale, 'ownSeed')}</label>
          <div className="seed-row">
            <input
              id="seed"
              value={seedInput}
              placeholder={t(locale, 'seedPlaceholder')}
              onChange={(e) => { setSeedInput(e.target.value); setSeedError(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') openSeed(); }}
            />
            <button type="button" onClick={openSeed}>{t(locale, 'play')}</button>
          </div>
          {seedError && <p className="error">{t(locale, 'seedInvalid')}</p>}
        </div>
      </section>

      {DIFFICULTY_ORDER.map((difficulty: DifficultyKey) => (
        <section key={difficulty} className="level">
          <h2>{t(locale, difficulty)}</h2>
          <div className="case-grid">
            {(byDifficulty[difficulty] ?? []).map((entry) => {
              const done = progress[entry.seed]?.solved;
              return (
                <button
                  key={entry.seed}
                  type="button"
                  className={'case' + (done ? ' done' : '')}
                  onClick={() => onOpen(entry.seed)}
                >
                  <Sprite name={THEME_SPRITE[entry.themeKey] ?? 'chair'} theme={entry.themeKey} size={32} />
                  <span className="case-title">{t(locale, entry.themeKey)}</span>
                  <span className="case-meta">{entry.size}&times;{entry.size} &middot; {entry.size} {t(locale, 'suspectsCount')}</span>
                  {done && <span className="case-done"><Sprite kind="icons" name="ui-check" size={16} /></span>}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {showRules && <RulesDialog locale={locale} onClose={() => setShowRules(false)} />}
    </div>
  );
}
