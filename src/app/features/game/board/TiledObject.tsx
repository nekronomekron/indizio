import { useMemo, type ReactElement } from 'react';
import type { SceneObject } from '@engine';
import { artUrl } from '../../../shared/art/art.js';
import { SHEET_UNIT, quarterTiles, type OpenEdges } from './tiles.js';
import { cx } from '../../../shared/ui/cx.js';
import styles from './board.module.css';

export interface TiledObjectProps {
  object: SceneObject;
  size: number;
  cellPx: number;
  theme: string;
}

/** Inner edge only where the shape ends — on connected sides it runs through. */
function edgeShadow(edges: OpenEdges): string {
  const parts: string[] = [];
  if (edges.north) parts.push('inset 0 1px 0 0 var(--object-edge)');
  if (edges.south) parts.push('inset 0 -1px 0 0 var(--object-edge)');
  if (edges.west) parts.push('inset 1px 0 0 0 var(--object-edge)');
  if (edges.east) parts.push('inset -1px 0 0 0 var(--object-edge)');
  return parts.length > 0 ? parts.join(', ') : 'none';
}

/**
 * A laid prop: four quarters per cell from the sheet `tiles/<key>` (PLAN.md
 * §13.4, `tiles.ts`).
 *
 * The walkable/blocking tint goes cell by cell. Laid over the bounding box, as
 * for fixed props, it would colour the gap of an L-shape too.
 */
export function TiledObject({ object, size, cellPx, theme }: TiledObjectProps): ReactElement {
  const tiles = useMemo(() => quarterTiles(object.cells, size), [object.cells, size]);
  const url = artUrl('tiles', object.key, theme);
  const half = cellPx / 2;
  const scale = cellPx / SHEET_UNIT;
  const kind = object.walkable ? styles.walkable : styles.blocking;

  return (
    <>
      {tiles.map((tile) => (
        <div
          key={tile.cell}
          className={cx(styles.object, styles.laid, kind)}
          style={{
            left: tile.column * cellPx,
            top: tile.row * cellPx,
            width: cellPx,
            height: cellPx,
            boxShadow: edgeShadow(tile.edges),
          }}
        >
          {url !== undefined &&
            tile.quarters.map((quarter) => (
              <span
                key={quarter.corner}
                className={styles.quarter}
                style={{
                  left: quarter.corner.endsWith('e') ? half : 0,
                  top: quarter.corner.startsWith('s') ? half : 0,
                  width: half,
                  height: half,
                  backgroundImage: `url("${url}")`,
                  backgroundSize: `${String(2 * cellPx)}px ${String(3 * cellPx)}px`,
                  backgroundPosition: `${String(-quarter.x * scale)}px ${String(-quarter.y * scale)}px`,
                }}
              />
            ))}
        </div>
      ))}
    </>
  );
}
