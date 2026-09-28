import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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

/**
 * Der Kalender ist die Startseite geworden, und damit die Stelle, an der jeder
 * Tagesfall beginnt. Zwei Dinge muss er deshalb sicher können: die Tage eines
 * Monats an die richtige Stelle legen, und keinen Tag anbieten, den es nicht
 * gibt.
 */

const HEUTE = { year: 2026, month: 9, day: 27 }; // ein Sonntag

describe('Monatsgitter', () => {
  it('beginnt die Woche am Montag', () => {
    // Der 1.9.2026 ist ein Dienstag, steht also in der zweiten Spalte.
    expect(columnOfDate({ year: 2026, month: 9, day: 1 })).toBe(1);
    expect(columnOfDate({ year: 2026, month: 9, day: 27 })).toBe(6); // Sonntag, letzte Spalte
  });

  it('füllt vorn auf und hinten auf ganze Wochen', () => {
    const cells = monthGrid({ year: 2026, month: 9 });
    expect(cells.length % 7).toBe(0);
    expect(cells.slice(0, 1)).toEqual([null]); // ein Platzhalter vor dem Dienstag
    expect(cells[1]).toEqual({ year: 2026, month: 9, day: 1 });
    expect(cells.filter((cell) => cell !== null)).toHaveLength(30);
  });

  it('kennt die Länge jedes Monats, Schaltjahr eingeschlossen', () => {
    const zaehle = (year: number, month: number) =>
      monthGrid({ year, month }).filter((cell) => cell !== null).length;
    expect(zaehle(2026, 2)).toBe(28);
    expect(zaehle(2028, 2)).toBe(29);
    expect(zaehle(2026, 1)).toBe(31);
    expect(zaehle(2026, 4)).toBe(30);
  });

  it('legt jeden Tag in die Spalte seines Wochentags', () => {
    for (const month of [1, 2, 6, 9, 12]) {
      const cells = monthGrid({ year: 2026, month });
      cells.forEach((date, index) => {
        if (date !== null) expect(index % 7, JSON.stringify(date)).toBe(columnOfDate(date));
      });
    }
  });
});

describe('Blättern', () => {
  it('läuft über Jahresgrenzen', () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth({ year: 2026, month: 5 }, -12)).toEqual({ year: 2025, month: 5 });
  });

  it('ordnet Monate und Tage', () => {
    expect(compareMonth({ year: 2026, month: 1 }, { year: 2026, month: 2 })).toBeLessThan(0);
    expect(compareDate(HEUTE, { year: 2026, month: 9, day: 28 })).toBeLessThan(0);
    expect(sameDate(HEUTE, { ...HEUTE })).toBe(true);
    expect(monthOf(HEUTE)).toEqual({ year: 2026, month: 9 });
    expect(FIRST_MONTH).toEqual(monthOf(DAILY_START));
  });
});

describe('Welcher Tag hat ein Rätsel', () => {
  it('nichts vor dem Starttag, nichts nach heute', () => {
    expect(isPlayable({ year: 2025, month: 12, day: 31 }, HEUTE)).toBe(false);
    expect(isPlayable(DAILY_START, HEUTE)).toBe(true);
    expect(isPlayable(HEUTE, HEUTE)).toBe(true);
    expect(isPlayable({ year: 2026, month: 9, day: 28 }, HEUTE)).toBe(false);
  });
});

describe('Die gezeichnete Startseite', () => {
  /**
   * Gerendert statt nur gerechnet: die Verdrahtung zwischen Kalender, Stufe und
   * Seed ist das, was der Spieler anfasst, und sie lässt sich mit den reinen
   * Funktionen allein nicht prüfen. `localStorage` fehlt in dieser Umgebung —
   * der Speicher fängt das ab, und genau das soll hier mitgeprüft sein.
   */
  const markup = renderToStaticMarkup(
    createElement(Dashboard, {
      locale: 'de' as const,
      onOpen: () => undefined,
      onDraw: () => undefined,
      onSettings: () => undefined,
    }),
  );

  it('kommt ohne Browser-Speicher zurecht', () => {
    expect(markup).toContain('Indizio');
    expect(markup).toContain('0 gelöst');
  });

  it('zeigt einen Knopf je Stufe für den Zufallsfall', () => {
    for (const stufe of ['Sehr leicht', 'Leicht', 'Mittel', 'Schwer', 'Experte']) {
      expect(markup, stufe).toContain(stufe);
    }
  });

  it('sperrt die Tage, die noch nicht dran sind', () => {
    // Im laufenden Monat liegen fast immer künftige Tage; jeder gesperrte
    // Knopf trägt `disabled`. Dass überhaupt Tage anklickbar sind, prüft die
    // Gegenrichtung.
    expect(markup).toContain('class="day');
    expect(markup.split('disabled').length - 1).toBeGreaterThan(0);
  });
});

describe('Tagesfall und Stufe passen zusammen', () => {
  it('jeder Tag eines Monats ergibt einen Seed seiner Stufe', () => {
    for (const cell of monthGrid({ year: 2026, month: 9 })) {
      if (cell === null) continue;
      const parts = parseSeed(dailySeed(cell, THEME_KEYS));
      expect(parts.difficulty, JSON.stringify(cell)).toBe(dailyDifficulty(cell));
    }
  });

  it('gibt demselben Tag immer denselben Fall', () => {
    expect(dailySeed(HEUTE, THEME_KEYS)).toBe(dailySeed({ ...HEUTE }, THEME_KEYS));
  });
});

