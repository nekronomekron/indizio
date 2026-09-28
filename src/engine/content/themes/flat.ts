import type { Theme } from './types.js';

const ROOMS = ['livingroom', 'kitchen', 'bedroom', 'hallway', 'bathroom', 'study', 'balcony'] as const;

export const flat: Theme = {
  key: 'flat',
  roomKeys: ROOMS,
  objects: [
    { key: 'sofa', walkable: true, placement: { kind: 'fixed', footprints: [[2, 1], [1, 2]] }, rooms: ['livingroom', 'study'], maxPerScene: 3, weight: 3 },
    { key: 'kitchenunit', walkable: false, placement: { kind: 'fixed', footprints: [[3, 1], [1, 3], [2, 1]] }, rooms: ['kitchen'], maxPerScene: 2, weight: 3 },
    { key: 'bed', walkable: true, placement: { kind: 'fixed', footprints: [[2, 2]] }, rooms: ['bedroom'], maxPerScene: 2, weight: 3 },
    { key: 'carpet', walkable: true, placement: { kind: 'tiled', minCells: 2, maxCells: 6, compactness: 0.7, straightness: 0.3 }, rooms: ['livingroom', 'bedroom', 'hallway', 'study'], maxPerScene: 4, weight: 4 },
    { key: 'bookshelf', walkable: false, placement: { kind: 'fixed', footprints: [[2, 1], [1, 2]] }, rooms: ['livingroom', 'bedroom', 'hallway', 'study'], maxPerScene: 5, weight: 4 },
    { key: 'table', walkable: false, placement: { kind: 'fixed', footprints: [[2, 1], [1, 2]] }, rooms: ['kitchen', 'livingroom', 'balcony', 'study'], maxPerScene: 4, weight: 3 },
    { key: 'chair', walkable: true, placement: { kind: 'fixed', footprints: [[1, 1]] }, rooms: ['kitchen', 'livingroom', 'bedroom', 'study', 'balcony'], maxPerScene: 6, weight: 5 },
    { key: 'plant', walkable: false, placement: { kind: 'fixed', footprints: [[1, 1]] }, rooms: ['livingroom', 'hallway', 'bathroom', 'balcony'], maxPerScene: 5, weight: 4 },
    { key: 'bathtub', walkable: true, placement: { kind: 'fixed', footprints: [[2, 1], [1, 2]] }, rooms: ['bathroom'], maxPerScene: 1, weight: 2 },
    { key: 'lamp', walkable: false, placement: { kind: 'fixed', footprints: [[1, 1]] }, rooms: ['livingroom', 'bedroom', 'study', 'hallway'], maxPerScene: 5, weight: 4 },
  ],
};
