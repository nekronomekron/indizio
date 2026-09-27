import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { THEMES } from '@indizio/puzzle';
import { DEFAULT_FLOOR, floorFor } from '../src/app/render/floors.js';
import type { FloorMaterial } from '../src/app/render/floors.js';
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

interface Entry { path: string; markup: string; width?: number; height?: number }

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

    // Je zulaessiger Grundflaeche eine Datei. Welche es gibt, bestimmt die
    // Theme-Definition der Bibliothek - hier wird nichts geraten.
    for (const [width, height] of object.footprints) {
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
    if (item.isDirectory()) { sweep(full); continue; }
    if (!item.name.endsWith('.svg') || wanted.has(full)) continue;
    // Auch hier gilt: nur eigene Platzhalter aufraeumen, nichts Fremdes.
    if (!readFileSync(full, 'utf8').includes(MARKER) && !force) continue;
    rmSync(full);
    removed.push(relative(ART, full));
  }
}
sweep(ART);

console.log(`art/: ${String(written.length)} geschrieben, ${String(kept.length)} eigene behalten, ${String(removed.length)} verwaiste entfernt`);
if (kept.length > 0) console.log('  behalten:', kept.join(', '));
if (removed.length > 0) console.log('  entfernt:', removed.join(', '));