describe('Nachwürfeln bei fehlgeschlagener Erzeugung', () => {
  /**
   * Dieser Weg lässt sich im Browser nicht auslösen — über hunderte erzeugte
   * Fälle ist die Erzeugung kein einziges Mal gescheitert. Genau deshalb steht
   * die Regel hier: geprüft wird sie sonst nirgends, und ihr Bruch fiele erst
   * jemandem auf, dem das Spiel heimlich einen fremden Fall untergeschoben hat.
   */
  const AUSGELOST = 'v3-garage-8-m-abc';
  const EINGETIPPT = 'v3-flat-7-l-xyz';

  it('ersetzt nur, was das Spiel selbst ausgelost hat', () => {
    expect(redrawFor(EINGETIPPT, AUSGELOST, 0, 3)).toBeNull();
    expect(redrawFor(EINGETIPPT, null, 0, 3)).toBeNull();
    expect(redrawFor(AUSGELOST, AUSGELOST, 0, 3)).not.toBeNull();
  });

  it('hört nach der erlaubten Zahl von Versuchen auf', () => {
    expect(redrawFor(AUSGELOST, AUSGELOST, 2, 3)).not.toBeNull();
    expect(redrawFor(AUSGELOST, AUSGELOST, 3, 3)).toBeNull();
    expect(redrawFor(AUSGELOST, AUSGELOST, 9, 3)).toBeNull();
  });

  it('würfelt in derselben Stufe weiter', () => {
    for (let versuch = 0; versuch < 20; versuch++) {
      const ersatz = redrawFor(AUSGELOST, AUSGELOST, 0, 3);
      expect(ersatz).not.toBeNull();
      const teile = parseSeed(ersatz!);
      expect(teile.difficulty).toBe('medium');
      expect(teile.size).toBe(8);
    }
  });

  it('bleibt bei Unsinn stumm, statt zu werfen', () => {
    expect(redrawFor('kein-seed', 'kein-seed', 0, 3)).toBeNull();
  });
});

describe('Tastaturrahmen im Gitter', () => {
  /**
   * Die Bedienung selbst braucht einen Browser, das Anstoßen an den Rändern
   * nicht — und dort wohnt der Fehler um eins. Ein Rahmen, der am rechten Rand
   * in die nächste Zeile springt, wäre im Spiel kaum zu bemerken und trotzdem
   * falsch: ein Gitter ist keine Textzeile.
   */
  const GROESSE = 6;

  it('bewegt sich in alle vier Richtungen', () => {
    const mitte = 14; // Zeile 2, Spalte 2
    expect(moveCursor(mitte, 'ArrowLeft', GROESSE)).toBe(13);
    expect(moveCursor(mitte, 'ArrowRight', GROESSE)).toBe(15);
    expect(moveCursor(mitte, 'ArrowUp', GROESSE)).toBe(8);
    expect(moveCursor(mitte, 'ArrowDown', GROESSE)).toBe(20);
  });

  it('bleibt an jedem Rand stehen, statt umzubrechen', () => {
    expect(moveCursor(0, 'ArrowLeft', GROESSE)).toBe(0);
    expect(moveCursor(0, 'ArrowUp', GROESSE)).toBe(0);
    expect(moveCursor(5, 'ArrowRight', GROESSE)).toBe(5); // Ende der ersten Zeile
    expect(moveCursor(6, 'ArrowLeft', GROESSE)).toBe(6); // Anfang der zweiten
    expect(moveCursor(35, 'ArrowRight', GROESSE)).toBe(35); // untere rechte Ecke
    expect(moveCursor(35, 'ArrowDown', GROESSE)).toBe(35);
  });

  it('springt mit Pos1 und Ende an die Zeilenenden', () => {
    expect(moveCursor(14, 'Home', GROESSE)).toBe(12);
    expect(moveCursor(14, 'End', GROESSE)).toBe(17);
    expect(moveCursor(12, 'Home', GROESSE)).toBe(12);
    expect(moveCursor(17, 'End', GROESSE)).toBe(17);
  });

  it('bleibt bei jeder Gittergröße im Brett', () => {
    for (const groesse of [5, 6, 7, 8, 9, 10]) {
      for (let feld = 0; feld < groesse * groesse; feld++) {
        for (const taste of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']) {
          const ziel = moveCursor(feld, taste, groesse);
          expect(ziel, `${taste} von ${String(feld)} bei ${String(groesse)}`).not.toBeNull();
          expect(ziel!).toBeGreaterThanOrEqual(0);
          expect(ziel!).toBeLessThan(groesse * groesse);
        }
      }
    }
  });

  it('meldet Tasten, die keine Bewegung sind', () => {
    for (const taste of ['Enter', 'n', 'x', 'Delete', 'Tab', 'F5', 'a']) {
      expect(moveCursor(0, taste, GROESSE), taste).toBeNull();
    }
  });
});
