import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Structural guarantees.
 *
 * These are the promises the engine makes about *itself* rather than about
 * puzzles: it depends on nothing, it reaches for no platform, its layers point
 * one way, and it is written in one language. Each of those is easy to break
 * accidentally and impossible to notice by reading a diff, so each is a test.
 *
 * Who may reach *into* the engine from outside is a separate promise, and it
 * lives in tests/boundary.test.ts.
 */

const SOURCE_ROOT = new URL('../../src/engine', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** Every `from '…'` specifier, bare or relative. */
const BARE_IMPORT = /from\s+'([^']+)'/g;

function sourceFiles(directory: string = SOURCE_ROOT): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) found.push(...sourceFiles(path));
    else if (entry.endsWith('.ts')) found.push(path);
  }
  return found;
}

/**
 * Comments may discuss what the code must not do — that is what they are for.
 * The structural checks therefore look at code only.
 */
function withoutComments(source: string): string {
  const blockComments = /\/\*[\s\S]*?\*\//g;
  const lineComments = /\/\/.*$/gm;
  return source.replace(blockComments, '').replace(lineComments, '');
}

const files = sourceFiles();
const contents = new Map(
  files.map((path) => [relative(SOURCE_ROOT, path).replaceAll('\\', '/'), readFileSync(path, 'utf8')]),
);

/** The same files with comments stripped, for checks about what the code does. */
const codeOnly = new Map([...contents].map(([path, source]) => [path, withoutComments(source)]));

/**
 * Code with module specifiers removed as well. Needed for the platform check,
 * where a path like `./io/document.js` would otherwise read as DOM access.
 * Imports are covered by the layering check instead.
 */
const bodyOnly = new Map(
  [...codeOnly].map(([path, source]) => [
    path,
    source.replace(/^\s*(import|export)[\s\S]*?from\s+'[^']+';/gm, ''),
  ]),
);

/** Layers, in dependency order. A layer may import from itself and anything above it. */
const LAYERS = ['core', 'clues', 'solving', 'content', 'generation', 'io', 'i18n'] as const;
const ALLOWED_IMPORTS: Record<(typeof LAYERS)[number], readonly string[]> = {
  core: ['core'],
  clues: ['core', 'clues'],
  solving: ['core', 'clues', 'solving'],
  content: ['core', 'content'],
  generation: ['core', 'clues', 'solving', 'content', 'generation'],
  io: ['core', 'io'],
  i18n: ['core', 'content', 'i18n'],
};

function layerOf(path: string): string | null {
  const top = path.split('/')[0];
  return top !== undefined && (LAYERS as readonly string[]).includes(top) ? top : null;
}

function importedPaths(source: string): string[] {
  return [...source.matchAll(/from\s+'(\.[^']+)'/g)].map((match) => match[1]!);
}

describe('library structure', () => {
  it('has source files', () => {
    expect(files.length).toBeGreaterThan(15);
  });

  it('reaches for no dependency at all, i18next in its own layer excepted', () => {
    const offenders: string[] = [];
    for (const [path, source] of codeOnly) {
      for (const match of source.matchAll(BARE_IMPORT)) {
        const specifier = match[1]!;
        if (specifier.startsWith('.')) continue;
        if (specifier === 'i18next' && path.startsWith('i18n/')) continue;
        offenders.push(`${path} -> ${specifier}`);
      }
    }
    // Stronger than reading a manifest, which is what this checked while the
    // engine was a package: a manifest states an intention, the imports are
    // the fact. Nothing outside i18n/ may reach for a bare specifier at all.
    expect(offenders).toEqual([]);
  });

  it('imports i18next only from the i18n layer', () => {
    for (const [path, source] of codeOnly) {
      if (path.startsWith('i18n/')) continue;
      expect(source, `${path} must not import i18next`).not.toMatch(/from\s+'i18next'/);
    }
  });

  it('imports no framework and no node built-in', () => {
    for (const [path, source] of codeOnly) {
      expect(source, `${path} must not import react`).not.toMatch(/from\s+'react/);
      expect(source, `${path} must not import a node built-in`).not.toMatch(/from\s+'node:/);
    }
  });

  it('touches no platform global', () => {
    const forbidden = [/\bdocument\./, /\bwindow\./, /\bprocess\./, /\bnavigator\./, /\blocalStorage\b/];
    for (const [path, source] of bodyOnly) {
      for (const pattern of forbidden) {
        expect(source, `${path} must stay platform-neutral (${String(pattern)})`).not.toMatch(pattern);
      }
    }
  });

  it('never uses Math.random — every choice flows through the seed', () => {
    for (const [path, source] of codeOnly) {
      expect(source, `${path} must use the seeded Rng`).not.toMatch(/Math\.random/);
    }
  });

  it('keeps time out of the deterministic core', () => {
    for (const [path, source] of codeOnly) {
      // Only the generator may read the clock, and only for the meta block.
      if (path === 'generation/generate.ts') continue;
      expect(source, `${path} must not read the clock`).not.toMatch(/Date\.now|new Date\(/);
    }
  });

  it('lets layers depend only downwards', () => {
    const violations: string[] = [];
    for (const [path, source] of codeOnly) {
      const layer = layerOf(path);
      if (!layer) continue;
      for (const specifier of importedPaths(source)) {
        const resolved = specifier.startsWith('../')
          ? specifier.replace(/^\.\.\//, '')
          : `${path.split('/').slice(0, -1).join('/')}/${specifier.replace('./', '')}`;
        const target = layerOf(resolved.replace(/^\.\//, ''));
        if (!target) continue;
        const allowed = ALLOWED_IMPORTS[layer as (typeof LAYERS)[number]];
        if (!allowed.includes(target)) violations.push(`${path} → ${target}`);
      }
    }
    expect(violations).toEqual([]);
  });
});

describe('language', () => {
  /**
   * Words that would only appear in German prose or identifiers. Deliberately
   * a small, unambiguous list: the point is to catch a relapse, not to prove
   * a negative.
   */
  const GERMAN_MARKERS = [
    'ae',
    'oe',
    'ue', // transliterated umlauts, as previously used in identifiers
    'raum',
    'zelle',
    'hinweis',
    'loesung',
    'verdaecht',
    'moerder',
    'opfer',
    'gitter',
    'regel',
    'pruef',
    'aufzaehl',
    'schluessel',
    'anzahl',
    'weil',
    'nicht',
    'jede',
    'eine',
    'kein',
    'wird',
    'muss',
    'dass',
    'oder',
    'und',
  ];

  it('is written in English throughout', () => {
    const offenders: string[] = [];
    for (const [path, source] of contents) {
      // Player-facing text lives in resource files: the clue patterns and each
      // theme's locales. German is expected there and nowhere else.
      const isResource =
        path.startsWith('i18n/resources/') || /^content\/themes\/[^/]+\/locales\//.test(path);
      const isGermanResource = path === 'i18n/resources/de.ts' || path.endsWith('/locales/de.ts');
      if (!isGermanResource && /[äöüßÄÖÜ]/.test(source)) {
        offenders.push(`${path}: contains umlauts`);
      }
      if (isResource) continue;

      for (const line of source.split('\n')) {
        const lower = line.toLowerCase();
        for (const marker of GERMAN_MARKERS) {
          // Whole-word match, so English words containing these letters pass.
          if (new RegExp(`\\b${marker}\\b`).test(lower)) {
            offenders.push(`${path}: "${marker}" in ${line.trim().slice(0, 60)}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
