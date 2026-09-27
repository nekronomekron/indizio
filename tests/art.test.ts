import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PORTRAIT_KEYS, THEMES } from '@engine';
import { HELP } from '../src/app/help.js';
import { artNames, artThemes, artUrl, hasArt } from '../src/app/render/art.js';
import { Sprite } from '../src/app/render/Sprite.js';
import { DEFAULT_FLOOR, FLOOR_MATERIALS, floorFlip, floorFor } from '../src/app/render/floors.js';

/**
 * Die Grafiken liegen als Dateien in `art/` und werden dort spaeter gegen die
 * endgueltigen ausgetauscht. Geprueft wird deshalb nicht, wie etwas gezeichnet
 * wird, sondern **dass jede Grafik da ist, die das Spiel anfordert** — eine
 * fehlende faellt sonst erst auf, wenn der Generator dieses Objekt zufaellig
 * einmal einbaut.
 */

const ART = join(process.cwd(), 'art');
const ICONS = ['ui-x', 'ui-eraser', 'ui-undo', 'ui-hint', 'ui-check', 'ui-timer', 'ui-victim', 'ui-note'];

/** Alle Dateien unter art/, als Pfade mit Schraegstrich. */
function allFiles(directory = ART): string[] {
  const out: string[] = [];
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, item.name);
    if (item.isDirectory()) out.push(...allFiles(full));
    else if (item.name.endsWith('.svg')) out.push(relative(ART, full).split(sep).join('/'));
  }
  return out;
}

const FILES = allFiles();

