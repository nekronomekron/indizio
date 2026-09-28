import { useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DAILY_START,
  DIFFICULTY_ORDER,
  GENERATOR_VERSION,
  SIZES_BY_DIFFICULTY,
  THEME_KEYS,
  dailyDifficulty,
  dailySeed,
  isValidSeed,
  parseSeed,
} from '@engine';
import type { CalendarDate, DifficultyKey } from '@engine';
import {
  FIRST_MONTH,
  compareDate,
  isPlayable,
  monthOf,
  shiftMonth,
  today,
  type YearMonth,
} from './calendarDates.js';
import { Sprite } from '../../shared/art/Sprite.js';
import { hasSave, loadProgress } from '../../shared/storage/store.js';
import { Calendar, type DayState } from './Calendar.js';
import { RulesDialog } from '../../shared/help/Help.js';
import { useClueTranslator } from '../../shared/i18n/useClueTranslator.js';
import { cx } from '../../shared/ui/cx.js';
import button from '../../shared/ui/button.module.css';
import text from '../../shared/ui/text.module.css';
import styles from './Dashboard.module.css';

const TIER_CLASS: Record<DifficultyKey, string> = {
  veryEasy: styles.tierVeryEasy,
  easy: styles.tierEasy,
  medium: styles.tierMedium,
  hard: styles.tierHard,
  expert: styles.tierExpert,
};

/**
 * Example seed for the input field, built from the generator version: typed
 * in by hand it once still said `v1` long after version 2 shipped — an example
 * the app itself would have refused.
 */
const SEED_EXAMPLE = `v${String(GENERATOR_VERSION)}-garage-6-vl-k3f9tq`;

/**
 * The start page: the calendar *is* the main thing.
 *
 * It used to show a daily-case card, a curated case list and a seed field side
 * by side, all competing for the same attention. Now there is one button for
 * today, below it the month to catch up on, and everything else steps back.
 */
export function Dashboard({
  onOpen,
  onDraw,
  onSettings,
}: {
  onOpen: (seed: string) => void;
  /** Drawing belongs to the app: only it knows later that it may redraw. */
  onDraw: (difficulty: DifficultyKey) => void;
  onSettings: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const translator = useClueTranslator();
  // Decided once on opening: if the day changes while the page is open, it is
  // right on the next load — a calendar flipping under your hands would be
  // the nastier surprise.
  const now = useMemo(() => today(), []);
  const progress = useMemo(() => loadProgress(), []);
  const [at, setAt] = useState<YearMonth>(() => monthOf(now));
  const [seedInput, setSeedInput] = useState('');
  const [seedError, setSeedError] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const seedOf = (date: CalendarDate): string => dailySeed(date, THEME_KEYS);
  const solvedCount = Object.values(progress).filter((entry) => entry.solved).length;

  const stateOf = (date: CalendarDate): DayState => {
    // 'before' only shows when the start day is *not* the first of a month —
    // today it is, so this branch never runs at the moment. It stays anyway:
    // otherwise a moved start day would quietly offer days that never existed.
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
    <div className={styles.dashboard}>
      <header className={styles.head}>
        <div>
          <h1>{t('appTitle')}</h1>
          <p className={styles.tagline}>{t('tagline')}</p>
        </div>
        <div className={styles.headActions}>
          <button type="button" className={button.ghost} onClick={() => setShowRules(true)}>
            {t('rules')}
          </button>
          <span className={styles.counter}>
            {solvedCount} {t('solvedLabel')}
          </span>
          <button type="button" className={button.ghost} onClick={onSettings}>
            {t('settings')}
          </button>
        </div>
      </header>

      <button
        type="button"
        className={cx(styles.today, todayDone && styles.done)}
        onClick={() => onOpen(todaySeed)}
      >
        <Sprite kind="icons" name={todayDone ? 'ui-check' : 'ui-timer'} size={28} />
        <span>
          <strong>{t(todayDone ? 'todaySolved' : 'playToday')}</strong>
          <small>
            {t(todayParts.difficulty)} &middot; {todayParts.size}&times;{todayParts.size} &middot;{' '}
            {translator.themeName(todayParts.themeKey)}
          </small>
        </span>
      </button>

      <p className={styles.intro}>{t('calendarIntro')}</p>

      <Calendar
        at={at}
        today={now}
        first={FIRST_MONTH}
        stateOf={stateOf}
        difficultyOf={(date: CalendarDate): DifficultyKey => dailyDifficulty(date)}
        onPick={(date) => onOpen(seedOf(date))}
        onShift={(delta) => setAt(shiftMonth(at, delta))}
        onToday={() => setAt(monthOf(now))}
      />

      <div className={styles.aside}>
        <section>
          <h2>{t('randomTitle')}</h2>
          <p className={text.hintLine}>{t('randomIntro')}</p>
          <div className={styles.tierRow}>
            {DIFFICULTY_ORDER.map((difficulty) => {
              // "5×5–6×6" rather than "5–6×5–6": "very easy" has two sizes, and
              // a range over both axes does not read well.
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
                  className={cx(styles.tier, TIER_CLASS[difficulty])}
                  onClick={() => onDraw(difficulty)}
                >
                  <strong>{t(difficulty)}</strong>
                  <small>{span}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2>{t('ownSeed')}</h2>
          <p className={text.hintLine}>{t('ownSeedIntro')}</p>
          <div className={styles.seedRow}>
            <input
              id="seed"
              value={seedInput}
              placeholder={t('seedPlaceholder', { example: SEED_EXAMPLE })}
              aria-label={t('ownSeed')}
              onChange={(e) => {
                setSeedInput(e.target.value);
                setSeedError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') openSeed();
              }}
            />
            <button type="button" onClick={openSeed}>
              {t('play')}
            </button>
          </div>
          {seedError && <p className={text.error}>{t('seedInvalid')}</p>}
        </section>
      </div>

      {showRules && <RulesDialog onClose={() => setShowRules(false)} />}
    </div>
  );
}
