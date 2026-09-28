import type { Theme } from '../types.js';
import { de } from './locales/de.js';
import { en } from './locales/en.js';

export const garden: Theme = {
  key: 'garden',
  rooms: [
    {
      key: 'lawn',
      floor: 'grass',
    },
    {
      key: 'patio',
      floor: 'stone',
    },
    {
      key: 'vegetablepatch',
      floor: 'soil',
    },
    {
      key: 'shedarea',
      floor: 'gravel',
    },
    {
      key: 'pondside',
      floor: 'water',
    },
    {
      key: 'greenhouse',
      floor: 'soil',
    },
    {
      key: 'playarea',
      floor: 'sand',
    },
  ],
  objects: [
    {
      key: 'tree',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [[1, 1]],
      },
      rooms: ['lawn', 'pondside', 'shedarea', 'playarea'],
      maxPerScene: 6,
      weight: 5,
    },
    {
      key: 'flowerbed',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [
          [2, 1],
          [1, 2],
        ],
      },
      rooms: ['vegetablepatch', 'lawn', 'patio', 'greenhouse'],
      maxPerScene: 5,
      weight: 4,
    },
    {
      key: 'gardenchair',
      walkable: true,
      placement: {
        kind: 'fixed',
        footprints: [[1, 1]],
      },
      rooms: ['patio', 'lawn', 'pondside', 'playarea', 'greenhouse', 'shedarea'],
      maxPerScene: 6,
      weight: 5,
    },
    {
      key: 'pond',
      walkable: true,
      placement: {
        kind: 'fixed',
        footprints: [
          [2, 2],
          [2, 1],
        ],
      },
      rooms: ['pondside'],
      maxPerScene: 1,
      weight: 3,
    },
    {
      key: 'shed',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [
          [2, 2],
          [2, 1],
        ],
      },
      rooms: ['shedarea'],
      maxPerScene: 1,
      weight: 3,
    },
    {
      key: 'bench',
      walkable: true,
      placement: {
        kind: 'fixed',
        footprints: [
          [2, 1],
          [1, 2],
        ],
      },
      rooms: ['patio', 'lawn', 'pondside', 'greenhouse'],
      maxPerScene: 3,
      weight: 3,
    },
    {
      key: 'bush',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [[1, 1]],
      },
      rooms: ['lawn', 'patio', 'vegetablepatch', 'shedarea', 'playarea'],
      maxPerScene: 6,
      weight: 4,
    },
    {
      key: 'wheelbarrow',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [[1, 1]],
      },
      rooms: ['vegetablepatch', 'shedarea', 'greenhouse'],
      maxPerScene: 3,
      weight: 3,
    },
    {
      key: 'steppingstone',
      walkable: true,
      placement: {
        kind: 'fixed',
        footprints: [[1, 1]],
      },
      rooms: ['lawn', 'pondside', 'patio', 'vegetablepatch', 'shedarea', 'greenhouse', 'playarea'],
      maxPerScene: 6,
      weight: 5,
    },
    {
      key: 'sandbox',
      walkable: true,
      placement: {
        kind: 'fixed',
        footprints: [
          [2, 2],
          [2, 1],
        ],
      },
      rooms: ['playarea'],
      maxPerScene: 1,
      weight: 3,
    },
  ],
  texts: { de, en },
};
