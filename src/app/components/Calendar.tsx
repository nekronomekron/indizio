import { useMemo, type ReactElement } from 'react';
import type { CalendarDate, DifficultyKey } from '@engine';
import type { Locale } from '@engine/i18n';
import { compareMonth, monthGrid, sameDate, type YearMonth } from '../calendar.js';
import { t } from '../i18n.js';
import { Sprite } from '../render/Sprite.js';

/** Was ein Tag im Kalender über sich zu sagen hat. */
export type DayState =
  /** Vor dem Starttag — da gab es das Spiel noch nicht. */
  | 'before'
  /** Noch nicht dran. Die Stufe steht schon fest und darf sichtbar sein. */
  | 'future'
  | 'open'
  | 'started'
  | 'solved';

export interface CalendarProps {
  locale: Locale;
  at: YearMonth;
  today: CalendarDate;
  /** Frühester Monat, den es gibt — davor ist der Zurück-Knopf gesperrt. */
  first: YearMonth;
  stateOf: (date: CalendarDate) => DayState;
  difficultyOf: (date: CalendarDate) => DifficultyKey;
  onPick: (date: CalendarDate) => void;
  onShift: (delta: number) => void;
  onToday: () => void;
}

/**
 * Monatsnamen und Wochentage kommen von `Intl`, nicht aus der Textdatei.
 *
 * Zwölf Monate mal zwei Sprachen wären vierundzwanzig Einträge, die der Browser
 * ohnehin kennt — und bei einer dritten Sprache wären es sechsunddreißig.
 * Gerechnet wird in UTC, damit die Formatierung nicht am Zeitzonenrand auf den
 * Vortag rutscht.
 */
function useLabels(locale: Locale, at: YearMonth) {
  return useMemo(() => {
    const month = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(at.year, at.month - 1, 1)),
    );
    // Der 1.1.2024 war ein Montag — von dort aus sieben Tage, und die Woche
    // steht in der Reihenfolge, in der sie hier auch angezeigt wird.
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
  const { locale, at, today, first, stateOf, difficultyOf, onPick, onShift, onToday } = props;
  const labels = useLabels(locale, at);
  const cells = useMemo(() => monthGrid(at), [at]);

  const atFirst = compareMonth(at, first) <= 0;
  const atCurrent = compareMonth(at, { year: today.year, month: today.month }) >= 0;

  return (
    <section className="calendar" aria-label={t(locale, 'calendar')}>
      <header className="calendar-head">
        <button
          type="button"
          className="ghost calendar-step"
          onClick={() => onShift(-1)}
          disabled={atFirst}
          aria-label={t(locale, 'prevMonth')}
        >
          &larr;
        </button>

        <h2>{labels.month}</h2>

        <div className="calendar-head-right">
          {!atCurrent && (
            <button type="button" className="ghost calendar-today" onClick={onToday}>
              {t(locale, 'thisMonth')}
            </button>
          )}
          <button
            type="button"
            className="ghost calendar-step"
            onClick={() => onShift(1)}
            disabled={atCurrent}
            aria-label={t(locale, 'nextMonth')}
          >
            &rarr;
          </button>
        </div>
      </header>

      <div className="calendar-weekdays" aria-hidden="true">
        {labels.weekdays.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>

      <div className="calendar-grid" role="grid">
        {cells.map((date, index) => {
          if (date === null) return <span key={'leer-' + String(index)} className="day empty" />;

          const state = stateOf(date);
          const difficulty = difficultyOf(date);
          const locked = state === 'before' || state === 'future';
          const isToday = sameDate(date, today);
          const classes = ['day', state];
          if (isToday) classes.push('today');

          // Der Vorlesetext trägt, was die Zelle zeigt: Datum, Stufe, Zustand.
          // Eine Farbe und ein Häkchen allein sagen nichts, wer nicht hinsieht.
          const spoken = [
            labels.dayName.format(new Date(Date.UTC(date.year, date.month - 1, date.day))),
            state === 'before' ? '' : t(locale, difficulty),
            state === 'solved' ? t(locale, 'solvedLabel') : state === 'started' ? t(locale, 'started') : '',
          ]
            .filter(Boolean)
            .join(', ');

          return (
            <button
              key={date.day}
              type="button"
              className={classes.join(' ')}
              disabled={locked}
              onClick={() => onPick(date)}
              aria-label={spoken}
              aria-current={isToday ? 'date' : undefined}
            >
              <span className="day-number">{date.day}</span>
              {state !== 'before' && <span className={'day-tier tier-' + difficulty} aria-hidden="true" />}
              {/* Zustand doppelt: als Füllfarbe der Zelle und als großes Symbol,
                  damit er auch ohne Farbwahrnehmung auf einen Blick lesbar ist. */}
              {state === 'solved' && (
                <span className="day-mark" aria-hidden="true">
                  <Sprite kind="icons" name="ui-check" size={24} />
                </span>
              )}
              {state === 'started' && (
                <span className="day-mark" aria-hidden="true">
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
