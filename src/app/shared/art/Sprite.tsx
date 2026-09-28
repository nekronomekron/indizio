import type { ReactElement } from 'react';
import { artUrl } from './art.js';
import type { ArtKind } from './art.js';
import { cx } from '../ui/cx.js';
import styles from './Sprite.module.css';

export interface SpriteProps {
  /** File name without extension, as the drawing is named in `art/`. */
  name: string;
  /**
   * Kind of drawing, and so the folder under `art/`. It is part of the key:
   * in the flat, `carpet` is both a prop and a floor.
   */
  kind?: ArtKind;
  /**
   * Theme whose drawings are preferred. Without it only `art/common` counts —
   * right for characters and icons, wrong for props.
   */
  theme?: string;
  /**
   * Footprint in cells, `[width, height]`. The sprite then looks for the
   * version for exactly this footprint (`bed_2x1`) first and falls back to the
   * file without one (`bed`) — so an artist needs only one file where one is
   * enough.
   */
  footprint?: readonly [number, number];
  /** Side in pixels, for square drawings. */
  size?: number;
  /** Width and height in pixels when the area is not square. */
  width?: number;
  height?: number;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}

/**
 * A drawing from `art/`.
 *
 * Included as an image, not inline SVG: so each drawing is in memory once,
 * even when the same prop stands on the board ten times, and the file is used
 * unchanged — exactly as the artist delivered it.
 *
 * A missing drawing leaves the area empty instead of breaking the layout.
 * `tests/art.test.ts` checks that none is missing.
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
