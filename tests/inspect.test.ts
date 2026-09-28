import { describe, expect, it } from 'vitest';
import { describeCell, estimateTipWidth, tipSpot } from '../src/app/features/game/board/cellInfo.js';

/**
 * Die Namen der Felder.
 *
 * Die Hinweise nennen Requisiten beim Namen („war neben dem Regal"), das Brett
 * zeigte bisher nur ein Bild davon. Wer die Grafik nicht deutet, konnte den
 * Hinweis nicht prüfen — das war Bilderraten und nicht Schließen. Zwei Dinge
 * müssen dafür stimmen: was im Text steht, und dass die Blase im Brett bleibt.
 */

const OCCUPIED = 'belegt';

function facts(over: Partial<Parameters<typeof describeCell>[0]> = {}) {
  return { room: 'Werkstatt', object: null, person: null, blocked: false, occupied: OCCUPIED, ...over };
}

describe('Beschreibung eines Feldes', () => {
  it('nennt auf einem leeren Feld nur den Raum', () => {
    expect(describeCell(facts())).toBe('Werkstatt');
  });

  it('geht vom Raum über den Gegenstand zur Person', () => {
    const text = describeCell(facts({ object: 'Werkbank', person: 'Nadja' }));
    expect(text).toBe('Werkstatt · Werkbank · Nadja');
  });

  it('lässt fehlende Teile weg statt Trenner stehen zu lassen', () => {
    expect(describeCell(facts({ person: 'Nadja' }))).toBe('Werkstatt · Nadja');
    expect(describeCell(facts({ object: 'Werkbank' }))).toBe('Werkstatt · Werkbank');
    expect(describeCell(facts({ object: '', person: '' }))).toBe('Werkstatt');
  });

  /**
   * Der Fall, um den es eigentlich geht: das Brett blinkt heute nur rot, wenn
   * man auf ein gesperrtes Feld greift. Der Name des Gegenstands ist die
   * Erklärung dazu.
   */
  it('erklärt ein gesperrtes Feld mit dem Gegenstand darauf', () => {
    expect(describeCell(facts({ object: 'Werkbank', blocked: true }))).toBe('Werkstatt · Werkbank · belegt');
  });

  it('nennt eine Sperre auch ohne Gegenstand', () => {
    expect(describeCell(facts({ blocked: true }))).toBe('Werkstatt · belegt');
  });

  it('nennt niemals Person und Sperre zugleich', () => {
    // Beides zusammen kann es auf dem Brett nicht geben; kommt es doch, gilt
    // das Sichtbare: dort steht jemand.
    expect(describeCell(facts({ person: 'Nadja', blocked: true }))).toBe('Werkstatt · Nadja');
  });
});

describe('Ort der Sprechblase', () => {
  const CELL = 40;
  const SIZE = 5; // Brett: 200 Bildpunkte
  const WIDTH = 60;

  it('hängt mittig über dem Feld', () => {
    const spot = tipSpot(2 * SIZE + 2, SIZE, CELL, WIDTH); // Reihe 2, Spalte 2
    expect(spot.below).toBe(false);
    // Feldmitte 100, halbe Blase 30.
    expect(spot.left).toBe(70);
    expect(spot.top).toBe(2 * CELL - 22 - 4);
  });

  it('kippt in der obersten Reihe nach unten', () => {
    const spot = tipSpot(3, SIZE, CELL, WIDTH);
    expect(spot.below).toBe(true);
    expect(spot.top).toBe(CELL + 4);
  });

  it('bleibt links und rechts im Brett', () => {
    for (let row = 0; row < SIZE; row++) {
      const left = tipSpot(row * SIZE, SIZE, CELL, WIDTH);
      const right = tipSpot(row * SIZE + SIZE - 1, SIZE, CELL, WIDTH);
      expect(left.left).toBe(0);
      expect(right.left).toBe(SIZE * CELL - WIDTH);
    }
  });

  it('fällt bei keiner Zelle und keiner Brettgröße heraus', () => {
    for (const size of [5, 6, 7, 8, 9, 10]) {
      for (const cellPx of [24, 40, 72]) {
        for (let cell = 0; cell < size * size; cell++) {
          const spot = tipSpot(cell, size, cellPx, WIDTH);
          expect(spot.left).toBeGreaterThanOrEqual(0);
          expect(spot.left + WIDTH).toBeLessThanOrEqual(size * cellPx);
          expect(spot.top).toBeGreaterThanOrEqual(0);
          expect(spot.top + 22).toBeLessThanOrEqual(size * cellPx);
        }
      }
    }
  });

  it('steht links an, wenn die Blase breiter ist als das Brett', () => {
    const spot = tipSpot(12, SIZE, CELL, 400);
    expect(spot.left).toBe(0);
  });

  it('schätzt die Breite mit der Länge des Textes', () => {
    expect(estimateTipWidth('')).toBeGreaterThan(0);
    expect(estimateTipWidth('Werkstatt · Werkbank')).toBeGreaterThan(estimateTipWidth('Werkstatt'));
  });
});
