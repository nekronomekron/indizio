/**
 * The colours of the vector art.
 *
 * Flat areas, per material a base colour and a darker one for depth, no
 * outlines, no gradients. That keeps shapes clear at any size and makes
 * objects distinguishable at a glance.
 */
export const C = {
  wood: '#c08e57',
  woodDark: '#8f6339',
  woodLight: '#dcb98a',

  metal: '#b8bfcc',
  metalDark: '#8b93a4',

  stone: '#a6a3b4',
  stoneDark: '#807d90',

  white: '#f3f1f7',
  cream: '#e9dfc8',
  ink: '#3a3450',

  red: '#e2604f',
  redDark: '#bd4438',
  orange: '#eb9440',
  yellow: '#f2c94c',
  sand: '#e7cf99',

  green: '#5fb86d',
  greenDark: '#3f8d51',
  leaf: '#7fd07a',

  teal: '#48b1b9',
  water: '#5cb8e0',
  waterDark: '#3d92b8',

  blue: '#5b86d8',
  purple: '#9b6bc4',
  pink: '#e07aa8',

  soil: '#8a6a4a',
  oil: '#2f2c3a',
  rubber: '#4a4757',
} as const;

export type ColorName = keyof typeof C;
