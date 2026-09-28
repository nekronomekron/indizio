/**
 * Zugriff auf die Grafikdateien in `art/`.
 *
 * Im Spiel wird **nichts mehr gezeichnet**. Jede Form ist eine eigene
 * SVG-Datei; `npm run art` erzeugt die Platzhalter, spaeter liegen dort die
 * endgueltigen Grafiken. Ein Austausch ist damit ein Dateitausch und keine
 * Codeaenderung.
 *
 * Gesucht wird **erst im Theme, dann gemeinsam**:
 *
 * ```
 * art/themes/<theme>/objects/<name>.svg    zuerst
 * art/common/objects/<name>.svg            als Rueckfall
 * ```
 *
 * Damit bekommt jedes Theme sein eigenes Grafikset, ohne dass Figuren und
 * Bediensymbole dreimal danebenliegen muessen.
 *
 * Die Art der Grafik gehoert zum Schluessel und ist nicht bloss Ordnung im
 * Ordner: In der Wohnung gibt es `carpet` **zweimal** — den Teppich, auf dem
 * jemand steht, und den Teppichboden des Schlafzimmers. Wer nur nach dem
 * Dateinamen sucht, legt dem halben Zimmer eine Requisite als Boden aus.
 *
 * Die Dateien werden beim Bauen eingebettet, nicht zur Laufzeit geladen. Das
 * haelt das Spiel offline lauffaehig (PLAN.md §11, G11) und erspart je Form
 * eine Anfrage.
 */

/**
 * Ordner unter `art/`, zugleich die Art einer Grafik. `tiles` sind die Blätter
 * verlegter Requisiten (PLAN.md §13.4) — ein eigener Ordner, weil
 * `objects/carpet.svg` schon „eine Datei fuer alle Grundflaechen" heisst.
 */
export type ArtKind = 'objects' | 'tiles' | 'floors' | 'characters' | 'icons';

// Angeschrieben statt behauptet: `import.meta.glob` liefert mit diesen Optionen
// bereits `Record<string, string>`, ein `as` waere eine Zusicherung, die nichts
// zusichert. Die Annotation dokumentiert dasselbe und wird geprueft.
const FILES: Record<string, string> = import.meta.glob('../../../art/**/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Dateiinhalt als Datenadresse, direkt als `src` eines Bildes verwendbar. */
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
    if (!set) { set = new Map(); byTheme.set(theme, set); }
    set.set(key, url);
  } else {
    common.set(key, url);
  }
}

/** Grafik zu Art und Name, im Theme bevorzugt. `undefined`, wenn es keine gibt. */
export function artUrl(kind: ArtKind, name: string, theme?: string): string | undefined {
  const key = kind + '/' + name;
  if (theme !== undefined) {
    const own = byTheme.get(theme)?.get(key);
    if (own !== undefined) return own;
  }
  return common.get(key);
}

/** Ob es eine Grafik gibt. Fuer Tests und Uebersichten. */
export function hasArt(kind: ArtKind, name: string, theme?: string): boolean {
  return artUrl(kind, name, theme) !== undefined;
}

/** Alle Namen einer Art, die ein Theme kennt — eigene und gemeinsame. */
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

/** Alle Themes, fuer die eigene Grafiken vorliegen. */
export function artThemes(): string[] {
  return [...byTheme.keys()].sort();
}
