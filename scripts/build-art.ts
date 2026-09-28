import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { THEMES } from '@engine';
import { DEFAULT_FLOOR } from '../src/app/shared/art/floors.js';
import { CHARACTER_SHAPES } from './art/characters.js';
import { FloorTile } from './art/floors.js';
import { ICON_SHAPES } from './art/icons.js';
import { PLACEHOLDER_SHAPES } from './art/themes/index.js';

/**
 * Writes the placeholder drawings as real SVG files into `art/`.
 *
 * Runs *during development only*. The game draws nothing: the app reads only
 * the files made here. Replacing a drawing means replacing the file — no code
 * changes.
 *
 * Split by theme, because every theme will get its own drawings. Two themes
 * may use the same object key (`chair` is in the car repair shop and the
 * flat); each still gets its own file, so a workshop chair may look different
 * from a living-room chair.
 *
 * Props get *one file per footprint*: `bed_2x1.svg` next to `bed_1x2.svg`. The
 * name carries width and height in cells; the drawing area is sized to match
 * (24 per cell). So a bed across can look different from a bed lengthways
 * instead of being a rotated square.
 *
 * Laid props (carpet, mat) get *one sheet* `tiles/<key>.svg` of 48 × 72
 * instead, from which the game assembles any shape in quarters (PLAN.md
 * §13.4, `src/app/features/game/board/tiles.ts`).
 *
 * ```bash
 * npm run art           # write missing placeholders and our own
 * npm run art -- --force  # overwrite replaced drawings too
 * ```
 */

/** In every generated file. When it is missing, the file came from someone else. */
const MARKER = '<!-- indizio:placeholder -->';

// npm scripts run in the project root, so the working directory will do.
const ART = join(process.cwd(), 'art');
const force = process.argv.includes('--force');

interface Entry {
  path: string;
  markup: string;
  width?: number;
  height?: number;
}

/** Side of one cell in drawing units. */
const UNIT = 24;

/**
 * A shape as a complete, standalone SVG document.
 *
 * The drawing area follows the footprint: an object over three cells gets 72
 * wide instead of 24, or the renderer would have to stretch it.
 */
function svgDocument(inner: string, width = 1, height = 1): string {
  const w = width * UNIT;
  const h = height * UNIT;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(w)} ${String(h)}" width="${String(w)}" height="${String(h)}">
  ${MARKER}
  ${inner.trim()}
