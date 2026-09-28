import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Every drawing in `art/` on one sheet — to look at, not for the build.
 *
 * Reads the *files*, not the placeholder sources. So the sheet shows exactly
 * what appears in the game, even after someone replaced a file.
 *
 * ```bash
 * npm run art:sheet -- art-sheet.svg
 * ```
 */

const ART = join(process.cwd(), 'art');
const BOX = 72; // Side of the picture tile; CELL leaves room for the name
const CELL = 92;
const COLUMNS = 10;

function files(directory: string): string[] {
  const out: string[] = [];
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, item.name);
    if (item.isDirectory()) out.push(...files(full));
    else if (item.name.endsWith('.svg')) out.push(relative(ART, full).split(sep).join('/'));
  }
  return out;
}

interface Art {
  inner: string;
  width: number;
  height: number;
}

/**
 * Content and drawing area of a file.
 *
 * The area is read along because props differ in width by footprint: a `3x1`
 * measures 72 by 24. At a fixed scale it would run over its tile on the sheet.
 */
function read(path: string): Art {
  const text = readFileSync(join(ART, path), 'utf8');
  const box = /viewBox="0 0 (\d+) (\d+)"/.exec(text);
  return {
    inner: text
      .replace(/^[\s\S]*?<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim(),
    width: Number(box?.[1] ?? 24),
    height: Number(box?.[2] ?? 24),
  };
}

const groups = new Map<string, string[]>();
for (const file of files(ART)) {
  const folder = file.slice(0, file.lastIndexOf('/'));
  const list = groups.get(folder) ?? [];
  list.push(file);
  groups.set(folder, list);
}

const parts: string[] = [];
let y = 30;

for (const [folder, list] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
  parts.push(
    `<text x="14" y="${String(y)}" font-family="system-ui" font-size="13" font-weight="600" fill="#ece9f5">${folder}</text>`,
  );
  y += 14;

  list.sort().forEach((file, i) => {
    const x = (i % COLUMNS) * CELL + 14;
    const top = y + Math.floor(i / COLUMNS) * CELL;
    const name = file.slice(file.lastIndexOf('/') + 1, -4);
    const art = read(file);

    // As large as possible without leaving the tile, and centred in it. A wide
    // object comes out flatter than a square one — rightly so, since that is
    // how it takes its place in the game.
    const scale = Math.min(BOX / art.width, BOX / art.height);
    const left = x + 6 + (BOX - art.width * scale) / 2;
    const topInset = top + 6 + (BOX - art.height * scale) / 2;

    parts.push(
      `<rect x="${String(x)}" y="${String(top)}" width="${String(BOX)}" height="${String(BOX)}" rx="6" fill="#2a2438"/>` +
        `<g transform="translate(${left.toFixed(1)} ${topInset.toFixed(1)}) scale(${scale.toFixed(3)})">${art.inner}</g>` +
        `<text x="${String(x + BOX / 2)}" y="${String(top + 86)}" text-anchor="middle" font-family="system-ui" font-size="9" fill="#b9b4c8">${name}</text>`,
    );
  });

  y += Math.ceil(list.length / COLUMNS) * CELL + 16;
}

const width = COLUMNS * CELL + 28;
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(y)}" viewBox="0 0 ${String(width)} ${String(y)}">
<rect width="100%" height="100%" fill="#1c1828"/>
${parts.join('\n')}
</svg>
`;

const target = process.argv[2] ?? 'art-sheet.svg';
writeFileSync(target, sheet);
console.log('geschrieben:', target, '|', [...groups.values()].flat().length, 'Grafiken');
