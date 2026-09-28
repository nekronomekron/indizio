import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { DAILY_START, THEME_KEYS, dailyDifficulty, dailySeed, parseSeed } from '@engine';
import {
  FIRST_MONTH,
  compareDate,
  compareMonth,
  columnOfDate,
  isPlayable,
  monthGrid,
  monthOf,
  sameDate,
  shiftMonth,
} from '../src/app/features/calendar/calendarDates.js';
import { Dashboard } from '../src/app/features/calendar/Dashboard.js';
import { moveCursor } from '../src/app/features/game/board/keyboard.js';
import { redrawFor } from '../src/app/features/calendar/randomSeed.js';
import { renderWithI18n } from './support/render.js';

/**
 * The calendar is the start page, and so where every daily case begins. It
 * must reliably do two things: put a month's days in the right place, and
 * offer no day that does not exist.
 */

const TODAY = { year: 2026, month: 9, day: 27 }; // a Sunday

describe('month grid', () => {
  it('starts the week on Monday', () => {
    // 1 September 2026 is a Tuesday, so it is in the second column.
    expect(columnOfDate({ year: 2026, month: 9, day: 1 })).toBe(1);
    expect(columnOfDate({ year: 2026, month: 9, day: 27 })).toBe(6); // Sunday, last column
  });

  it('pads front and back to whole weeks', () => {
    const cells = monthGrid({ year: 2026, month: 9 });
    expect(cells.length % 7).toBe(0);
    expect(cells.slice(0, 1)).toEqual([null]); // one blank before the Tuesday
    expect(cells[1]).toEqual({ year: 2026, month: 9, day: 1 });
    expect(cells.filter((cell) => cell !== null)).toHaveLength(30);
  });

  it('knows the length of every month, leap years included', () => {
    const days = (year: number, month: number) =>
      monthGrid({ year, month }).filter((cell) => cell !== null).length;
    expect(days(2026, 2)).toBe(28);
    expect(days(2028, 2)).toBe(29);
    expect(days(2026, 1)).toBe(31);
    expect(days(2026, 4)).toBe(30);
  });

  it("puts every day in its weekday's column", () => {
    for (const month of [1, 2, 6, 9, 12]) {
      const cells = monthGrid({ year: 2026, month });
      cells.forEach((date, index) => {
        if (date !== null) expect(index % 7, JSON.stringify(date)).toBe(columnOfDate(date));
      });
    }
  });
});

describe('paging', () => {
  it('crosses year boundaries', () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth({ year: 2026, month: 5 }, -12)).toEqual({ year: 2025, month: 5 });
  });

  it('orders months and days', () => {
    expect(compareMonth({ year: 2026, month: 1 }, { year: 2026, month: 2 })).toBeLessThan(0);
    expect(compareDate(TODAY, { year: 2026, month: 9, day: 28 })).toBeLessThan(0);
    expect(sameDate(TODAY, { ...TODAY })).toBe(true);
    expect(monthOf(TODAY)).toEqual({ year: 2026, month: 9 });
    expect(FIRST_MONTH).toEqual(monthOf(DAILY_START));
  });
});

describe('which days have a puzzle', () => {
  it('none before the start day, none after today', () => {
    expect(isPlayable({ year: 2025, month: 12, day: 31 }, TODAY)).toBe(false);
    expect(isPlayable(DAILY_START, TODAY)).toBe(true);
    expect(isPlayable(TODAY, TODAY)).toBe(true);
    expect(isPlayable({ year: 2026, month: 9, day: 28 }, TODAY)).toBe(false);
  });
});

describe('the rendered start page', () => {
  /**
   * Rendered, not only computed: the wiring between calendar, tier and seed is
   * what the player touches, and the pure functions alone cannot check it.
   * `localStorage` is missing here — storage copes with that, and that is
   * meant to be checked along the way.
   */
  const markup = renderWithI18n(
    createElement(Dashboard, {
      onOpen: () => undefined,
      onDraw: () => undefined,
      onSettings: () => undefined,
    }),
    'en',
  );

  it('copes without browser storage', () => {
    expect(markup).toContain('Indizio');
    expect(markup).toContain('0 solved');
  });

  it('shows one button per tier for a random case', () => {
    for (const tier of ['Very easy', 'Easy', 'Medium', 'Hard', 'Expert']) {
      expect(markup, tier).toContain(tier);
    }
  });

  it('locks the days that are not due yet', () => {
    // The current month almost always has future days; every locked button
    // carries `disabled`.
    expect(markup).toContain('class="day');
    expect(markup.split('disabled').length - 1).toBeGreaterThan(0);
  });
});