</svg>
`;
}

/**
 * Placeholder for a prop on a particular footprint.
 *
 * A plate the size of the footprint with the symbol at its natural size on it.
 * So the placeholder shows both *how much space* the object takes and *which*
 * it is — without drawing every footprint by hand. The final drawings fill
 * their area themselves; these are admittedly stand-ins.
 *
 * The plate takes the colour of the symbol's first shape. Crude, but it makes a
 * workbench brown and a pond blue without a second list that can go stale.
 */
function placeholder(icon: string, width: number, height: number): string {
  const w = width * UNIT;
  const h = height * UNIT;
  const tone = /fill="(#[0-9a-f]{3,8})"/i.exec(icon)?.[1] ?? '#6b6580';
  // Inset, so the tile beneath stays visible as a frame: it shows whether
  // anyone may stand on the object.
  const inset = 2;
  const plate = `<rect x="${String(inset)}" y="${String(inset)}" width="${String(w - inset * 2)}" height="${String(h - inset * 2)}" rx="4" fill="${tone}" fill-opacity="0.55"/>`;
  const centred = `<g transform="translate(${String((w - UNIT) / 2)} ${String((h - UNIT) / 2)})">${icon}</g>`;
  return plate + centred;
}

/** A `size` × `size` square from (x, y), notched by `notch` at every corner. */
function notched(x: number, y: number, size: number, notch: number): string {
  const a = x + notch;
  const b = x + size - notch;
  const c = y + notch;
  const d = y + size - notch;
  const r = x + size;
  const u = y + size;
  const points = [
    [a, y],
    [b, y],
    [b, c],
    [r, c],
    [r, d],
    [b, d],
    [b, u],
    [a, u],
    [a, d],
    [x, d],
    [x, c],
    [a, c],
  ];
  return 'M' + points.map(([px, py]) => `${String(px)} ${String(py)}`).join('L') + 'Z';
}

/**
 * Placeholder sheet for a laid prop, 2 × 3 cells (PLAN.md §13.4).
 *
 * ```
 * [ single cell ][ inner corners ]   row 0
 * [   2×2 block: outer corners,   ]  rows 1–2
 * [   edges and fill              ]
 * ```
 *
 * A border in the symbol's colour, a second colour inside — so the finished
 * shape shows its outline on the board, around corners too. Outside there are
 * 2 units of air so the floor stays visible as a frame; the inner corners are
 * notched by exactly those 2 (border) and 5 (inner area) so they meet the
 * neighbours' edges.
 */
function tileSheet(icon: string): string {
  const fills = [...icon.matchAll(/fill="(#[0-9a-f]{3,8})"/gi)].map((match) => match[1]!);
  const tone = fills[0] ?? '#6b6580';
  const inner = fills.find((fill) => fill.toLowerCase() !== tone.toLowerCase()) ?? tone;
  const border = 2;
  const band = 5;
  const single = placeholder(icon, 1, 1);
  const corners =
    `<path d="${notched(24, 0, 24, border)}" fill="${tone}"/>` +
    `<path d="${notched(24, 0, 24, band)}" fill="${inner}" fill-opacity="0.8"/>`;
  const block =
    `<rect x="${String(border)}" y="${String(24 + border)}" width="${String(48 - border * 2)}" height="${String(48 - border * 2)}" rx="4" fill="${tone}"/>` +
    `<rect x="${String(band)}" y="${String(24 + band)}" width="${String(48 - band * 2)}" height="${String(48 - band * 2)}" rx="2" fill="${inner}" fill-opacity="0.8"/>`;
  return single + corners + block;
}

function shape(node: unknown): string {
  return renderToStaticMarkup(createElement('g', null, node as never))
    .replace(/^<g>/, '')
    .replace(/<\/g>$/, '');
}

const files: Entry[] = [];

// --- Characters and icons: shared by every theme ----------------------------
for (const [key, node] of Object.entries(CHARACTER_SHAPES)) {
  files.push({ path: join('common', 'characters', key + '.svg'), markup: shape(node) });
}
for (const [key, node] of Object.entries(ICON_SHAPES)) {
  files.push({ path: join('common', 'icons', key + '.svg'), markup: shape(node) });
}

// Fallback floor for themes the app does not know.
files.push({
  path: join('common', 'floors', DEFAULT_FLOOR + '.svg'),
  markup: shape(createElement(FloorTile, { material: DEFAULT_FLOOR })),
});

// --- Per theme: its objects and the floors of its rooms ---------------------
for (const theme of THEMES) {
  for (const object of theme.objects) {
    const node = PLACEHOLDER_SHAPES[theme.key]?.[object.key];
    if (!node) throw new Error(`No placeholder shape for ${theme.key}/${object.key}`);
    const icon = shape(node);

    // Laid: one sheet from which the game assembles any shape.
    if (object.placement.kind === 'tiled') {
      files.push({
        path: join('themes', theme.key, 'tiles', `${object.key}.svg`),
        markup: tileSheet(icon),
        width: 2,
        height: 3,
      });
      continue;
    }

    // One file per allowed footprint. Which ones exist is up to the engine's
    // theme definition — nothing is guessed here.
    for (const [width, height] of object.placement.footprints) {
      files.push({
        path: join('themes', theme.key, 'objects', `${object.key}_${String(width)}x${String(height)}.svg`),
        markup: placeholder(icon, width, height),
        width,
        height,
      });
    }
  }

  const materials = new Set(theme.rooms.map((room) => room.floor));
  for (const material of materials) {
    files.push({
      path: join('themes', theme.key, 'floors', material + '.svg'),
      markup: shape(createElement(FloorTile, { material })),
    });
  }
}

// --- Write, but never overwrite someone else's drawing ----------------------
mkdirSync(ART, { recursive: true });
const written: string[] = [];
const kept: string[] = [];

for (const entry of files) {
  const target = join(ART, entry.path);
  let existing: string | null = null;
  try {
    existing = readFileSync(target, 'utf8');
  } catch {
    existing = null;
  }

  // A file without the marker was replaced by someone. It is worth more than
  // a placeholder and is only overwritten when explicitly asked.
  if (existing !== null && !existing.includes(MARKER) && !force) {
    kept.push(entry.path);
    continue;
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, svgDocument(entry.markup, entry.width, entry.height));
  written.push(entry.path);
}

// --- Remove orphaned placeholders -------------------------------------------
const wanted = new Set(files.map((entry) => join(ART, entry.path)));
const removed: string[] = [];

function sweep(directory: string): void {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, item.name);
    if (item.isDirectory()) {
      sweep(full);
      continue;
    }
    if (!item.name.endsWith('.svg') || wanted.has(full)) continue;
    // Here too: only clean up our own placeholders, nothing else.
    if (!readFileSync(full, 'utf8').includes(MARKER) && !force) continue;
    rmSync(full);
    removed.push(relative(ART, full));
  }
}
sweep(ART);

console.log(
  `art/: ${String(written.length)} geschrieben, ${String(kept.length)} eigene behalten, ${String(removed.length)} verwaiste entfernt`,
);
if (kept.length > 0) console.log('  behalten:', kept.join(', '));
if (removed.length > 0) console.log('  entfernt:', removed.join(', '));
