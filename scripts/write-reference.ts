import { createHash } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIFFICULTY_ORDER, SIZES_BY_DIFFICULTY, THEME_KEYS, generatePuzzle, makeSeed, stringifyPuzzle } from '@engine';
import type { DifficultyKey } from '@engine';

/**
 * Writes the reference data the regression test compares against.
 *
 * Run deliberately, never automatically: regenerating is how an intended
 * change gets recorded, and the diff is meant to be read.
 */
const checksums: { seed: string; difficulty: DifficultyKey; sha256: string }[] = [];
const samples: string[] = [];

for (const difficulty of DIFFICULTY_ORDER as readonly DifficultyKey[]) {
  const sizes = SIZES_BY_DIFFICULTY[difficulty];
  for (let index = 0; index < 2; index++) {
    const size = sizes[index % sizes.length]!;
    const seed = makeSeed(THEME_KEYS[index % THEME_KEYS.length]!, size, 0xbeef + index * 7919);
    const written = stringifyPuzzle(generatePuzzle(seed).core);
    checksums.push({ seed, difficulty, sha256: createHash('sha256').update(written).digest('hex') });
    if (difficulty === 'veryEasy' && index === 0) samples.push(written);
    if (difficulty === 'expert' && index === 0) samples.push(written);
  }
}

// Anchored to this file, not to the working directory. Run from the repo root
// it otherwise created a second reference folder there, and the tests went on
// reading the old data — without anything failing to say so.
const target = join(dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'engine', 'reference');

// Anchoring alone was not enough: moving this script broke the path a second
// time, and `mkdir -p` happily created the wrong folder. The data is versioned,
// so the folder must already be there — if it is not, the path is wrong and
// writing would once more be silently useless.
if (!existsSync(target)) {
  throw new Error(`No reference data at ${target}. The path is wrong — nothing was written.`);
}
writeFileSync(join(target, 'checksums.json'), JSON.stringify(checksums, null, 2) + '\n');
samples.forEach((sample, index) => {
  writeFileSync(join(target, `sample-${index === 0 ? 'veryEasy' : 'expert'}.json`),
    JSON.stringify(JSON.parse(sample), null, 2) + '\n');
});
console.log('checksums:', checksums.length, '| samples:', samples.length, '->', target);
