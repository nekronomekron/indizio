import type { Theme } from '../types.js';
import { de } from './locales/de.js';
import { en } from './locales/en.js';

export const garage: Theme = {
  key: 'garage',
  rooms: [
    {
      key: 'workshop',
      floor: 'concrete',
    },
    {
      key: 'waiting',
      floor: 'tile',
    },
    {
      key: 'reception',
      floor: 'stone',
    },
    {
      key: 'storage',
      floor: 'concrete',
    },
    {
      key: 'yard',
      floor: 'gravel',
    },
    {
      key: 'washbay',
      floor: 'tile',
    },
    {
      key: 'office',
      floor: 'carpet',
    },
  ],
  objects: [
    {
      key: 'car',
      walkable: true,
      placement: {
        kind: 'fixed',
        footprints: [
          [3, 2],
          [2, 3],
          [2, 2],
        ],
      },
      rooms: ['workshop', 'yard', 'washbay'],
      maxPerScene: 3,
      weight: 3,
    },
    {
      key: 'shelf',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [
          [2, 1],
          [1, 2],
        ],
      },
      rooms: ['storage', 'workshop', 'reception', 'office'],
      maxPerScene: 5,
      weight: 4,
    },
    {
      key: 'workbench',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [
          [3, 1],
          [1, 3],
          [2, 1],
        ],
      },
      rooms: ['workshop', 'storage', 'washbay'],
      maxPerScene: 3,
      weight: 3,
    },
    {
      key: 'oilstain',
      walkable: true,
      placement: {
        kind: 'fixed',
        footprints: [[1, 1]],
      },
      rooms: ['workshop', 'yard', 'storage', 'washbay'],
      maxPerScene: 6,
      weight: 5,
    },
    {
      key: 'tirestack',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [[1, 1]],
      },
      rooms: ['storage', 'workshop', 'yard', 'washbay'],
      maxPerScene: 5,
      weight: 4,
    },
    {
      key: 'chair',
      walkable: true,
      placement: {
        kind: 'fixed',
        footprints: [[1, 1]],
      },
      rooms: ['waiting', 'reception', 'office'],
      maxPerScene: 6,
      weight: 5,
    },
    {
      key: 'counter',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [
          [2, 1],
          [1, 2],
        ],
      },
      rooms: ['reception', 'office'],
      maxPerScene: 2,
      weight: 2,
    },
    {
      key: 'plant',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [[1, 1]],
      },
      rooms: ['waiting', 'reception', 'yard', 'office'],
      maxPerScene: 4,
      weight: 3,
    },
    {
      key: 'toolbox',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [[1, 1]],
      },
      rooms: ['workshop', 'storage', 'washbay', 'yard'],
      maxPerScene: 5,
      weight: 4,
    },
    {
      key: 'mat',
      walkable: true,
      placement: {
        kind: 'tiled',
        minCells: 1,
        maxCells: 4,
        compactness: 0.4,
        straightness: 0.5,
      },
      rooms: ['workshop', 'washbay', 'storage', 'reception'],
      maxPerScene: 4,
      weight: 4,
    },
    {
      key: 'pallet',
      walkable: true,
      placement: {
        kind: 'fixed',
        footprints: [
          [1, 1],
          [2, 1],
        ],
      },
      rooms: ['storage', 'yard', 'workshop', 'washbay'],
      maxPerScene: 4,
      weight: 4,
    },
    {
      key: 'barrel',
      walkable: false,
      placement: {
        kind: 'fixed',
        footprints: [[1, 1]],
      },
      rooms: ['yard', 'storage', 'washbay'],
      maxPerScene: 4,
      weight: 3,
    },
  ],
  texts: { de, en },
};
