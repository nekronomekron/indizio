import type { ReactNode } from 'react';
import type { FloorMaterial } from '../../src/app/render/floors.js';

/**
 * Platzhalter-Zeichnungen der Bodenbelaege.
 *
 * Laeuft nur waehrend der Entwicklung: `npm run art` schreibt daraus je Theme
 * eine fertige SVG-Datei. Die App liest nur noch die Dateien.
 *
 * Alle Toene sind bewusst gedaempft — Figuren und Requisiten sind kraeftig
 * gefaerbt und muessen sich davor abheben. Die Kacheln sind so entworfen, dass
 * sie aneinandergesetzt fortlaufen: Fugen und Dielenstoesse treffen sich an den
 * Kanten.
 */

interface Material {
  /** Grundflaeche der Kachel. */
  base: string;
  /** Musterung. Der Wert streut Halme, Kiesel und Fugen ueber die Kachel. */
  pattern: (h: number) => ReactNode;
}

/**
 * Streuwert je Belag.
 *
 * Frueher wurde je Gitterzelle neu gestreut; seit die Kacheln Dateien sind,
 * gibt es je Belag genau ein Bild. Gegen sichtbare Wiederholung spiegelt die
 * App die Kachel zellweise (siehe `floorFlip`), was nur ein Wert je Belag
 * braucht statt eines je Zelle.
 */
function seedOf(material: string): number {
  let h = 0x811c9dc5;
  for (const ch of material) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h >>> 0;
}

const MATERIALS: Record<FloorMaterial, Material> = {
  // Dielen: Stöße waagerecht durchgehend, Fugen je Reihe versetzt.
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

  // Fliesen: vier Felder je Kachel, Fugen laufen über die Kanten weiter.
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

  // Platten: größere Steine mit versetzten Stößen.
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

  // Estrich: glatt, ein paar Sprenkel und gelegentlich ein Riss.
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

  // Teppichboden: warmer Ton, feine Faserung.
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

  // Rasen: Grundgrün mit einzelnen Halmen.
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

  // Erde: dunkler Boden mit Schollen und einer Furche.
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

  // Kies: viele kleine Steine.
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

  // Sand: heller Grund mit feiner Körnung und Wellen.
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

  // Wasser: für Räume am Wasser, mit ruhigen Wellen.
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

/** Eine Bodenkachel als Vektorgrafik, im 24er-Raster wie alle anderen Formen. */
export function FloorTile({ material }: { material: FloorMaterial }) {
  const def = MATERIALS[material];
  return (
    <>
      <rect width="24" height="24" fill={def.base} />
      {def.pattern(seedOf(material))}
    </>
  );
}
