import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { THEMES } from '@engine';
import { DEFAULT_FLOOR, floorFor } from '../src/app/shared/art/floors.js';
import type { FloorMaterial } from '../src/app/shared/art/floors.js';
import { CHARACTER_SHAPES } from './art/characters.js';
import { FloorTile } from './art/floors.js';
import { ICON_SHAPES } from './art/icons.js';
import { OBJECT_SHAPES } from './art/objects.js';

/**
 * Schreibt die Platzhaltergrafiken als echte SVG-Dateien nach `art/`.
 *
 * Laeuft **nur waehrend der Entwicklung**. Im Spiel wird nichts mehr gezeichnet:
 * die App liest ausschliesslich die Dateien, die hier entstehen. Wer eine
 * Grafik austauschen will, ersetzt die Datei — Code aendert sich dabei nicht.
 *
 * Aufteilung nach Themes, weil jedes Theme spaeter ein eigenes Grafikset
 * bekommt. Zwei Themes koennen denselben Objektschluessel benutzen (`chair`
 * steht in Werkstatt und Wohnung); jedes bekommt trotzdem eine eigene Datei,
 * damit ein Stuhl in der Werkstatt anders aussehen darf als im Wohnzimmer.
 *
 * Requisiten bekommen **je Grundflaeche eine Datei**: `bed_2x1.svg` neben
 * `bed_1x2.svg`. Der Name traegt Breite und Hoehe in Feldern, die Zeichenflaeche
 * ist entsprechend gross (24 je Feld). So kann ein Bett quer anders aussehen
 * als laengs, statt ein gedrehtes Quadrat zu sein.
 *
 * Verlegte Requisiten (Teppich, Matte) haben stattdessen **ein Blatt**
 * `tiles/<key>.svg` mit 48 × 72: daraus setzt das Spiel jede Form aus Vierteln
 * zusammen (PLAN.md §13.4, `src/app/render/tiles.ts`).
 *
 * ```bash
 * npm run art           # nur fehlende und eigene Platzhalter schreiben
 * npm run art -- --force  # auch ersetzte Grafiken ueberschreiben
 * ```
 */

/** Steht in jeder erzeugten Datei. Fehlt er, stammt die Datei von jemand anderem. */
const MARKER = '<!-- indizio:placeholder -->';

// npm-Skripte laufen im Projektstamm, deshalb reicht der Arbeitsordner.
const ART = join(process.cwd(), 'art');
const force = process.argv.includes('--force');

interface Entry {
  path: string;
  markup: string;
  width?: number;
  height?: number;
}

/** Kantenlaenge eines Feldes in der Zeichenflaeche. */
const UNIT = 24;

/**
 * Eine Form als vollstaendiges, fuer sich stehendes SVG-Dokument.
 *
 * Die Zeichenflaeche folgt der Grundflaeche: ein Objekt ueber drei Felder
 * bekommt 72 breit statt 24, sonst muesste der Renderer es verzerren.
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
 * Platzhalter fuer eine Requisite auf einer bestimmten Grundflaeche.
 *
 * Eine Platte in der Groesse der Grundflaeche, darauf das Sinnbild in seiner
 * natuerlichen Groesse. Damit zeigt der Platzhalter beides: **wie viel Platz**
 * das Objekt belegt und **welches** es ist — ohne dass jede der 54 Varianten von
 * Hand gezeichnet werden muesste. Die endgueltigen Grafiken fuellen ihre
 * Flaeche selbst aus; diese hier sind erklaertermassen Stellvertreter.
 *
 * Die Platte nimmt den Ton der ersten Flaeche des Sinnbilds. Das ist grob, aber
 * es macht eine Werkbank braun und einen Teich blau, und zwar ohne eine zweite
 * Liste, die veralten kann.
 */
