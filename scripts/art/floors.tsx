import type { ReactNode, ReactElement } from 'react';
import type { FloorMaterial } from '../../src/app/shared/art/floors.js';

/**
 * Placeholder drawings of the floors.
 *
 * Development only: `npm run art` writes a finished SVG file per theme from
 * these. The app reads only the files.
 *
 * All colours are deliberately muted — characters and props are strongly
 * coloured and have to stand out. The tiles are designed to continue when set
 * side by side: grout and plank joints meet at the edges.
 */

interface Material {
  /** Base colour of the tile. */
  base: string;
  /** Pattern. The value scatters blades, pebbles and joints over the tile. */
  pattern: (h: number) => ReactNode;
}

/**
 * Scatter value per floor.
 *
 * It used to scatter anew per grid cell; since tiles became files there is
 * exactly one picture per floor. Against visible repetition the app mirrors
 * the tile per cell (see `floorFlip`), which needs one value per floor rather
 * than one per cell.
 */
function seedOf(material: string): number {
  let h = 0x811c9dc5;
  for (const ch of material) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h >>> 0;
}

const MATERIALS: Record<FloorMaterial, Material> = {
  // Planks: horizontal joints running through, butt joints offset per row.
  wood: {
    base: '#4a382a',
    pattern: (h) => {
      const fuge = 4 + ((h >>> 3) % 16);
      return (
        <>
          <rect x="0" y="0" width="24" height="7.6" fill="#54402f" />
          <rect x="0" y="8.2" width="24" height="7.6" fill="#4a382a" />
          <rect x="0" y="16.4" width="24" height="7.6" fill="#573f2c" />
          <rect x="0" y="7.6" width="24" height="0.6" fill="#33261c" />
          <rect x="0" y="15.8" width="24" height="0.6" fill="#33261c" />
          <rect x={fuge} y="0" width="0.7" height="7.6" fill="#33261c" />
          <rect x={(fuge + 11) % 24} y="8.2" width="0.7" height="7.6" fill="#33261c" />
          <rect x={(fuge + 6) % 24} y="16.4" width="0.7" height="7.6" fill="#33261c" />
        </>
      );
    },
  },

  // Tiles: four squares per tile, grout continuing over the edges.
  tile: {
    base: '#39424e',
    pattern: () => (
      <>
        <rect x="0.6" y="0.6" width="10.8" height="10.8" rx="1" fill="#414b58" />
        <rect x="12.6" y="0.6" width="10.8" height="10.8" rx="1" fill="#3d4653" />
        <rect x="0.6" y="12.6" width="10.8" height="10.8" rx="1" fill="#3d4653" />
        <rect x="12.6" y="12.6" width="10.8" height="10.8" rx="1" fill="#414b58" />
      </>
    ),
  },

  // Paving: larger stones with offset joints.
  stone: {
    base: '#3b3945',
    pattern: (h) => {
      const versatz = (h % 2) * 8;
      return (
        <>
          <rect x="0.7" y="0.7" width={10.6 + versatz} height="10.6" rx="1.4" fill="#454351" />
          <rect x={12.3 + versatz} y="0.7" width={11 - versatz} height="10.6" rx="1.4" fill="#403e4b" />
          <rect x="0.7" y="12.7" width={11 - versatz} height="10.6" rx="1.4" fill="#403e4b" />
          <rect x={12.3 - versatz} y="12.7" width={10.6 + versatz} height="10.6" rx="1.4" fill="#454351" />
        </>
      );
    },
  },

  // Concrete: smooth, a few speckles and the odd crack.
  concrete: {
    base: '#403f4a',
    pattern: (h) => (
      <>
        <circle cx={3 + (h % 18)} cy={5 + ((h >>> 4) % 14)} r="1.1" fill="#4a4954" />
        <circle cx={6 + ((h >>> 8) % 15)} cy={14 + ((h >>> 12) % 8)} r="0.8" fill="#38373f" />
        {h % 5 === 0 && (
          <path d={'M' + (2 + (h % 8)) + ' 24 l4 -7 l-2 -5'} stroke="#37363e" strokeWidth="0.7" fill="none" />
        )}
      </>
    ),
  },

  // Fitted carpet: warm colour, fine fibres.
  carpet: {
    base: '#4a3a44',
    pattern: (h) => (
      <>
        {[3, 9, 15, 21].map((y, i) => (
          <rect key={y} x={((h >>> (i * 2)) % 4)} y={y} width="24" height="1.4" rx="0.7" fill="#523f4b" />
        ))}
      </>
    ),
  },

  // Lawn: base green with single blades.
  grass: {
    base: '#2f4733',
    pattern: (h) => (
      <>
        <ellipse cx={5 + (h % 15)} cy={7 + ((h >>> 5) % 12)} rx="6" ry="4" fill="#35513a" />
        {[0, 1, 2, 3].map((i) => {
          const x = 2 + ((h >>> (i * 3)) % 21);
          const y = 4 + ((h >>> (i * 4 + 2)) % 17);
          return <path key={i} d={'M' + x + ' ' + y + ' l1.1 -3.2 l1.1 3.2'} fill="#3d5e42" />;
        })}
      </>
    ),
  },

  // Soil: dark ground with clods and a furrow.
  soil: {
    base: '#463527',
    pattern: (h) => (
      <>
        <rect x="0" y={6 + (h % 10)} width="24" height="1.6" rx="0.8" fill="#3c2d21" />
        <ellipse cx={4 + (h % 17)} cy={4 + ((h >>> 6) % 16)} rx="2.6" ry="1.8" fill="#4f3c2c" />
        <ellipse cx={6 + ((h >>> 9) % 15)} cy={13 + ((h >>> 3) % 9)} rx="2" ry="1.4" fill="#3f2f23" />
      </>
    ),
  },

  // Gravel: many small stones.
  gravel: {
    base: '#43414a',
    pattern: (h) => (
      <>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const x = 2 + ((h >>> (i * 2)) % 21);
          const y = 2 + ((h >>> (i * 3 + 1)) % 21);
          const gross = (h >>> i) % 3 === 0;
          return (
            <circle key={i} cx={x} cy={y} r={gross ? 1.6 : 1}
              fill={gross ? '#4e4c56' : '#3a3941'} />
          );
        })}
      </>
    ),
  },

  // Sand: light ground with fine grain and ripples.
  sand: {
    base: '#57492f',
    pattern: (h) => (
      <>
        <path d={'M0 ' + (7 + (h % 6)) + ' q6 -2 12 0 t12 0'} stroke="#5f5134" strokeWidth="1.1" fill="none" />
        <path d={'M0 ' + (16 + ((h >>> 4) % 5)) + ' q6 -2 12 0 t12 0'} stroke="#5f5134" strokeWidth="1.1" fill="none" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={3 + ((h >>> (i * 5)) % 19)} cy={3 + ((h >>> (i * 4)) % 19)} r="0.7" fill="#4e421d" />
        ))}
      </>
    ),
  },

  // Water: for rooms by the water, with calm waves.
  water: {
    base: '#2c4a5c',
    pattern: (h) => (
      <>
        <path d={'M0 ' + (6 + (h % 5)) + ' q6 -2.4 12 0 t12 0'} stroke="#34586d" strokeWidth="1.6" fill="none" />
        <path d={'M0 ' + (15 + ((h >>> 5) % 5)) + ' q6 -2.4 12 0 t12 0'} stroke="#34586d" strokeWidth="1.6" fill="none" />
      </>
    ),
  },
};

/** A floor tile as vector art, on the 24-unit grid like every other shape. */
export function FloorTile({ material }: { material: FloorMaterial }): ReactElement {
  const def = MATERIALS[material];
  return (
    <>
      <rect width="24" height="24" fill={def.base} />
      {def.pattern(seedOf(material))}
    </>
  );
}