describe('daily case and tier match', () => {
  it("gives every day of a month a seed of that day's tier", () => {
    for (const cell of monthGrid({ year: 2026, month: 9 })) {
      if (cell === null) continue;
      const parts = parseSeed(dailySeed(cell, THEME_KEYS));
      expect(parts.difficulty, JSON.stringify(cell)).toBe(dailyDifficulty(cell));
    }
  });

  it('always gives the same day the same case', () => {
    expect(dailySeed(TODAY, THEME_KEYS)).toBe(dailySeed({ ...TODAY }, THEME_KEYS));
  });
});

describe('redrawing after a failed generation', () => {
  /**
   * This path cannot be triggered in the browser — in hundreds of generated
   * cases generation never failed once. That is exactly why the rule is tested
   * here: nothing else checks it, and breaking it would only show when the game
   * quietly slipped someone a different case.
   */
  const DRAWN = 'v3-garage-8-m-abc';
  const TYPED = 'v3-flat-7-l-xyz';

  it('only replaces what the game drew itself', () => {
    expect(redrawFor(TYPED, DRAWN, 0, 3)).toBeNull();
    expect(redrawFor(TYPED, null, 0, 3)).toBeNull();
    expect(redrawFor(DRAWN, DRAWN, 0, 3)).not.toBeNull();
  });

  it('stops after the allowed number of attempts', () => {
    expect(redrawFor(DRAWN, DRAWN, 2, 3)).not.toBeNull();
    expect(redrawFor(DRAWN, DRAWN, 3, 3)).toBeNull();
    expect(redrawFor(DRAWN, DRAWN, 9, 3)).toBeNull();
  });

  it('keeps drawing in the same tier', () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const replacement = redrawFor(DRAWN, DRAWN, 0, 3);
      expect(replacement).not.toBeNull();
      const parts = parseSeed(replacement!);
      expect(parts.difficulty).toBe('medium');
      expect(parts.size).toBe(8);
    }
  });

  it('stays quiet on nonsense instead of throwing', () => {
    expect(redrawFor('not-a-seed', 'not-a-seed', 0, 3)).toBeNull();
  });
});

describe('keyboard frame on the grid', () => {
  /**
   * Using it needs a browser, bumping into the edges does not — and that is
   * where the off-by-one error lives. A frame jumping to the next row at the
   * right edge would hardly be noticed in the game and still be wrong: a grid
   * is not a line of text.
   */
  const SIZE = 6;

  it('moves in all four directions', () => {
    const middle = 14; // row 2, column 2
    expect(moveCursor(middle, 'ArrowLeft', SIZE)).toBe(13);
    expect(moveCursor(middle, 'ArrowRight', SIZE)).toBe(15);
    expect(moveCursor(middle, 'ArrowUp', SIZE)).toBe(8);
    expect(moveCursor(middle, 'ArrowDown', SIZE)).toBe(20);
  });

  it('stops at every edge instead of wrapping', () => {
    expect(moveCursor(0, 'ArrowLeft', SIZE)).toBe(0);
    expect(moveCursor(0, 'ArrowUp', SIZE)).toBe(0);
    expect(moveCursor(5, 'ArrowRight', SIZE)).toBe(5); // end of the first row
    expect(moveCursor(6, 'ArrowLeft', SIZE)).toBe(6); // start of the second
    expect(moveCursor(35, 'ArrowRight', SIZE)).toBe(35); // bottom right corner
    expect(moveCursor(35, 'ArrowDown', SIZE)).toBe(35);
  });

  it('jumps to the row ends with Home and End', () => {
    expect(moveCursor(14, 'Home', SIZE)).toBe(12);
    expect(moveCursor(14, 'End', SIZE)).toBe(17);
    expect(moveCursor(12, 'Home', SIZE)).toBe(12);
    expect(moveCursor(17, 'End', SIZE)).toBe(17);
  });

  it('stays on the board at every grid size', () => {
    for (const size of [5, 6, 7, 8, 9, 10]) {
      for (let cell = 0; cell < size * size; cell++) {
        for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']) {
          const target = moveCursor(cell, key, size);
          expect(target, `${key} from ${String(cell)} at ${String(size)}`).not.toBeNull();
          expect(target!).toBeGreaterThanOrEqual(0);
          expect(target!).toBeLessThan(size * size);
        }
      }
    }
  });

  it('reports keys that are not a movement', () => {
    for (const key of ['Enter', 'n', 'x', 'Delete', 'Tab', 'F5', 'a']) {
      expect(moveCursor(0, key, SIZE), key).toBeNull();
    }
  });
});
