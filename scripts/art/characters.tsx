import type { ReactNode } from 'react';

/**
 * Characters as silhouettes — *without faces*.
 *
 * Not a saving but a rule: portraits must never matter for the solution
 * (PLAN.md §7). A face invites reading something into it; a plain silhouette
 * does not.
 *
 * The characters differ in three features that together give 14 distinct
 * combinations: clothing colour, head shape (hairstyle or headwear) and skin
 * tone. So every character can be told from every other at a glance, even
 * small on the grid.
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

/** Head shapes: silhouette only, never a face. */
const KOPFFORMEN: ((haar: string) => ReactNode)[] = [
  // short and round
  (h) => <path d="M6.4 9.6a5.6 5.6 0 0 1 11.2 0Z" fill={h} />,
  // flat cut
  (h) => <path d="M6.2 9.4h11.6V7.6a5.8 5.8 0 0 0-11.6 0Z" fill={h} />,
  // long sides
  (h) => (
    <>
      <path d="M6.4 9.6a5.6 5.6 0 0 1 11.2 0Z" fill={h} />
      <rect x="5.6" y="8.4" width="2.2" height="6.4" rx="1.1" fill={h} />
      <rect x="16.2" y="8.4" width="2.2" height="6.4" rx="1.1" fill={h} />
    </>
  ),
  // bun
  (h) => (
    <>
      <path d="M6.4 9.6a5.6 5.6 0 0 1 11.2 0Z" fill={h} />
      <circle cx="12" cy="3.4" r="2.4" fill={h} />
    </>
  ),
  // bobble hat
  (h) => (
    <>
      <path d="M6.2 9.4h11.6V8.2a5.8 5.8 0 0 0-11.6 0Z" fill={h} />
      <rect x="5.8" y="9" width="12.4" height="1.8" rx="0.9" fill={h} />
      <circle cx="12" cy="2.6" r="1.7" fill={h} />
    </>
  ),
  // wide brim
  (h) => (
    <>
      <path d="M7.4 8.6a4.6 4.6 0 0 1 9.2 0Z" fill={h} />
      <rect x="3.6" y="8.2" width="16.8" height="2" rx="1" fill={h} />
    </>
  ),
  // bald: only a hint of a fringe
  (h) => (
    <>
      <rect x="5.8" y="9.2" width="2" height="3.4" rx="1" fill={h} />
      <rect x="16.2" y="9.2" width="2" height="3.4" rx="1" fill={h} />
    </>
  ),
];

/** One character as a silhouette. The index picks the combination. */
export function characterShape(index: number): ReactNode {
  const kleidung = KLEIDUNG[index % KLEIDUNG.length]!;
  const dunkel = KLEIDUNG_DUNKEL[index % KLEIDUNG_DUNKEL.length]!;
  const haut = HAUT[index % HAUT.length]!;
  const haar = HAAR[(index * 3) % HAAR.length]!;
  const kopf = KOPFFORMEN[index % KOPFFORMEN.length]!;

  return (
    <>
      {/* Shoulders */}
      <path d="M3.2 22v-3.4A6.4 6.4 0 0 1 9.6 12.2h4.8a6.4 6.4 0 0 1 6.4 6.4V22Z" fill={kleidung} />
      <path d="M10.6 12.2h2.8v2.2a1.4 1.4 0 0 1-2.8 0Z" fill={dunkel} />
      <rect x="10.9" y="10.4" width="2.2" height="2.6" fill={haut} />
      {/* Head */}
      <circle cx="12" cy="8.4" r="5.1" fill={haut} />
      {kopf(haar)}
    </>
  );
}

/** Every portrait key the engine hands out: p01 to p14. */
export const CHARACTER_SHAPES: Record<string, ReactNode> = Object.fromEntries(
  Array.from({ length: 14 }, (_, i) => ['p' + String(i + 1).padStart(2, '0'), characterShape(i)]),
);
