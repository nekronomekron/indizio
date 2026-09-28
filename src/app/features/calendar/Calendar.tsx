import { useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { CalendarDate, DifficultyKey } from '@engine';
import { compareMonth, monthGrid, sameDate, type YearMonth } from './calendarDates.js';
import { Sprite } from '../../shared/art/Sprite.js';
import { cx } from '../../shared/ui/cx.js';
import button from '../../shared/ui/button.module.css';
import styles from './Calendar.module.css';

/** What a day in the calendar has to say about itself. */
export type DayState =
  /** Before the start day — the game did not exist yet. */
  | 'before'
  /** Not yet due. Its tier is already fixed and may show. */
  | 'future'
  | 'open'
  | 'started'
  | 'solved';

/** How a day's state shows: only some states change the cell's look. */
const STATE_CLASS: Record<DayState, string | undefined> = {
  before: styles.before,
  future: undefined,
  open: undefined,
  started: styles.started,
  solved: styles.solved,
};

const TIER_CLASS: Record<DifficultyKey, string> = {
  veryEasy: styles.tierVeryEasy,
  easy: styles.tierEasy,
  medium: styles.tierMedium,
  hard: styles.tierHard,
  expert: styles.tierExpert,
};

export interface CalendarProps {
  at: YearMonth;
  today: CalendarDate;
  /** The earliest month there is — the back button is locked before it. */
  first: YearMonth;
  stateOf: (date: CalendarDate) => DayState;
  difficultyOf: (date: CalendarDate) => DifficultyKey;
  onPick: (date: CalendarDate) => void;
  onShift: (delta: number) => void;
  onToday: () => void;
}

/**
 * Month and weekday names come from `Intl`, not from the resources.
 *
 * Twelve months in two languages would be twenty-four entries the browser
 * knows anyway — and thirty-six with a third language. Dates are formatted in
 * UTC so they do not slip to the previous day at a time-zone boundary.
 */
function useLabels(locale: string, at: YearMonth) {
  return useMemo(() => {
    const month = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(at.year, at.month - 1, 1)),
    );
    // 1 January 2024 was a Monday — seven days from there give the week in the
    // order it is shown here.
    const weekdays = Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(
        new Date(Date.UTC(2024, 0, 1 + index)),
      ),
    );
    const dayName = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    return { month, weekdays, dayName };
  }, [locale, at.year, at.month]);
}

export function Calendar(props: CalendarProps): ReactElement {
  const { t, i18n } = useTranslation();
  const { at, today, first, stateOf, difficultyOf, onPick, onShift, onToday } = props;
  const labels = useLabels(i18n.language, at);
  const cells = useMemo(() => monthGrid(at), [at]);

  const atFirst = compareMonth(at, first) <= 0;
  const atCurrent = compareMonth(at, { year: today.year, month: today.month }) >= 0;

  return (
    <section className={styles.calendar} aria-label={t('calendar')}>
      <header className={styles.head}>
        <button
          type="button"
          className={cx(button.ghost, styles.step)}
          onClick={() => onShift(-1)}
          disabled={atFirst}
          aria-label={t('prevMonth')}
        >
          &larr;
        </button>

        <h2>{labels.month}</h2>

        <div className={styles.headRight}>
          {!atCurrent && (
            <button type="button" className={button.ghost} onClick={onToday}>
              {t('thisMonth')}
            </button>
          )}
          <button
            type="button"
            className={cx(button.ghost, styles.step)}
            onClick={() => onShift(1)}
            disabled={atCurrent}
            aria-label={t('nextMonth')}
          >
            &rarr;
          </button>
        </div>
      </header>

      <div className={styles.weekdays} aria-hidden="true">
        {labels.weekdays.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>

      <div className={styles.grid} role="grid">
        {cells.map((date, index) => {
          if (date === null)
            return <span key={'leer-' + String(index)} className={cx(styles.day, styles.empty)} />;

          const state = stateOf(date);
          const difficulty = difficultyOf(date);
          const locked = state === 'before' || state === 'future';
          const isToday = sameDate(date, today);
          const className = cx(styles.day, STATE_CLASS[state], isToday && styles.today);

          // The spoken label carries what the cell shows: date, tier, state. A
          // colour and a tick alone say nothing to someone who cannot look.
          const spoken = [
            labels.dayName.format(new Date(Date.UTC(date.year, date.month - 1, date.day))),
            state === 'before' ? '' : t(difficulty),
            state === 'solved' ? t('solvedLabel') : state === 'started' ? t('started') : '',
          ]
            .filter(Boolean)
            .join(', ');

          return (
            <button
              key={date.day}
              type="button"
              className={className}
              disabled={locked}
              onClick={() => onPick(date)}
              aria-label={spoken}
              aria-current={isToday ? 'date' : undefined}
            >
              <span className={styles.number}>{date.day}</span>
              {state !== 'before' && (
                <span className={cx(styles.tier, TIER_CLASS[difficulty])} aria-hidden="true" />
              )}
              {/* The state twice: as the cell's fill and as a large symbol, so it
                  reads at a glance without colour vision too. */}
              {state === 'solved' && (
                <span className={styles.mark} aria-hidden="true">
                  <Sprite kind="icons" name="ui-check" size={24} />
                </span>
              )}
              {state === 'started' && (
                <span className={styles.mark} aria-hidden="true">
                  <Sprite kind="icons" name="ui-note" size={24} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
