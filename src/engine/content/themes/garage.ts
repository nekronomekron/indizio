import type { Theme } from './types.js';

const ROOMS = ['workshop', 'waiting', 'reception', 'storage', 'yard', 'washbay', 'office'] as const;

export const garage: Theme = {
  key: 'garage',
  roomKeys: ROOMS,
  objects: [
    { key: 'car', walkable: true, footprints: [[3, 2], [2, 3], [2, 2]], rooms: ['workshop', 'yard', 'washbay'], maxPerScene: 3, weight: 3 },
    { key: 'shelf', walkable: false, footprints: [[2, 1], [1, 2]], rooms: ['storage', 'workshop', 'reception', 'office'], maxPerScene: 5, weight: 4 },
    { key: 'workbench', walkable: false, footprints: [[3, 1], [1, 3], [2, 1]], rooms: ['workshop', 'storage', 'washbay'], maxPerScene: 3, weight: 3 },
    { key: 'oilstain', walkable: true, footprints: [[1, 1]], rooms: ['workshop', 'yard', 'storage', 'washbay'], maxPerScene: 6, weight: 5 },
    { key: 'tirestack', walkable: false, footprints: [[1, 1]], rooms: ['storage', 'workshop', 'yard', 'washbay'], maxPerScene: 5, weight: 4 },
    { key: 'chair', walkable: true, footprints: [[1, 1]], rooms: ['waiting', 'reception', 'office'], maxPerScene: 6, weight: 5 },
    { key: 'counter', walkable: false, footprints: [[2, 1], [1, 2]], rooms: ['reception', 'office'], maxPerScene: 2, weight: 2 },
    { key: 'plant', walkable: false, footprints: [[1, 1]], rooms: ['waiting', 'reception', 'yard', 'office'], maxPerScene: 4, weight: 3 },
    { key: 'toolbox', walkable: false, footprints: [[1, 1]], rooms: ['workshop', 'storage', 'washbay', 'yard'], maxPerScene: 5, weight: 4 },
    { key: 'mat', walkable: true, footprints: [[2, 1], [1, 2], [1, 1]], rooms: ['workshop', 'washbay', 'storage', 'reception'], maxPerScene: 4, weight: 4 },
    { key: 'pallet', walkable: true, footprints: [[1, 1], [2, 1]], rooms: ['storage', 'yard', 'workshop', 'washbay'], maxPerScene: 4, weight: 4 },
    { key: 'barrel', walkable: false, footprints: [[1, 1]], rooms: ['yard', 'storage', 'washbay'], maxPerScene: 4, weight: 3 },
  ],
};
