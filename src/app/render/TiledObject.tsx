import { useMemo } from 'react';
import type { SceneObject } from '@engine';
import { artUrl } from './art.js';
import { SHEET_UNIT, quarterTiles, type OpenEdges } from './tiles.js';

export interface TiledObjectProps {
  object: SceneObject;
  size: number;
  cellPx: number;
  theme: string;
}

/** Innenrahmen nur dort, wo die Form endet — an verbundenen Seiten laeuft sie durch. */
function edgeShadow(edges: OpenEdges): string {
  const parts: string[] = [];
  if (edges.north) parts.push('inset 0 1px 0 0 var(--object-edge)');
  if (edges.south) parts.push('inset 0 -1px 0 0 var(--object-edge)');
  if (edges.west) parts.push('inset 1px 0 0 0 var(--object-edge)');
  if (edges.east) parts.push('inset -1px 0 0 0 var(--object-edge)');
  return parts.length > 0 ? parts.join(', ') : 'none';
}

/**
 * Eine verlegte Requisite: je Zelle vier Viertel aus dem Blatt `tiles/<key>`
 * (PLAN.md §13.4, `tiles.ts`).
 *
 * Die Toenung „begehbar/sperrend" geht zellweise mit. Ueber die umschliessende
 * Box gelegt, wie bei festen Requisiten, faerbte sie bei einer L-Form die
 * Luecke mit ein.
 */
export function TiledObject({ object, size, cellPx, theme }: TiledObjectProps) {
  const tiles = useMemo(() => quarterTiles(object.cells, size), [object.cells, size]);
  const url = artUrl('tiles', object.key, theme);
  const half = cellPx / 2;
  const scale = cellPx / SHEET_UNIT;
  const kind = object.walkable ? ' walkable' : ' blocking';

  return (
    <>
      {tiles.map((tile) => (
        <div
          key={tile.cell}
          className={'object tile' + kind}
          style={{
            left: tile.column * cellPx,
            top: tile.row * cellPx,
            width: cellPx,
            height: cellPx,
            boxShadow: edgeShadow(tile.edges),
          }}
        >
          {url !== undefined && tile.quarters.map((quarter) => (
            <span
              key={quarter.corner}
              className="tile-quarter"
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
