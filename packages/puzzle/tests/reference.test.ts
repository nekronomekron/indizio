import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generatePuzzle, parsePuzzle, stringifyPuzzle } from '../src/index.js';
import type { DifficultyKey } from '../src/index.js';
import { expectSoundPuzzle } from './support/invariants.js';

/**
 * Reference data.
 *
 * A seed is a promise that the same link always gives the same puzzle. These
 * fixed seeds are how that promise is kept honest: a checksum changing means
 * generation changed, whether or not anybody meant it to.
 *
 * Checksums catch the change; the two full samples show *what* changed, which
 * a hash alone never can. Regenerate deliberately with
 * `npx tsx scripts/write-reference.ts` and read the diff.
 */

interface ReferenceEntry {
  seed: string;
  difficulty: DifficultyKey;
  sha256: string;
}

const here = (name: string): string =>
  new URL(`./reference/${name}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const checksums = JSON.parse(readFileSync(here('checksums.json'), 'utf8')) as ReferenceEntry[];
const sha256 = (text: string): string => createHash('sha256').update(text).digest('hex');

describe('reference puzzles', () => {
  it('covers every difficulty tier', () => {
    expect(new Set(checksums.map((entry) => entry.difficulty)).size).toBe(5);
    expect(checksums.length).toBeGreaterThanOrEqual(10);
  });

  it.each(checksums)('$seed still generates byte for byte the same', ({ seed, sha256: expected }) => {
    expect(sha256(stringifyPuzzle(generatePuzzle(seed).core))).toBe(expected);
  });

  it.each(['veryEasy', 'expert'])('the %s sample still matches in full', (tier) => {
    const stored = readFileSync(here(`sample-${tier}.json`), 'utf8');
    const core = parsePuzzle(stored);
    expect(stringifyPuzzle(generatePuzzle(core.seed).core)).toBe(stringifyPuzzle(core));
  });

  it.each(['veryEasy', 'expert'])('the %s sample is still a sound puzzle', (tier) => {
    const core = parsePuzzle(readFileSync(here(`sample-${tier}.json`), 'utf8'));
    expectSoundPuzzle(core);
  });
});
