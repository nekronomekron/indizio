import { describe, expect, it } from 'vitest';
import { GENERATOR_VERSION, generatePuzzle, makeSeed } from '@indizio/puzzle';
import { CATALOG } from '../src/app/catalog.js';
import { UI } from '../src/app/i18n.js';

/**
 * Ein Seed traegt die Generatorversion. Aendert sich der Generator, beschriebe
 * dieselbe Zeichenkette ein anderes Raetsel — der Link wird deshalb abgewiesen
 * statt neu gedeutet (PLAN.md §6.1).
 *
 * Die App erkennt das **vor** dem Worker an der Zeichenkette, damit sie nicht
 * „liess sich kein Raetsel erzeugen" sagt, wo nichts erzeugt werden sollte.
 * Genau dieser Ausdruck ist hier nachgebaut: eine verschluckte Escape-Sequenz
 * machte aus ihm ein Muster, das nie greift, und niemand haette es gemerkt —
 * der Bildschirm sah lediglich weiter so aus wie vorher.
 */
const SEED_VERSION = /^v(\d+)-/;

function versionOf(seed: string): number | undefined {
  const match = SEED_VERSION.exec(seed);
  return match === null ? undefined : Number(match[1]);
}

describe('Generatorversion im Seed', () => {
  it('liest die Version aus einem frischen Seed', () => {
    expect(versionOf(makeSeed('garage', 6, 1))).toBe(GENERATOR_VERSION);
  });

  it('erkennt eine aeltere Version als fremd', () => {
    expect(versionOf('v2-garage-6-vl-u8iyn8')).toBe(2);
    expect(versionOf('v2-garage-6-vl-u8iyn8')).not.toBe(GENERATOR_VERSION);
  });

  it('bleibt bei etwas, das kein Seed ist, ohne Meinung', () => {
    for (const unsinn of ['', 'garage-6', 'vx-garage-6-vl-abc', 'https://example.com']) {
      expect(versionOf(unsinn), unsinn).toBeUndefined();
    }
  });

  it('weist einen alten Seed auch in der Bibliothek ab', () => {
    expect(() => generatePuzzle('v2-garage-6-vl-u8iyn8')).toThrow();
  });
});

describe('Katalog', () => {
  it('enthaelt ausschliesslich Seeds der aktuellen Generatorversion', () => {
    // Nach einem Versionswechsel muss der Katalog neu erzeugt werden. Ohne
    // diese Pruefung faellt das erst auf, wenn jemand einen Fall anklickt.
    const fremd = CATALOG.filter((entry) => versionOf(entry.seed) !== GENERATOR_VERSION);
    expect(fremd.map((entry) => entry.seed)).toEqual([]);
  });
});

describe('Beispiel im Eingabefeld', () => {
  it('nennt einen Seed, den die App auch annimmt', () => {
    // Fest eingetippt stand dort `v1`, lange nachdem Version 2 lief.
    for (const locale of ['de', 'en'] as const) {
      const beispiel = /v\d+-[a-z]+-\d+-[a-z]+-[a-z0-9]+/.exec(UI[locale].seedPlaceholder ?? '')?.[0];
      expect(beispiel, locale).toBeDefined();
      expect(versionOf(beispiel!), locale).toBe(GENERATOR_VERSION);
    }
  });
});

describe('Texte zum alten Link', () => {
  it('liegen in beiden Sprachen vor', () => {
    for (const locale of ['de', 'en'] as const) {
      expect(UI[locale].outdatedSeed, locale).toBeTruthy();
      expect(UI[locale].outdatedSeedWhy, locale).toBeTruthy();
    }
  });

  it('sagen nicht, die Erzeugung sei fehlgeschlagen', () => {
    // Der alte Text behauptete das und war damit schlicht falsch.
    expect(UI.de.outdatedSeed).not.toContain('erzeugen');
    expect(UI.en.outdatedSeed.toLowerCase()).not.toContain('could not');
  });
});
