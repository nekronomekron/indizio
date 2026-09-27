import fs from 'node:fs';
import {
  DIFFICULTY_ORDER, GenerationError, SIZES_BY_DIFFICULTY, THEME_KEYS,
  generatePuzzle, makeSeed,
} from '@indizio/puzzle';
import type { DifficultyKey } from '@indizio/puzzle';

/**
 * Writes the curated case list the catalogue screen shows.
 *
 * Only seeds that actually generate get written, so a case in the list can
 * never fail to open. The list is versioned in the repository rather than
 * generated at runtime — the player should not wait for a search.
 */

interface CatalogEntry {
  seed: string;
  themeKey: string;
  size: number;
  difficulty: DifficultyKey;
  spread: number;
  indirect: number;
}

const perTier = Number(process.argv[2] ?? 6);
const entries: CatalogEntry[] = [];
let totalMs = 0;

for (const difficulty of DIFFICULTY_ORDER) {
  const sizes = SIZES_BY_DIFFICULTY[difficulty];
  let found = 0;

  for (let attempt = 0; found < perTier && attempt < perTier * 20; attempt++) {
    const size = sizes[attempt % sizes.length]!;
    const themeKey = THEME_KEYS[attempt % THEME_KEYS.length]!;
    const seed = makeSeed(themeKey, size, 0x51ee0 + attempt * 104729);
    try {
      const { core, meta } = generatePuzzle(seed, { timeBudgetMs: 20_000 });
      entries.push({
        seed,
        themeKey,
        size,
        difficulty,
        spread: Math.round(core.difficultyProof.spread * 10) / 10,
        indirect: core.difficultyProof.indirect,
      });
      totalMs += meta.durationMs;
      found++;
      process.stdout.write('.');
    } catch (error) {
      if (!(error instanceof GenerationError)) throw error;
      process.stdout.write('x');
    }
  }
  process.stdout.write(` ${difficulty}: ${found}/${perTier}\n`);
}

fs.writeFileSync('src/app/catalog.ts', [
  '// Written by scripts/curate.ts — do not edit by hand.',
  "import type { DifficultyKey } from '@indizio/puzzle';",
  '',
  'export interface CatalogEntry {',
  '  seed: string;',
  '  themeKey: string;',
  '  size: number;',
  '  difficulty: DifficultyKey;',
  '  spread: number;',
  '  indirect: number;',
  '}',
  '',
  `export const CATALOG: readonly CatalogEntry[] = ${JSON.stringify(entries, null, 2)};`,
  '',
].join('\n'));

console.log(`written: src/app/catalog.ts | ${entries.length} cases | ${totalMs}ms total`);
