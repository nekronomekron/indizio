import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The boundary around the engine.
 *
 * While the generator was a package of its own, the package boundary held its
 * interface together: `exports` in its package.json let through only `.` and
 * `./i18n`, and nobody got at `solving/solve.js`. Within one project that
 * protection is gone — `import { solve } from '../engine/solving/solve.js'`
 * would be technically fine and still exactly what the move was not meant to
 * cost.
 *
 * So the boundary is kept here. The ESLint rule in eslint.config.js says the
 * same while writing; this test says it even when someone skips the linter or
 * switches a rule off.
 *
 * tests/engine/architecture.test.ts looks *inward*: that the engine itself
 * reaches for nothing.
 */

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** The engine's only two addresses. */
const DOORS: readonly string[] = ['@engine', '@engine/i18n'];

/** What is scanned, and which of it belongs to the engine itself. */
const SCAN = ['src', 'scripts', 'tests'];
const INSIDE = ['src/engine', 'tests/engine'];

const IMPORT = /from\s+'([^']+)'/g;
/** Specifiers pointing towards the engine at all. */
const TOWARDS_ENGINE = /^@engine|(^|\/)engine(\/|$)/;

/**
 * Comments may discuss what the code must not do — that is what they are for,
 * and this file's header does it itself. So only code is checked. (Same reason
 * as in tests/engine/architecture.test.ts.)
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function sourceFiles(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) found.push(...sourceFiles(path));
    else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) found.push(path);
  }
  return found;
}

function repoPath(absolute: string): string {
  return relative(ROOT, absolute).split(sep).join('/');
}

const outside = new Map<string, string>();
for (const top of SCAN) {
  for (const absolute of sourceFiles(join(ROOT, top))) {
    const path = repoPath(absolute);
    if (INSIDE.some((inner) => path.startsWith(inner + '/'))) continue;
    outside.set(path, withoutComments(readFileSync(absolute, 'utf8')));
  }
}

describe('engine boundary', () => {
  it('has exactly two doors, and both exist', () => {
    expect(statSync(join(ROOT, 'src/engine/index.ts')).isFile()).toBe(true);
    expect(statSync(join(ROOT, 'src/engine/i18n/index.ts')).isFile()).toBe(true);
  });

  it('scans anything at all', () => {
    // Without this the test would also be green when it accidentally reads no
    // file at all — the most common way for a guard to stop guarding without
    // turning red.
    expect(outside.size).toBeGreaterThan(20);
  });

  it('is used from outside only through its doors', () => {
    const violations: string[] = [];
    let users = 0;
    for (const [path, source] of outside) {
      for (const match of source.matchAll(IMPORT)) {
        const specifier = match[1] ?? '';
        if (!TOWARDS_ENGINE.test(specifier)) continue;
        if (DOORS.includes(specifier)) {
          users++;
          continue;
        }
        violations.push(path + ' -> ' + specifier);
      }
    }
    expect(violations).toEqual([]);
    // And the doors really are used: otherwise someone could have cut the app
    // off from the engine without this test noticing.
    expect(users).toBeGreaterThan(10);
  });
});

/**
 * The app is grouped by feature (PLAN.md §14, U5). A feature may use `shared/`
 * but never another feature — otherwise the folders stop meaning anything and
 * a change to one screen quietly breaks another. `shared/` knows no feature.
 */
describe('feature boundaries', () => {
  const APP = 'src/app/';
  const FEATURES = APP + 'features/';
  const SHARED = APP + 'shared/';

  /** `features/<name>` of a repo path, or null outside the features. */
  function featureOf(path: string): string | null {
    if (!path.startsWith(FEATURES)) return null;
    return path.slice(FEATURES.length).split('/')[0] ?? null;
  }

  /** Repo path a relative import points at, or null for a package import. */
  function target(importer: string, specifier: string): string | null {
    if (!specifier.startsWith('.')) return null;
    const parts = importer.split('/').slice(0, -1);
    for (const part of specifier.split('/')) {
      if (part === '..') parts.pop();
      else if (part !== '.') parts.push(part);
    }
    return parts.join('/');
  }

  const appFiles = [...outside].filter(([path]) => path.startsWith(APP));

  it('scans the features', () => {
    expect(appFiles.filter(([path]) => featureOf(path) !== null).length).toBeGreaterThan(10);
  });

  it('keeps each feature out of the others', () => {
    const violations: string[] = [];
    for (const [path, source] of appFiles) {
      const own = featureOf(path);
      if (own === null) continue;
      for (const match of source.matchAll(IMPORT)) {
        const to = target(path, match[1] ?? '');
        const other = to === null ? null : featureOf(to);
        if (other !== null && other !== own) violations.push(`${path} -> ${match[1] ?? ''}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('keeps shared code free of features', () => {
    const violations: string[] = [];
    for (const [path, source] of appFiles) {
      if (!path.startsWith(SHARED)) continue;
      for (const match of source.matchAll(IMPORT)) {
        const to = target(path, match[1] ?? '');
        if (to?.startsWith(FEATURES)) violations.push(`${path} -> ${match[1] ?? ''}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
