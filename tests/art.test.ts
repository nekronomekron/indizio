import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PORTRAIT_KEYS, THEMES } from '@engine';
import { PLACEHOLDER_SHAPES } from '../scripts/art/themes/index.js';
import { TUTORIAL_ICONS } from '../src/app/shared/help/tutorialIcons.js';
import { RESOURCES } from '../src/app/shared/i18n/i18n.js';
import { artNames, artThemes, artUrl, hasArt } from '../src/app/shared/art/art.js';
import { Sprite } from '../src/app/shared/art/Sprite.js';
import { DEFAULT_FLOOR, FLOOR_MATERIALS, floorFlip, floorFor } from '../src/app/shared/art/floors.js';

/**
 * The drawings are files in `art/` and will be replaced there by the final
 * ones. So what is tested is not how anything is drawn, but *that every drawing
 * the game asks for is there* — a missing one would otherwise only show when
 * the generator happens to use that object.
 */

const ART = join(process.cwd(), 'art');
const ICONS = ['ui-x', 'ui-eraser', 'ui-undo', 'ui-hint', 'ui-check', 'ui-timer', 'ui-victim', 'ui-note'];

/** Every file under art/, as a forward-slash path. */
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

describe('drawing files', () => {
  it('give every footprint of every object a file of its own', () => {
    // A bed across is a different drawing from a bed lengthways. Which
    // footprints exist is up to the engine's theme definition.
    const missing: string[] = [];
    for (const theme of THEMES) {
      for (const object of theme.objects) {
        if (object.placement.kind !== 'fixed') continue;
        for (const [width, height] of object.placement.footprints) {
          const file = `themes/${theme.key}/objects/${object.key}_${width}x${height}.svg`;
          if (!FILES.includes(file)) missing.push(file);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('give every laid prop a sheet of 2 by 3 cells', () => {
    // The game assembles any shape from quarters of the sheet (PLAN.md §13.4).
    // Another drawing area would shift every quarter.
    const wrong: string[] = [];
    for (const theme of THEMES) {
      for (const object of theme.objects) {
        if (object.placement.kind !== 'tiled') continue;
        const file = `themes/${theme.key}/tiles/${object.key}.svg`;
        if (!FILES.includes(file)) wrong.push(file + ' missing');
        else if (!readFileSync(join(ART, file), 'utf8').includes('viewBox="0 0 48 72"')) wrong.push(file);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('size the drawing area to the footprint', () => {
    // A table over three cells needs 72 by 24, or the renderer distorts it
    // when fitting it in.
    const wrong: string[] = [];
    for (const theme of THEMES) {
      for (const object of theme.objects) {
        if (object.placement.kind !== 'fixed') continue;
        for (const [width, height] of object.placement.footprints) {
          const file = `themes/${theme.key}/objects/${object.key}_${width}x${height}.svg`;
          if (!FILES.includes(file)) continue;
          const expected = `viewBox="0 0 ${width * 24} ${height * 24}"`;
          if (!readFileSync(join(ART, file), 'utf8').includes(expected)) wrong.push(file);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it('give every room of every theme the floor it needs', () => {
    const missing: string[] = [];
    for (const theme of THEMES) {
      for (const room of theme.rooms) {
        if (!FILES.includes(`themes/${theme.key}/floors/${room.floor}.svg`)) {
          missing.push(`${theme.key}/${room.key} (${room.floor})`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('give every portrait key and every icon a file', () => {
    for (const key of PORTRAIT_KEYS) {
      expect(FILES, 'portrait ' + key).toContain(`common/characters/${key}.svg`);
    }
    for (const key of ICONS) {
      expect(FILES, 'icon ' + key).toContain(`common/icons/${key}.svg`);
    }
  });

  it('come with exactly one placeholder shape per object of every theme', () => {
    for (const theme of THEMES) {
      const shapes = Object.keys(PLACEHOLDER_SHAPES[theme.key] ?? {}).sort();
      expect(shapes, theme.key).toEqual(theme.objects.map((object) => object.key).sort());
    }
  });

  it('include the fallback floor for foreign themes', () => {
    expect(FILES).toContain(`common/floors/${DEFAULT_FLOOR}.svg`);
  });

  it('resolve every picture of the tutorial', () => {
    // The tutorial mixes all three kinds: icon, prop, character. Without the
    // kind in the key it would find nothing and show an empty area.
    const missing = TUTORIAL_ICONS.filter((icon) => !hasArt(icon.kind ?? 'objects', icon.name, icon.theme));
    expect(missing).toEqual([]);
    // One picture per step, in every language.
    for (const resources of Object.values(RESOURCES)) {
      expect(resources.help.tutorial).toHaveLength(TUTORIAL_ICONS.length);
    }
  });

  it('are all in use', () => {
    const needed = new Set<string>([
      ...PORTRAIT_KEYS.map((key) => `common/characters/${key}.svg`),
      ...ICONS.map((key) => `common/icons/${key}.svg`),
      `common/floors/${DEFAULT_FLOOR}.svg`,
      ...THEMES.flatMap((theme) => [
        ...theme.objects.flatMap((object) =>
          object.placement.kind === 'tiled'
            ? [`themes/${theme.key}/tiles/${object.key}.svg`]
            : object.placement.footprints.map(
                ([width, height]) => `themes/${theme.key}/objects/${object.key}_${width}x${height}.svg`,
              ),
        ),
        ...theme.rooms.map((room) => `themes/${theme.key}/floors/${room.floor}.svg`),
      ]),
    ]);
    expect(FILES.filter((file) => !needed.has(file))).toEqual([]);
  });

  it('are each a standalone SVG on the 24-unit grid', () => {
    // 24 per cell: a tile is 24x24, a table over three cells 72x24.
    const broken: string[] = [];
    for (const file of FILES) {
      const text = readFileSync(join(ART, file), 'utf8');
      const box = /viewBox="0 0 (\d+) (\d+)"/.exec(text);
      const ok =
        text.includes('<svg') &&
        text.includes('xmlns="http://www.w3.org/2000/svg"') &&
        box !== null &&
        Number(box[1]) % 24 === 0 &&
        Number(box[1]) > 0 &&
        Number(box[2]) % 24 === 0 &&
        Number(box[2]) > 0 &&
        text.trimEnd().endsWith('</svg>') &&
        text.length > 80;
      if (!ok) broken.push(file);
    }
    expect(broken).toEqual([]);
  });

  it('put nothing at a negative position', () => {
    // The floor tiles' scatter value once went negative through `>>`, and the
    // blades of grass landed left of the picture. Only *absolute* values are
    // checked: a negative step inside a path (`l1.1 -3.2`) is normal.
    const absolute = /(?:\s|")M\s*-|\s(?:x|y|cx|cy|x1|y1|x2|y2)="-/;
    const outside = FILES.filter((file) => absolute.test(readFileSync(join(ART, file), 'utf8')));
    expect(outside).toEqual([]);
  });
});

describe('resolving drawings', () => {
  it('knows all three themes', () => {
    expect(artThemes()).toEqual(THEMES.map((theme) => theme.key).sort());
  });

  it("prefers the theme's drawing over the common one", () => {
    // 'chair' is in the car repair shop and the flat — each theme has its own
    // file, so the chair may look different later.
    expect(hasArt('objects', 'chair_1x1', 'garage')).toBe(true);
    expect(hasArt('objects', 'chair_1x1', 'flat')).toBe(true);
    expect(artUrl('objects', 'chair_1x1')).toBeUndefined();
  });

  it('keeps the footprints of one object apart', () => {
    const across = artUrl('objects', 'sofa_2x1', 'flat');
    const lengthways = artUrl('objects', 'sofa_1x2', 'flat');
    expect(across).toBeDefined();
    expect(lengthways).toBeDefined();
    expect(across).not.toBe(lengthways);
  });

  it('keeps a prop and a floor of the same name apart', () => {
    // In the flat both are called 'carpet': the carpet someone stands on, and
    // the bedroom's fitted carpet. Without the kind in the key, half the room
    // got the prop laid as its floor.
    const prop = artUrl('tiles', 'carpet', 'flat');
    const floor = artUrl('floors', 'carpet', 'flat');
    expect(prop).toBeDefined();
    expect(floor).toBeDefined();
    expect(prop).not.toBe(floor);
  });

  it('falls back to the common characters and icons', () => {
    expect(artUrl('characters', 'p01', 'garden')).toBe(artUrl('characters', 'p01'));
    expect(artUrl('icons', 'ui-x', 'flat')).toBe(artUrl('icons', 'ui-x'));
  });

  it('reports an unknown drawing instead of returning the wrong one', () => {
    expect(artUrl('objects', 'spaceship_1x1', 'garage')).toBeUndefined();
    expect(hasArt('objects', 'spaceship_1x1')).toBe(false);
    // A footprint that does not exist returns nothing — the sprite then falls
    // back to the file without a footprint, if someone provides one.
    expect(artUrl('objects', 'bed_9x9', 'flat')).toBeUndefined();
    // A prop is no floor, even if it exists.
    expect(artUrl('floors', 'bathtub_2x1', 'flat')).toBeUndefined();
  });

  it('returns image data a browser shows directly', () => {
    const url = artUrl('objects', 'tree_1x1', 'garden');
    expect(url).toMatch(/^data:image\/svg\+xml,/);
    expect(decodeURIComponent(url!)).toContain('<svg');
  });

  it('lists the matching names per kind and theme', () => {
    const names = artNames('objects', 'garden');
    expect(names).toContain('tree_1x1');
    expect(names).not.toContain('car_2x2');
    expect(names).not.toContain('p01');
    expect(artNames('characters')).toContain('p01');
  });
});

describe('sprite picks the footprint', () => {
  const markup = (props: Record<string, unknown>): string =>
    renderToStaticMarkup(createElement(Sprite, props as never));

  it('takes the file for exactly this footprint', () => {
    const across = markup({ name: 'sofa', theme: 'flat', footprint: [2, 1] });
    const lengthways = markup({ name: 'sofa', theme: 'flat', footprint: [1, 2] });
    expect(across).toContain('<img');
    expect(across).not.toBe(lengthways);
    expect(decodeURIComponent(across)).toContain('viewBox="0 0 48 24"');
    expect(decodeURIComponent(lengthways)).toContain('viewBox="0 0 24 48"');
  });

  it("takes the area's pixel size", () => {
    const html = markup({ name: 'kitchenunit', theme: 'flat', footprint: [3, 1], width: 96, height: 32 });
    expect(html).toContain('width="96"');
    expect(html).toContain('height="32"');
  });

  it('falls back to the file without a footprint', () => {
    // An artist may deliver a single file for every footprint. 'p01' has no
    // footprint in common — standing in for that case.
    const html = markup({ name: 'p01', kind: 'characters', footprint: [2, 1] });
    expect(html).toContain('<img');
    expect(html).toBe(markup({ name: 'p01', kind: 'characters' }));
  });

  it('leaves the area empty when there is nothing at all', () => {
    const html = markup({ name: 'spaceship', theme: 'garage', footprint: [2, 1], width: 40, height: 20 });
    expect(html).not.toContain('<img');
    expect(html).toContain('<span');
  });
});

describe('floors', () => {
  it('follow the room in its theme, with a fallback for anything foreign', () => {
    expect(floorFor('flat', 'bathroom')).toBe('tile');
    expect(floorFor('garden', 'lawn')).toBe('grass');
    expect(floorFor('flat', 'dungeon')).toBe(DEFAULT_FLOOR);
    expect(floorFor('attic', 'loft')).toBe(DEFAULT_FLOOR);
  });

  it('are each used by at least one room', () => {
    const used = new Set<string>(THEMES.flatMap((theme) => theme.rooms.map((room) => room.floor)));
    used.add(DEFAULT_FLOOR);
    expect(FLOOR_MATERIALS.filter((material) => !used.has(material))).toEqual([]);
  });

  it('mirror only floors without a running pattern', () => {
    // Plank joints and grout must meet at the tile edge; a mirrored neighbour
    // would cut them.
    for (const material of ['wood', 'tile', 'stone', 'concrete', 'carpet', 'water'] as const) {
      for (let cell = 0; cell < 40; cell++) {
        expect(floorFlip(material, cell), material).toEqual({ x: 1, y: 1 });
      }
    }
  });

  it('scatter grass, gravel, sand and soil over the grid', () => {
    for (const material of ['grass', 'gravel', 'sand', 'soil'] as const) {
      const variants = new Set(
        Array.from({ length: 40 }, (_, cell) => JSON.stringify(floorFlip(material, cell))),
      );
      expect(variants.size, material).toBeGreaterThan(1);
    }
  });

  it('draw the same cell the same way every time', () => {
    expect(floorFlip('grass', 42)).toEqual(floorFlip('grass', 42));
  });
});