function placeholder(icon: string, width: number, height: number): string {
  const w = width * UNIT;
  const h = height * UNIT;
  const tone = /fill="(#[0-9a-f]{3,8})"/i.exec(icon)?.[1] ?? '#6b6580';
  // Eingerueckt, damit die Kachel darunter als Rahmen sichtbar bleibt: sie
  // zeigt, ob jemand auf dem Objekt stehen darf.
  const inset = 2;
  const plate = `<rect x="${String(inset)}" y="${String(inset)}" width="${String(w - inset * 2)}" height="${String(h - inset * 2)}" rx="4" fill="${tone}" fill-opacity="0.55"/>`;
  const centred = `<g transform="translate(${String((w - UNIT) / 2)} ${String((h - UNIT) / 2)})">${icon}</g>`;
  return plate + centred;
}

/** Ein Rechteck `size` × `size` ab (x, y), an jeder Ecke um `notch` eingekerbt. */
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
 * Platzhalter-Blatt fuer eine verlegte Requisite, 2 × 3 Felder (PLAN.md §13.4).
 *
 * ```
 * [ Einzelfeld ][ Innenecken ]   Zeile 0
 * [   2×2-Block: Aussenecken,  ]  Zeilen 1–2
 * [   Kanten und Fuellung      ]
 * ```
 *
 * Ein Rand im Ton des Sinnbilds, innen ein zweiter Ton — so zeigt die fertige
 * Form auf dem Brett ihren Umriss, auch um Ecken herum. Aussen bleiben 2
 * Einheiten Luft, damit der Boden als Rahmen sichtbar bleibt; die Innenecken
 * sind um genau diese 2 (Rand) und 5 (Innenfeld) eingekerbt, damit sie an die
 * Kanten der Nachbarn anschliessen.
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

// --- Figuren und Bediensymbole: themenunabhaengig ---------------------------
for (const [key, node] of Object.entries(CHARACTER_SHAPES)) {
  files.push({ path: join('common', 'characters', key + '.svg'), markup: shape(node) });
}
for (const [key, node] of Object.entries(ICON_SHAPES)) {
  files.push({ path: join('common', 'icons', key + '.svg'), markup: shape(node) });
}

// Rueckfallbelag fuer Themes, die die App nicht kennt.
files.push({
  path: join('common', 'floors', DEFAULT_FLOOR + '.svg'),
  markup: shape(createElement(FloorTile, { material: DEFAULT_FLOOR })),
});

// --- Je Theme: seine Objekte und die Belaege seiner Raeume -------------------
for (const theme of THEMES) {
  for (const object of theme.objects) {
    const node = OBJECT_SHAPES[object.key];
    if (!node) throw new Error(`Keine Platzhalterform fuer ${theme.key}/${object.key}`);
    const icon = shape(node);

    // Verlegt: ein Blatt, aus dem das Spiel jede Form zusammensetzt.
    if (object.placement.kind === 'tiled') {
      files.push({
        path: join('themes', theme.key, 'tiles', `${object.key}.svg`),
        markup: tileSheet(icon),
        width: 2,
        height: 3,
      });
      continue;
    }

    // Je zulaessiger Grundflaeche eine Datei. Welche es gibt, bestimmt die
    // Theme-Definition der Bibliothek - hier wird nichts geraten.
    for (const [width, height] of object.placement.footprints) {
      files.push({
        path: join('themes', theme.key, 'objects', `${object.key}_${String(width)}x${String(height)}.svg`),
        markup: placeholder(icon, width, height),
        width,
        height,
      });
    }
  }

  const materials = new Set<FloorMaterial>(theme.roomKeys.map(floorFor));
  for (const material of materials) {
    files.push({
      path: join('themes', theme.key, 'floors', material + '.svg'),
      markup: shape(createElement(FloorTile, { material })),
    });
  }
}

// --- Schreiben, aber fremde Grafiken nicht ueberfahren ----------------------
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

  // Eine Datei ohne Marker hat jemand ersetzt. Die ist mehr wert als ein
  // Platzhalter und wird nur auf ausdruecklichen Wunsch ueberschrieben.
  if (existing !== null && !existing.includes(MARKER) && !force) {
    kept.push(entry.path);
    continue;
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, svgDocument(entry.markup, entry.width, entry.height));
  written.push(entry.path);
}

// --- Verwaiste Platzhalter entfernen ----------------------------------------
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
    // Auch hier gilt: nur eigene Platzhalter aufraeumen, nichts Fremdes.
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
