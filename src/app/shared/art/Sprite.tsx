import type { ReactElement } from 'react';
import { artUrl } from './art.js';
import type { ArtKind } from './art.js';
import { cx } from '../ui/cx.js';
import styles from './Sprite.module.css';

export interface SpriteProps {
  /** Dateiname ohne Endung, so wie die Grafik in `art/` heisst. */
  name: string;
  /**
   * Art der Grafik, zugleich der Ordner unter `art/`. Sie gehoert zum
   * Schluessel: `carpet` ist in der Wohnung sowohl Requisite als auch
   * Bodenbelag.
   */
  kind?: ArtKind;
  /**
   * Theme, dessen Grafikset bevorzugt wird. Ohne Angabe gilt nur `art/common`
   * — richtig fuer Figuren und Bediensymbole, falsch fuer Requisiten.
   */
  theme?: string;
  /**
   * Grundflaeche in Feldern, `[Breite, Hoehe]`. Damit sucht der Sprite zuerst
   * die Fassung fuer genau diese Flaeche (`bed_2x1`) und faellt auf die
   * flaechenlose Datei (`bed`) zurueck — so genuegt einer Grafikerin eine
   * Datei, wenn eine reicht.
   */
  footprint?: readonly [number, number];
  /** Kantenlaenge in Pixeln, fuer quadratische Grafiken. */
  size?: number;
  /** Breite und Hoehe in Pixeln, wenn die Flaeche nicht quadratisch ist. */
  width?: number;
  height?: number;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}

/**
 * Eine Grafik aus `art/`.
 *
 * Als Bild eingebunden, nicht als eingebettetes SVG: so liegt jede Grafik
 * genau einmal im Speicher, auch wenn dieselbe Requisite zehnmal auf dem Brett
 * steht, und die Datei wird unveraendert benutzt — genau so, wie eine Grafikerin
 * sie abgeliefert hat.
 *
 * Fehlt eine Grafik, bleibt die Flaeche leer statt das Layout zu zerreissen.
 * Dass keine fehlt, prueft `tests/art.test.ts`.
 */
export function Sprite(props: SpriteProps): ReactElement {
  const { name, kind = 'objects', theme, footprint, size = 32, className, title, style } = props;
  const width = props.width ?? size;
  const height = props.height ?? size;

  const url = footprint
    ? (artUrl(kind, `${name}_${String(footprint[0])}x${String(footprint[1])}`, theme) ??
      artUrl(kind, name, theme))
    : artUrl(kind, name, theme);

  if (url === undefined) return <span className={className} style={{ width, height, ...style }} />;

  return (
    <img
      className={cx(styles.sprite, className)}
      src={url}
      width={width}
      height={height}
      alt={title ?? ''}
      aria-hidden={title ? undefined : true}
      draggable={false}
      style={style}
    />
  );
}
