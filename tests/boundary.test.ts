import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Die Grenze um die Engine.
 *
 * Solange der Generator ein eigenes Paket war, hielt die Paketgrenze seine
 * Schnittstelle zusammen: `exports` in der package.json liess nur `.` und
 * `./i18n` durch, an `solving/solve.js` kam niemand. Im selben Projekt gibt es
 * diesen Schutz nicht mehr — ein `import { solve } from '../engine/solving/solve.js'`
 * wäre technisch tadellos und trotzdem genau das, was der Umzug nicht kosten
 * sollte.
 *
 * Also steht die Grenze hier. Die eslint-Regel in eslint.config.js sagt dasselbe
 * beim Schreiben; dieser Test sagt es auch dann, wenn jemand den Linter
 * überspringt oder eine Regel abschaltet.
 *
 * Nach *innen* schaut tests/engine/architecture.test.ts: dort geht es darum,
 * dass die Engine selbst nach nichts greift.
 */

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** Die einzigen beiden Anschriften der Engine. */
const DOORS: readonly string[] = ['@engine', '@engine/i18n'];

/** Was durchsucht wird, und was davon selbst zur Engine gehört. */
const SCAN = ['src', 'scripts', 'tests'];
const INSIDE = ['src/engine', 'tests/engine'];

const IMPORT = /from\s+'([^']+)'/g;
/** Spezifizierer, die überhaupt in Richtung Engine zeigen. */
const TOWARDS_ENGINE = /^@engine|(^|\/)engine(\/|$)/;

/**
 * Kommentare dürfen besprechen, was der Code nicht tun darf — dafür sind sie
 * da, und der Kommentarkopf dieser Datei tut es selbst. Geprüft wird deshalb
 * nur Code. (Derselbe Grund wie in tests/engine/architecture.test.ts.)
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

describe('Grenze der Engine', () => {
  it('hat genau zwei Türen, und beide existieren', () => {
    expect(statSync(join(ROOT, 'src/engine/index.ts')).isFile()).toBe(true);
    expect(statSync(join(ROOT, 'src/engine/i18n/index.ts')).isFile()).toBe(true);
  });

  it('durchsucht überhaupt etwas', () => {
    // Ohne diese Zusicherung wäre der Test auch dann grün, wenn er aus Versehen
    // keine einzige Datei liest — der häufigste Weg, auf dem ein Wächter
    // aufhört zu wachen, ohne rot zu werden.
    expect(outside.size).toBeGreaterThan(20);
  });

  it('wird von außen nur über die Türen benutzt', () => {
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
    // Und die Türen werden auch wirklich benutzt: sonst hätte jemand die App
    // von der Engine abgeschnitten und dieser Test es nicht bemerkt.
    expect(users).toBeGreaterThan(10);
  });
});
