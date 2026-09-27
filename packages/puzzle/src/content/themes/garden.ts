import type { Theme } from './types.js';

const ROOMS = ['lawn', 'patio', 'vegetablepatch', 'shedarea', 'pondside', 'greenhouse', 'playarea'] as const;

export const garden: Theme = {
  key: 'garden',
  roomKeys: ROOMS,
  objects: [
    { key: 'tree', walkable: false, footprints: [[1, 1]], rooms: ['lawn', 'pondside', 'shedarea', 'playarea'], maxPerScene: 6, weight: 5 },
    { key: 'flowerbed', walkable: false, footprints: [[2, 1], [1, 2]], rooms: ['vegetablepatch', 'lawn', 'patio', 'greenhouse'], maxPerScene: 5, weight: 4 },
    { key: 'gardenchair', walkable: true, footprints: [[1, 1]], rooms: ['patio', 'lawn', 'pondside', 'playarea', 'greenhouse', 'shedarea'], maxPerScene: 6, weight: 5 },
    { key: 'pond', walkable: true, footprints: [[2, 2], [2, 1]], rooms: ['pondside'], maxPerScene: 1, weight: 3 },
    { key: 'shed', walkable: false, footprints: [[2, 2], [2, 1]], rooms: ['shedarea'], maxPerScene: 1, weight: 3 },
    { key: 'bench', walkable: true, footprints: [[2, 1], [1, 2]], rooms: ['patio', 'lawn', 'pondside', 'greenhouse'], maxPerScene: 3, weight: 3 },
    { key: 'bush', walkable: false, footprints: [[1, 1]], rooms: ['lawn', 'patio', 'vegetablepatch', 'shedarea', 'playarea'], maxPerScene: 6, weight: 4 },
    { key: 'wheelbarrow', walkable: false, footprints: [[1, 1]], rooms: ['vegetablepatch', 'shedarea', 'greenhouse'], maxPerScene: 3, weight: 3 },
    { key: 'steppingstone', walkable: true, footprints: [[1, 1]], rooms: ['lawn', 'pondside', 'patio', 'vegetablepatch', 'shedarea', 'greenhouse', 'playarea'], maxPerScene: 6, weight: 5 },
    { key: 'sandbox', walkable: true, footprints: [[2, 2], [2, 1]], rooms: ['playarea'], maxPerScene: 1, weight: 3 },
  ],
};
