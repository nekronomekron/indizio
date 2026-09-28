import { DAILY_START, daysInMonth, weekdayOf, type CalendarDate } from '@engine';

/**
 * The calendar works in *local time*.
 *
 * The engine knows no time zone — `dailySeed` takes three numbers and has no
 * opinion on which day that is. This file is where that gets decided: for the
 * player, today is the day their device shows. For someone in New Zealand the
 * daily case arrives a few hours earlier than here, which is more right than a
 * calendar still showing yesterday at midnight.
 *
 * The week starts on *Monday*, as usual in Europe. `weekdayOf` counts from
 * Sunday, hence the rotation in {@link columnOfDate}.
 */

export interface YearMonth {
  year: number;
  /** 1 = January. */
  month: number;
}

/** Today, from the device's clock, in its time zone. */
export function today(): CalendarDate {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** Negative when `a` is earlier. Compares three numbers, not milliseconds. */
export function compareDate(a: CalendarDate, b: CalendarDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

export function sameDate(a: CalendarDate, b: CalendarDate): boolean {
  return compareDate(a, b) === 0;
}

/** Column in the grid, 0 = Monday. */
export function columnOfDate(date: CalendarDate): number {
  return (weekdayOf(date) + 6) % 7;
}

export function monthOf(date: CalendarDate): YearMonth {
  return { year: date.year, month: date.month };
}

export function shiftMonth(at: YearMonth, delta: number): YearMonth {
  const index = at.year * 12 + (at.month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function compareMonth(a: YearMonth, b: YearMonth): number {
  return a.year - b.year || a.month - b.month;
}

/**
 * The cells of a month, padded to whole weeks.
 *
 * `null` stands for a place belonging to a neighbouring month — it stays empty
 * instead of showing foreign days. The number of rows follows the month: a
 * February starting on a Monday needs four, a long month starting late six.
 */
export function monthGrid(at: YearMonth): (CalendarDate | null)[] {
  const length = daysInMonth(at.year, at.month);
  const lead = columnOfDate({ ...at, day: 1 });
  const cells: (CalendarDate | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= length; day++) cells.push({ ...at, day });
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * Does this day have a puzzle?
 *
 * Before the start day the game did not exist; after today the day has not
 * come yet. Both look the same in the grid — locked — because to the player
 * they mean the same: nothing to get here.
 */
export function isPlayable(date: CalendarDate, now: CalendarDate = today()): boolean {
  return compareDate(date, DAILY_START) >= 0 && compareDate(date, now) <= 0;
}

/** The earliest month the calendar shows. */
export const FIRST_MONTH: YearMonth = monthOf(DAILY_START);
