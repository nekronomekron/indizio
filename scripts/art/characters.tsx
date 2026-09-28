import type { ReactNode } from 'react';

/**
 * Figuren als Silhouetten — **ohne Gesichter**.
 *
 * Das ist keine Sparmaßnahme, sondern Regel: die Porträts dürfen nie
 * lösungsrelevant sein (PLAN.md §7). Ein Gesicht lädt dazu ein, etwas
 * hineinzulesen; eine reine Silhouette nicht.
 *
 * Unterschieden werden die Figuren über drei Merkmale, die zusammen 14
 * eindeutige Kombinationen ergeben: Kleidungsfarbe, Kopfform (Frisur oder
 * Kopfbedeckung) und Hautton. Jede Figur ist damit auf einen Blick von jeder
 * anderen zu trennen, auch klein im Gitter.
 */

const KLEIDUNG = [
  '#e2604f', '#5b86d8', '#5fb86d', '#eb9440', '#9b6bc4', '#48b1b9', '#e07aa8',
  '#f2c94c', '#3f8d51', '#bd4438', '#3d92b8', '#7a6bbf', '#d9884f', '#4a8f97',
];

const KLEIDUNG_DUNKEL = [
  '#bd4438', '#41639f', '#43904f', '#c1742c', '#7a4fa0', '#348a91', '#bd5f87',
  '#cba52f', '#2d6a3a', '#98342a', '#2c7191', '#5f52a0', '#b06a35', '#356b72',
];

const HAUT = ['#f0cfae', '#dcae83', '#b9835a', '#8d5f3c'];
const HAAR = ['#3a3450', '#6d492a', '#c99a4e', '#8b8898', '#a8503a'];

/** Kopfformen: reine Silhouette, nie ein Gesicht. */
const KOPFFORMEN: ((haar: string) => ReactNode)[] = [
  // kurz und rund
  (h) => <path d="M6.4 9.6a5.6 5.6 0 0 1 11.2 0Z" fill={h} />,
  // flacher Schnitt
  (h) => <path d="M6.2 9.4h11.6V7.6a5.8 5.8 0 0 0-11.6 0Z" fill={h} />,
  // lange Seiten
  (h) => (
    <>
      <path d="M6.4 9.6a5.6 5.6 0 0 1 11.2 0Z" fill={h} />
      <rect x="5.6" y="8.4" width="2.2" height="6.4" rx="1.1" fill={h} />
      <rect x="16.2" y="8.4" width="2.2" height="6.4" rx="1.1" fill={h} />
    </>
  ),
  // Dutt
  (h) => (
    <>
      <path d="M6.4 9.6a5.6 5.6 0 0 1 11.2 0Z" fill={h} />
      <circle cx="12" cy="3.4" r="2.4" fill={h} />
    </>
  ),
  // Mütze mit Bommel
  (h) => (
    <>
      <path d="M6.2 9.4h11.6V8.2a5.8 5.8 0 0 0-11.6 0Z" fill={h} />
      <rect x="5.8" y="9" width="12.4" height="1.8" rx="0.9" fill={h} />
      <circle cx="12" cy="2.6" r="1.7" fill={h} />
    </>
  ),
  // breite Krempe
  (h) => (
    <>
      <path d="M7.4 8.6a4.6 4.6 0 0 1 9.2 0Z" fill={h} />
      <rect x="3.6" y="8.2" width="16.8" height="2" rx="1" fill={h} />
    </>
  ),
  // kahl: nur ein angedeuteter Kranz
  (h) => (
    <>
      <rect x="5.8" y="9.2" width="2" height="3.4" rx="1" fill={h} />
      <rect x="16.2" y="9.2" width="2" height="3.4" rx="1" fill={h} />
    </>
  ),
];

/** Eine Figur als Silhouette. Der Index bestimmt die Kombination. */
export function characterShape(index: number): ReactNode {
  const kleidung = KLEIDUNG[index % KLEIDUNG.length]!;
  const dunkel = KLEIDUNG_DUNKEL[index % KLEIDUNG_DUNKEL.length]!;
  const haut = HAUT[index % HAUT.length]!;
  const haar = HAAR[(index * 3) % HAAR.length]!;
  const kopf = KOPFFORMEN[index % KOPFFORMEN.length]!;

  return (
    <>
      {/* Schultern */}
      <path d="M3.2 22v-3.4A6.4 6.4 0 0 1 9.6 12.2h4.8a6.4 6.4 0 0 1 6.4 6.4V22Z" fill={kleidung} />
      <path d="M10.6 12.2h2.8v2.2a1.4 1.4 0 0 1-2.8 0Z" fill={dunkel} />
      <rect x="10.9" y="10.4" width="2.2" height="2.6" fill={haut} />
      {/* Kopf */}
      <circle cx="12" cy="8.4" r="5.1" fill={haut} />
      {kopf(haar)}
    </>
  );
}

/** Alle Porträtschlüssel, die die Bibliothek vergibt: p01 bis p14. */
export const CHARACTER_SHAPES: Record<string, ReactNode> = Object.fromEntries(
  Array.from({ length: 14 }, (_, i) => ['p' + String(i + 1).padStart(2, '0'), characterShape(i)]),
);
