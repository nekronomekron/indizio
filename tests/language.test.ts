import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Everything that is not player-facing text is English (PLAN.md §14, U4):
 * code, comments, tests, scripts, configuration and documentation. German
 * lives in the German resource files and nowhere else.
 *
 * tests/engine/architecture.test.ts says the same for the engine alone; this
 * covers the whole repository.
 */

const ROOT = join(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

const SCAN = ['src', 'scripts', 'tests', 'public', 'art/README.md'];
const TOP_LEVEL = /\.(md|ts|js|json|html|webmanifest)$|^\.git(ignore|attributes)$|^Dockerfile/;
const TEXT = /\.(ts|tsx|js|mjs|css|md|json|html|webmanifest)$/;

/** German is expected here — each for a reason. */
const GERMAN_ALLOWED = [
  // The German resources.
  /\/resources\/de(\/|\.ts$)/,
  /\/locales\/de\.ts$/,
  // Frozen reference puzzles carry German names and texts as data.
  /^tests\/engine\/reference\//,
  /^package-lock\.json$/,
  // Player-facing: page title and install name, in the game's first language.
  /^index\.html$/,
  /^public\/manifest\.webmanifest$/,
  // Tests of German output, and the language checks with their German word lists.
  /^tests\/i18n\.test\.ts$/,
  /^tests\/engine\/i18n\.test\.ts$/,
  /^tests\/language\.test\.ts$/,
  /^tests\/engine\/architecture\.test\.ts$/,
];

/** Common German words that never occur in English prose or code. */
const GERMAN_WORDS = [
  'nicht',
  'wird',
  'werden',
  'oder',
  'und',
  'der',
  'die',
  'das',
  'mit',
  'fuer',
  'ueber',
  'ist',
  'sind',
  'kein',
  'keine',
  'eine',
  'einen',
  'dass',
  'weil',
  'muss',
  'auch',
  'noch',
  'sich',
  'wenn',
  'damit',
  'dieser',
  'diese',
  'jede',
  'jeder',
  'hier',
  'dort',
  'beim',
];
const GERMAN = new RegExp(`\\b(${GERMAN_WORDS.join('|')})\\b`);
const UMLAUT = /[äöüßÄÖÜ]/;

function files(path: string): string[] {
  const full = join(ROOT, path);
  if (!statSync(full).isDirectory()) return [path];
  return readdirSync(full).flatMap((entry) => files(`${path}/${entry}`));
}

const scanned = [
  ...SCAN.flatMap(files),
  ...readdirSync(ROOT).filter((entry) => TOP_LEVEL.test(entry) && statSync(join(ROOT, entry)).isFile()),
]
  .map((path) => relative(ROOT, join(ROOT, path)).split(sep).join('/'))
  .filter((path) => TEXT.test(path) || TOP_LEVEL.test(path))
  .filter((path) => !GERMAN_ALLOWED.some((pattern) => pattern.test(path)));

describe('language', () => {
  it('scans the repository', () => {
    expect(scanned.length).toBeGreaterThan(100);
  });

  it('is English outside the German resources', () => {
    const offenders: string[] = [];
    for (const path of scanned) {
      readFileSync(join(ROOT, path), 'utf8')
        .split('\n')
        .forEach((line, index) => {
          // Case-sensitive: `MIT` in a licence field is not the German `mit`.
          if (UMLAUT.test(line) || GERMAN.test(line)) {
            offenders.push(`${path}:${String(index + 1)}: ${line.trim().slice(0, 80)}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });
});
