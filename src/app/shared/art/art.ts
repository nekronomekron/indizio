/**
 * Access to the drawings in `art/`.
 *
 * The game draws *nothing itself*. Every shape is an SVG file of its own;
 * `npm run art` writes the placeholders, and the final drawings will replace
 * them. Replacing a drawing is replacing a file, not changing code.
 *
 * Lookup goes *theme first, then common*:
 *
 * ```
 * art/themes/<theme>/objects/<name>.svg    first
 * art/common/objects/<name>.svg            as fallback
 * ```
 *
 * So every theme gets its own set of drawings without characters and icons
 * lying there three times.
 *
 * The kind of drawing is part of the key, not just tidy folders: the flat has
 * `carpet` *twice* — the carpet someone stands on, and the bedroom's fitted
 * carpet. Looking up by file name alone would lay a prop as floor across half
 * the room.
 *
 * The files are embedded at build time, not loaded at runtime. That keeps the
 * game playable offline (PLAN.md §11, G11) and saves a request per shape.
 */

/**
 * Folder under `art/`, and so the kind of a drawing. `tiles` are the sheets of
 * laid props (PLAN.md §13.4) — a folder of their own because
 * `objects/carpet.svg` already means "one file for all footprints".
 */
export type ArtKind = 'objects' | 'tiles' | 'floors' | 'characters' | 'icons';

// Annotated rather than asserted: with these options `import.meta.glob`
// already returns `Record<string, string>`; an `as` would be a promise that
// promises nothing. The annotation says the same and is checked.
const FILES: Record<string, string> = import.meta.glob('../../../../art/**/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** File content as a data URL, usable directly as an image's `src`. */
function toDataUrl(svg: string): string {
  const clean = svg.replace(/<!--[\s\S]*?-->/g, '').trim();
  return 'data:image/svg+xml,' + encodeURIComponent(clean);
}

const common = new Map<string, string>();
const byTheme = new Map<string, Map<string, string>>();

for (const [path, svg] of Object.entries(FILES)) {
  const parts = path.slice(path.indexOf('/art/') + 5).split('/');
  const name = parts[parts.length - 1]!.replace(/\.svg$/, '');
  const kind = parts[parts.length - 2] ?? '';
  const key = kind + '/' + name;
  const url = toDataUrl(svg);

  if (parts[0] === 'themes') {
    const theme = parts[1]!;
    let set = byTheme.get(theme);
    if (!set) {
      set = new Map();
      byTheme.set(theme, set);
    }
    set.set(key, url);
  } else {
    common.set(key, url);
  }
}

/** Drawing by kind and name, the theme's own preferred. `undefined` if there is none. */
export function artUrl(kind: ArtKind, name: string, theme?: string): string | undefined {
  const key = kind + '/' + name;
  if (theme !== undefined) {
    const own = byTheme.get(theme)?.get(key);
    if (own !== undefined) return own;
  }
  return common.get(key);
}

/** Whether a drawing exists. For tests and overviews. */
export function hasArt(kind: ArtKind, name: string, theme?: string): boolean {
  return artUrl(kind, name, theme) !== undefined;
}

/** Every name of a kind a theme knows — its own and the common ones. */
export function artNames(kind: ArtKind, theme?: string): string[] {
  const prefix = kind + '/';
  const names = new Set<string>();
  for (const key of common.keys()) if (key.startsWith(prefix)) names.add(key.slice(prefix.length));
  if (theme !== undefined) {
    for (const key of byTheme.get(theme)?.keys() ?? []) {
      if (key.startsWith(prefix)) names.add(key.slice(prefix.length));
    }
  }
  return [...names].sort();
}

/** Every theme with drawings of its own. */
export function artThemes(): string[] {
  return [...byTheme.keys()].sort();
}