describe('Grafikdateien', () => {
  it('jede Grundflaeche jedes Objekts hat eine eigene Datei', () => {
    // Ein Bett quer ist eine andere Grafik als ein Bett laengs. Welche
    // Grundflaechen es gibt, bestimmt die Theme-Definition der Bibliothek.
    const fehlend: string[] = [];
    for (const theme of THEMES) {
      for (const object of theme.objects) {
        for (const [width, height] of object.footprints) {
          const datei = `themes/${theme.key}/objects/${object.key}_${width}x${height}.svg`;
          if (!FILES.includes(datei)) fehlend.push(datei);
        }
      }
    }
    expect(fehlend).toEqual([]);
  });

  it('die Zeichenflaeche passt zur Grundflaeche', () => {
    // Ein Tisch ueber drei Felder braucht 72 mal 24, sonst verzerrt ihn der
    // Renderer beim Einpassen.
    const falsch: string[] = [];
    for (const theme of THEMES) {
      for (const object of theme.objects) {
        for (const [width, height] of object.footprints) {
          const datei = `themes/${theme.key}/objects/${object.key}_${width}x${height}.svg`;
          if (!FILES.includes(datei)) continue;
          const erwartet = `viewBox="0 0 ${width * 24} ${height * 24}"`;
          if (!readFileSync(join(ART, datei), 'utf8').includes(erwartet)) falsch.push(datei);
        }
      }
    }
    expect(falsch).toEqual([]);
  });

  it('jeder Raum jedes Themes hat den Belag, den er braucht', () => {
    const fehlend: string[] = [];
    for (const theme of THEMES) {
      for (const room of theme.roomKeys) {
        const material = floorFor(room);
        if (!FILES.includes(`themes/${theme.key}/floors/${material}.svg`)) {
          fehlend.push(`${theme.key}/${room} (${material})`);
        }
      }
    }
    expect(fehlend).toEqual([]);
  });

  it('jeder Portraetschluessel und jedes Bediensymbol hat eine Datei', () => {
    for (const key of PORTRAIT_KEYS) {
      expect(FILES, 'Portraet ' + key).toContain(`common/characters/${key}.svg`);
    }
    for (const key of ICONS) {
      expect(FILES, 'Symbol ' + key).toContain(`common/icons/${key}.svg`);
    }
  });

  it('der Rueckfallbelag fuer fremde Themes liegt bereit', () => {
    expect(FILES).toContain(`common/floors/${DEFAULT_FLOOR}.svg`);
  });

  it('jedes Bild des Tutorials laesst sich aufloesen', () => {
    // Das Tutorial mischt alle drei Arten: Symbol, Requisite, Figur. Ohne die
    // Art im Schluessel greift es sonst ins Leere und zeigt eine leere Flaeche.
    const fehlend: string[] = [];
    for (const [locale, help] of Object.entries(HELP)) {
      for (const step of help.tutorial) {
        if (!hasArt(step.iconKind ?? 'objects', step.icon, step.iconTheme)) {
          fehlend.push(`${locale}/${step.icon}`);
        }
      }
    }
    expect(fehlend).toEqual([]);
  });

  it('keine Datei ohne Verwendung', () => {
    const gebraucht = new Set<string>([
      ...PORTRAIT_KEYS.map((key) => `common/characters/${key}.svg`),
      ...ICONS.map((key) => `common/icons/${key}.svg`),
      `common/floors/${DEFAULT_FLOOR}.svg`,
      ...THEMES.flatMap((theme) => [
        ...theme.objects.flatMap((object) => object.footprints.map(
          ([width, height]) => `themes/${theme.key}/objects/${object.key}_${width}x${height}.svg`,
        )),
        ...theme.roomKeys.map((room) => `themes/${theme.key}/floors/${floorFor(room)}.svg`),
      ]),
    ]);
    expect(FILES.filter((file) => !gebraucht.has(file))).toEqual([]);
  });

  it('jede Datei ist ein fuer sich stehendes SVG im 24er-Raster', () => {
    // 24 je Feld: eine Kachel ist 24x24, ein Tisch ueber drei Felder 72x24.
    const kaputt: string[] = [];
    for (const file of FILES) {
      const text = readFileSync(join(ART, file), 'utf8');
      const box = /viewBox="0 0 (\d+) (\d+)"/.exec(text);
      const ok = text.includes('<svg')
        && text.includes('xmlns="http://www.w3.org/2000/svg"')
        && box !== null
        && Number(box[1]) % 24 === 0 && Number(box[1]) > 0
        && Number(box[2]) % 24 === 0 && Number(box[2]) > 0
        && text.trimEnd().endsWith('</svg>')
        && text.length > 80;
      if (!ok) kaputt.push(file);
    }
    expect(kaputt).toEqual([]);
  });

  it('setzt nichts an eine negative Stelle', () => {
    // Der Streuwert der Bodenkacheln lief ueber `>>` ins Minus, und die Halme
    // landeten links neben dem Bild. Geprueft werden nur **absolute** Angaben:
    // ein negativer Schritt innerhalb eines Pfades (`l1.1 -3.2`) ist normal.
    const absolut = /(?:\s|")M\s*-|\s(?:x|y|cx|cy|x1|y1|x2|y2)="-/;
    const daneben = FILES.filter((file) => absolut.test(readFileSync(join(ART, file), 'utf8')));
    expect(daneben).toEqual([]);
  });
});

describe('Aufloesung der Grafiken', () => {
  it('kennt alle drei Themes', () => {
    expect(artThemes()).toEqual(THEMES.map((theme) => theme.key).sort());
  });

  it('nimmt die Grafik des Themes vor der gemeinsamen', () => {
    // 'chair' steht in Werkstatt und Wohnung - jedes Theme hat eine eigene
    // Datei, damit der Stuhl spaeter unterschiedlich aussehen darf.
    expect(hasArt('objects', 'chair_1x1', 'garage')).toBe(true);
    expect(hasArt('objects', 'chair_1x1', 'flat')).toBe(true);
    expect(artUrl('objects', 'chair_1x1')).toBeUndefined();
  });

  it('haelt die Grundflaechen desselben Objekts auseinander', () => {
    const quer = artUrl('objects', 'sofa_2x1', 'flat');
    const laengs = artUrl('objects', 'sofa_1x2', 'flat');
    expect(quer).toBeDefined();
    expect(laengs).toBeDefined();
    expect(quer).not.toBe(laengs);
  });

  it('haelt gleichnamige Requisite und Bodenbelag auseinander', () => {
    // In der Wohnung heisst beides 'carpet': der Teppich, auf dem jemand
    // steht, und der Teppichboden des Schlafzimmers. Ohne die Art im
    // Schluessel bekam das halbe Zimmer die Requisite als Boden ausgelegt.
    const requisite = artUrl('objects', 'carpet_2x1', 'flat');
    const belag = artUrl('floors', 'carpet', 'flat');
    expect(requisite).toBeDefined();
    expect(belag).toBeDefined();
    expect(requisite).not.toBe(belag);
  });

  it('faellt fuer Figuren und Symbole auf die gemeinsamen zurueck', () => {
    expect(artUrl('characters', 'p01', 'garden')).toBe(artUrl('characters', 'p01'));
    expect(artUrl('icons', 'ui-x', 'flat')).toBe(artUrl('icons', 'ui-x'));
  });

  it('meldet eine unbekannte Grafik, statt etwas Falsches zu liefern', () => {
    expect(artUrl('objects', 'raumschiff_1x1', 'garage')).toBeUndefined();
    expect(hasArt('objects', 'raumschiff_1x1')).toBe(false);
    // Eine Grundflaeche, die es nicht gibt, liefert nichts - der Sprite faellt
    // dann auf die flaechenlose Datei zurueck, sofern jemand eine ablegt.
    expect(artUrl('objects', 'bed_9x9', 'flat')).toBeUndefined();
    // Eine Requisite ist kein Bodenbelag, auch wenn es sie gibt.
    expect(artUrl('floors', 'bathtub_2x1', 'flat')).toBeUndefined();
  });

  it('liefert Bilddaten, die ein Browser direkt anzeigt', () => {
    const url = artUrl('objects', 'tree_1x1', 'garden');
    expect(url).toMatch(/^data:image\/svg\+xml,/);
    expect(decodeURIComponent(url!)).toContain('<svg');
  });

  it('listet je Art und Theme die passenden Namen', () => {
    const namen = artNames('objects', 'garden');
    expect(namen).toContain('tree_1x1');
    expect(namen).not.toContain('car_2x2');
    expect(namen).not.toContain('p01');
    expect(artNames('characters')).toContain('p01');
  });
});

describe('Sprite waehlt die Grundflaeche', () => {
  const markup = (props: Record<string, unknown>): string =>
    renderToStaticMarkup(createElement(Sprite, props as never));

  it('nimmt die Datei fuer genau diese Grundflaeche', () => {
    const quer = markup({ name: 'sofa', theme: 'flat', footprint: [2, 1] });
    const laengs = markup({ name: 'sofa', theme: 'flat', footprint: [1, 2] });
    expect(quer).toContain('<img');
    expect(quer).not.toBe(laengs);
    expect(decodeURIComponent(quer)).toContain('viewBox="0 0 48 24"');
    expect(decodeURIComponent(laengs)).toContain('viewBox="0 0 24 48"');
  });

  it('uebernimmt die Pixelmasse der Flaeche', () => {
    const html = markup({ name: 'kitchenunit', theme: 'flat', footprint: [3, 1], width: 96, height: 32 });
    expect(html).toContain('width="96"');
    expect(html).toContain('height="32"');
  });

  it('faellt auf die flaechenlose Datei zurueck', () => {
    // Eine Grafikerin darf eine einzige Datei fuer alle Flaechen abgeben.
    // 'p01' liegt flaechenlos in common - stellvertretend fuer diesen Fall.
    const html = markup({ name: 'p01', kind: 'characters', footprint: [2, 1] });
    expect(html).toContain('<img');
    expect(html).toBe(markup({ name: 'p01', kind: 'characters' }));
  });

  it('laesst die Flaeche leer, wenn es gar nichts gibt', () => {
    const html = markup({ name: 'raumschiff', theme: 'garage', footprint: [2, 1], width: 40, height: 20 });
    expect(html).not.toContain('<img');
    expect(html).toContain('<span');
  });
});

describe('Bodenbelaege', () => {
  it('jeder Belag wird von mindestens einem Raum gebraucht', () => {
    const benutzt = new Set(THEMES.flatMap((theme) => theme.roomKeys.map(floorFor)));
    benutzt.add(DEFAULT_FLOOR);
    expect(FLOOR_MATERIALS.filter((material) => !benutzt.has(material))).toEqual([]);
  });

  it('spiegelt nur Belaege ohne durchlaufendes Muster', () => {
    // Dielenstoesse und Fugen muessen sich an der Kachelkante treffen; ein
    // gespiegelter Nachbar wuerde sie zerschneiden.
    for (const material of ['wood', 'tile', 'stone', 'concrete', 'carpet', 'water'] as const) {
      for (let cell = 0; cell < 40; cell++) {
        expect(floorFlip(material, cell), material).toEqual({ x: 1, y: 1 });
      }
    }
  });

  it('streut Gras, Kies, Sand und Erde ueber das Gitter', () => {
    for (const material of ['grass', 'gravel', 'sand', 'soil'] as const) {
      const varianten = new Set(
        Array.from({ length: 40 }, (_, cell) => JSON.stringify(floorFlip(material, cell))),
      );
      expect(varianten.size, material).toBeGreaterThan(1);
    }
  });

  it('dieselbe Zelle sieht immer gleich aus', () => {
    expect(floorFlip('grass', 42)).toEqual(floorFlip('grass', 42));
  });
});
