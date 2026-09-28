import { useMemo, useState, type ReactElement } from 'react';
import {
  DAILY_START,
  DIFFICULTY_ORDER,
  SIZES_BY_DIFFICULTY,
  THEME_KEYS,
  dailyDifficulty,
  dailySeed,
  isValidSeed,
  parseSeed,
} from '@engine';
import type { CalendarDate, DifficultyKey } from '@engine';
import type { Locale } from '../../shared/types.js';
import {
  FIRST_MONTH,
  compareDate,
  isPlayable,
  monthOf,
  shiftMonth,
  today,
  type YearMonth,
} from './calendarDates.js';
import { t } from '../../shared/i18n/uiTexts.js';
import { Sprite } from '../../shared/art/Sprite.js';
import { hasSave, loadProgress } from '../../shared/storage/store.js';
import { Calendar, type DayState } from './Calendar.js';
import { RulesDialog } from '../../shared/help/Help.js';

/**
 * Die Startseite: der Kalender **ist** die Hauptsache.
 *
 * Vorher standen hier eine Tagesfall-Karte, eine kuratierte Fallliste und ein
 * Seed-Feld nebeneinander und stritten um dieselbe Aufmerksamkeit. Jetzt gibt es
 * einen Knopf für heute, darunter den Monat zum Nachholen, und alles Weitere
 * tritt einen Schritt zurück.
 */
export function Dashboard({
  locale,
  onOpen,
  onDraw,
  onSettings,
}: {
  locale: Locale;
  onOpen: (seed: string) => void;
  /** Losen gehoert in die App: nur sie weiss spaeter, dass sie neu wuerfeln darf. */
  onDraw: (difficulty: DifficultyKey) => void;
  onSettings: () => void;
}): ReactElement {
  // Einmal beim Öffnen bestimmt: wechselt der Tag, während jemand die Seite
  // offen hat, ist das beim nächsten Laden richtig — ein Kalender, der unter
  // den Händen umspringt, wäre die unangenehmere Überraschung.
  const now = useMemo(() => today(), []);
  const progress = useMemo(() => loadProgress(), []);
  const [at, setAt] = useState<YearMonth>(() => monthOf(now));
  const [seedInput, setSeedInput] = useState('');
  const [seedError, setSeedError] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const seedOf = (date: CalendarDate): string => dailySeed(date, THEME_KEYS);
  const solvedCount = Object.values(progress).filter((entry) => entry.solved).length;

  const stateOf = (date: CalendarDate): DayState => {
    // 'before' erscheint nur, wenn der Starttag **nicht** der Monatserste ist —
    // heute ist er es, also greift dieser Zweig derzeit nie. Er steht trotzdem
    // hier, weil sonst ein verschobener Starttag stillschweigend Tage anböte,
    // die es nie gab.
    if (compareDate(date, DAILY_START) < 0) return 'before';
    if (!isPlayable(date, now)) return 'future';
    const seed = seedOf(date);
    if (progress[seed]?.solved === true) return 'solved';
    return hasSave(seed) ? 'started' : 'open';
  };

  const todaySeed = seedOf(now);
  const todayParts = parseSeed(todaySeed);
  const todayDone = progress[todaySeed]?.solved === true;

  const openSeed = () => {
    const seed = seedInput.trim().toLowerCase();
    if (!isValidSeed(seed)) {
      setSeedError(true);
      return;
    }
    setSeedError(false);
    onOpen(seed);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-head">
        <div>
          <h1>{t(locale, 'appTitle')}</h1>
          <p className="tagline">{t(locale, 'tagline')}</p>
        </div>
        <div className="head-actions">
          <button type="button" className="ghost" onClick={() => setShowRules(true)}>
            {t(locale, 'rules')}
          </button>
          <span className="counter">
            {solvedCount} {t(locale, 'solvedLabel')}
          </span>
          <button type="button" className="ghost" onClick={onSettings}>
            {t(locale, 'settings')}
          </button>
        </div>
      </header>

      <button
        type="button"
        className={'today-card' + (todayDone ? ' done' : '')}
        onClick={() => onOpen(todaySeed)}
      >
        <Sprite kind="icons" name={todayDone ? 'ui-check' : 'ui-timer'} size={28} />
        <span>
          <strong>{t(locale, todayDone ? 'todaySolved' : 'playToday')}</strong>
          <small>
            {t(locale, todayParts.difficulty)} &middot; {todayParts.size}&times;{todayParts.size} &middot;{' '}
            {t(locale, todayParts.themeKey)}
          </small>
        </span>
      </button>

      <p className="dashboard-intro">{t(locale, 'calendarIntro')}</p>

      <Calendar
        locale={locale}
        at={at}
        today={now}
        first={FIRST_MONTH}
        stateOf={stateOf}
        difficultyOf={(date: CalendarDate): DifficultyKey => dailyDifficulty(date)}
        onPick={(date) => onOpen(seedOf(date))}
        onShift={(delta) => setAt(shiftMonth(at, delta))}
        onToday={() => setAt(monthOf(now))}
      />

      <div className="dashboard-aside">
        <section className="random">
          <h2>{t(locale, 'randomTitle')}</h2>
          <p className="hint-line">{t(locale, 'randomIntro')}</p>
          <div className="tier-row">
            {DIFFICULTY_ORDER.map((difficulty) => {
              // „5×5–6×6" statt „5–6×5–6": die Stufe „sehr leicht" hat zwei
              // Größen, und ein Bereich über beide Achsen liest sich nicht.
              const sizes = SIZES_BY_DIFFICULTY[difficulty];
              const square = (size: number | undefined): string => `${String(size)}×${String(size)}`;
              const span =
                sizes.length > 1
                  ? `${square(sizes[0])}–${square(sizes[sizes.length - 1])}`
                  : square(sizes[0]);
              return (
                <button
                  key={difficulty}
                  type="button"
                  className={'tier-button tier-' + difficulty}
                  onClick={() => onDraw(difficulty)}
                >
                  <strong>{t(locale, difficulty)}</strong>
                  <small>{span}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="seed-entry">
          <h2>{t(locale, 'ownSeed')}</h2>
          <p className="hint-line">{t(locale, 'ownSeedIntro')}</p>
          <div className="seed-row">
            <input
              id="seed"
              value={seedInput}
              placeholder={t(locale, 'seedPlaceholder')}
              aria-label={t(locale, 'ownSeed')}
              onChange={(e) => {
                setSeedInput(e.target.value);
                setSeedError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') openSeed();
              }}
            />
            <button type="button" onClick={openSeed}>
              {t(locale, 'play')}
            </button>
          </div>
          {seedError && <p className="error">{t(locale, 'seedInvalid')}</p>}
        </section>
      </div>

      {showRules && <RulesDialog locale={locale} onClose={() => setShowRules(false)} />}
    </div>
  );
}
