import { describe, expect, it } from 'vitest';
import { difficultyOfSize, generatePuzzle, parseSeed } from '@indizio/puzzle';
import { CATALOG } from '../src/app/catalog.js';

describe('Katalog', () => {
  it('enthaelt nur erzeugbare Seeds mit passender Stufe', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(25);
    for (const entry of CATALOG) {
      const parts = parseSeed(entry.seed);
      expect(parts.size).toBe(entry.size);
      expect(parts.difficulty).toBe(entry.difficulty);
      expect(difficultyOfSize(entry.size)).toBe(entry.difficulty);
    }
    // Stichprobe: die kleinsten Faelle lassen sich wirklich erzeugen.
    for (const entry of CATALOG.filter((e) => e.size <= 6).slice(0, 3)) {
      const { core } = generatePuzzle(entry.seed);
      expect(core.size).toBe(entry.size);
    }
  });

});
