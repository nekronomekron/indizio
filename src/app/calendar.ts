import { DAILY_START, daysInMonth, weekdayOf, type CalendarDate } from '@engine';

/**
 * Der Kalender rechnet in **Ortszeit**.
 *
 * Die Engine kennt keine Zeitzone — `dailySeed` bekommt drei Zahlen und hat
 * keine Meinung dazu, welcher Tag das ist. Diese Datei ist die Stelle, die sich
 * festlegt: für den Spieler ist heute der Tag, den sein Gerät anzeigt. Für
 * jemanden in Neuseeland ist der Tagesfall damit ein paar Stunden früher da als
 * hier, und das ist richtiger als ein Kalender, der um Mitternacht noch gestern
 * zeigt.
 *
 * Die Woche beginnt am **Montag**, wie in Europa üblich. `weekdayOf` zählt ab
 * Sonntag, deshalb die Drehung in {@link columnOfDate}.
 */

export interface YearMonth {
  year: number;
  /** 1 = Januar. */
  month: number;
}

/** Heute, aus der Uhr des Geräts, in seiner Zeitzone. */
export function today(): CalendarDate {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** Negativ, wenn `a` früher liegt. Vergleicht drei Zahlen, nicht Millisekunden. */
export function compareDate(a: CalendarDate, b: CalendarDate): number {
  return (a.year - b.year) || (a.month - b.month) || (a.day - b.day);
}

export function sameDate(a: CalendarDate, b: CalendarDate): boolean {
  return compareDate(a, b) === 0;
}

/** Spalte im Gitter, 0 = Montag. */
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
  return (a.year - b.year) || (a.month - b.month);
}

/**
 * Die Zellen eines Monats, aufgefüllt auf ganze Wochen.
 *
 * `null` steht für einen Platz, der zu einem Nachbarmonat gehört — er bleibt
 * leer, statt dort fremde Tage anzuzeigen. Die Zeilenzahl richtet sich nach dem
 * Monat: ein Februar, der auf einen Montag fällt, braucht vier Zeilen, ein
 * langer Monat mit spätem Beginn sechs.
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
 * Hat dieser Tag ein Rätsel?
 *
 * Vor dem Starttag gab es das Spiel nicht, nach heute ist der Tag noch nicht
 * gekommen. Beides sieht im Gitter gleich aus — gesperrt —, weil es für den
 * Spieler dasselbe bedeutet: hier ist nichts zu holen.
 */
export function isPlayable(date: CalendarDate, now: CalendarDate = today()): boolean {
  return compareDate(date, DAILY_START) >= 0 && compareDate(date, now) <= 0;
}

/** Der früheste Monat, den der Kalender zeigt. */
export const FIRST_MONTH: YearMonth = monthOf(DAILY_START);
