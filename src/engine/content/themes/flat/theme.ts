import type { Theme } from '../types.js';
import { de } from './locales/de.js';
import { en } from './locales/en.js';

export const flat: Theme = {
  key: 'flat',
  rooms: [
    {
      key: 'livingroom',
      floor: 'wood',
    },
    {
      key: 'kitchen',
      floor: 'tile',
    },
    {
      key: 'bedroom',
      floor: 'carpet',
    },
    {
      key: 'hallway',
      floor: 'wood',
    },
    {
      key: 'bathroom',
      floor: 'tile',
    },
    {
      key: 'study',
      floor: 'wood',
    },
    {
      key: 'balcony',
      floor: 'stone',
    },
  ],
  objects: [
    {
      key: 'sofa',
      walkable: true,
      placement: {
        kind: 'fixed',
        footprints: [
          [2, 1],
          [1, 2],
        ],
      },
      rooms: ['livingroom', 'study'],
      maxPerScene: 3,
      weight: 3,
    },
    {
      key: 'kitchenunit',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [
          [3, 1],
          [1, 3],
          [2, 1],
        ],
      },
      rooms: ['kitchen'],
      maxPerScene: 2,
      weight: 3,
    },
    {
      key: 'bed',
      walkable: true,
      placement: {
        kind: 'fixed',
        footprints: [[2, 2]],
      },
      rooms: ['bedroom'],
      maxPerScene: 2,
      weight: 3,
    },
    {
      key: 'carpet',
      walkable: true,
      placement: {
        kind: 'tiled',
        minCells: 2,
        maxCells: 6,
        compactness: 0.7,
        straightness: 0.3,
      },
      rooms: ['livingroom', 'bedroom', 'hallway', 'study'],
      maxPerScene: 4,
      weight: 4,
    },
    {
      key: 'bookshelf',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [
          [2, 1],
          [1, 2],
        ],
      },
      rooms: ['livingroom', 'bedroom', 'hallway', 'study'],
      maxPerScene: 5,
      weight: 4,
    },
    {
      key: 'table',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [
          [2, 1],
          [1, 2],
        ],
      },
      rooms: ['kitchen', 'livingroom', 'balcony', 'study'],
      maxPerScene: 4,
      weight: 3,
    },
    {
      key: 'chair',
      walkable: true,
      placement: {
        kind: 'fixed',
        footprints: [[1, 1]],
      },
      rooms: ['kitchen', 'livingroom', 'bedroom', 'study', 'balcony'],
      maxPerScene: 6,
      weight: 5,
    },
    {
      key: 'plant',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [[1, 1]],
      },
      rooms: ['livingroom', 'hallway', 'bathroom', 'balcony'],
      maxPerScene: 5,
      weight: 4,
    },
    {
      key: 'bathtub',
      walkable: true,
      placement: {
        kind: 'fixed',
        footprints: [
          [2, 1],
          [1, 2],
        ],
      },
      rooms: ['bathroom'],
      maxPerScene: 1,
      weight: 2,
    },
    {
      key: 'lamp',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [[1, 1]],
      },
      rooms: ['livingroom', 'bedroom', 'study', 'hallway'],
      maxPerScene: 5,
      weight: 4,
    },
  ],
  texts: { de, en },
};
